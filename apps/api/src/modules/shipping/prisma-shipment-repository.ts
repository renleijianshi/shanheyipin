import { randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Shipment } from '@shanheyipin/shared-types';
import { evaluateShipmentAllocation, type ShipmentRepository } from './shipment-service.js';

const includeShipment = {
  order: { select: { publicId: true } },
  items: { orderBy: { id: 'asc' as const }, include: { orderItem: { select: { publicId: true } } } }
} satisfies Prisma.ShipmentInclude;

type ShipmentRecord = Prisma.ShipmentGetPayload<{ include: typeof includeShipment }>;

export class PrismaShipmentRepository implements ShipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: Parameters<ShipmentRepository['create']>[0]): Promise<Shipment> {
    const replay = await this.findByIdempotency(
      input.adminUserId, input.orderId, input.idempotencyKey, input.requestHash
    );
    if (replay) return replay;
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const adminId = BigInt(input.adminUserId);
        const admin = await tx.adminUser.findUnique({ where: { id: adminId }, select: { status: true } });
        if (!admin || admin.status !== 'ACTIVE') throw new Error('Admin user unavailable');
        const order = await tx.order.findUnique({
          where: { publicId: input.orderId }, include: { items: { orderBy: { id: 'asc' } } }
        });
        if (!order) throw new Error('Order not found');
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`;
        const duplicate = await tx.shipment.findUnique({
          where: { orderId_idempotencyKey: { orderId: order.id, idempotencyKey: input.idempotencyKey } },
          include: includeShipment
        });
        if (duplicate) {
          if (duplicate.requestHash !== input.requestHash) {
            throw new Error('Shipment idempotency key reused with different request');
          }
          return duplicate;
        }
        const locked = await tx.order.findUnique({ where: { id: order.id } });
        if (!locked || locked.orderStatus !== 'WAIT_SHIP' || locked.fulfillmentStatus !== 'WAIT_SHIP') {
          throw new Error('Order is not ready to ship');
        }

        const requestedIds = input.shipment.items.map((item) => item.orderItemId);
        const selected = order.items.filter((item) => requestedIds.includes(item.publicId));
        const shipped = await tx.shipmentItem.groupBy({
          by: ['orderItemId'], where: { orderItem: { orderId: order.id } }, _sum: { quantity: true }
        });
        const shippedByItem = new Map(shipped.map((row) => [row.orderItemId, row._sum.quantity ?? 0]));
        const selectedByPublicId = new Map(selected.map((item) => [item.publicId, item]));
        const allocation = evaluateShipmentAllocation(
          order.items.map((item) => ({ id: item.publicId, quantity: item.quantity })),
          new Map(order.items.map((item) => [item.publicId, shippedByItem.get(item.id) ?? 0])),
          input.shipment.items
        );
        const shipment = await tx.shipment.create({
          data: {
            shipmentNo: `SP${randomBytes(16).toString('hex').toUpperCase()}`,
            orderId: order.id, shippedByAdminId: adminId, idempotencyKey: input.idempotencyKey,
            requestHash: input.requestHash, carrierCode: input.shipment.carrierCode,
            carrierName: input.shipment.carrierName, trackingNo: input.shipment.trackingNo,
            items: { create: input.shipment.items.map((item) => ({
              orderItemId: selectedByPublicId.get(item.orderItemId)!.id, quantity: item.quantity
            })) }
          }, include: includeShipment
        });
        if (allocation.fullyShipped) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'SHIPPED', fulfillmentStatus: 'SHIPPED', shippedAt: shipment.shippedAt,
              statusLogs: { create: { fromStatus: 'WAIT_SHIP', toStatus: 'SHIPPED', reason: 'ORDER_FULLY_SHIPPED' } }
            }
          });
        }
        return shipment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      return toShipment(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.findByIdempotency(
          input.adminUserId, input.orderId, input.idempotencyKey, input.requestHash
        );
        if (raced) return raced;
      }
      throw error;
    }
  }

  async findByIdempotency(
    adminUserId: string, orderId: string, key: string, requestHash: string
  ): Promise<Shipment | null> {
    const row = await this.prisma.shipment.findFirst({
      where: {
        order: { publicId: orderId }, shippedByAdminId: BigInt(adminUserId), idempotencyKey: key
      }, include: includeShipment
    });
    return row ? replayShipment(row, requestHash) : null;
  }

  async listOwned(userId: string, orderId: string): Promise<readonly Shipment[] | null> {
    const order = await this.prisma.order.findFirst({
      where: { publicId: orderId, userId: BigInt(userId) }, select: { id: true }
    });
    if (!order) return null;
    const rows = await this.prisma.shipment.findMany({
      where: { orderId: order.id }, include: includeShipment, orderBy: { createdAt: 'asc' }
    });
    return rows.map(toShipment);
  }
}

function replayShipment(row: ShipmentRecord, requestHash: string): Shipment {
  if (row.requestHash !== requestHash) throw new Error('Shipment idempotency key reused with different request');
  return toShipment(row);
}

function toShipment(row: ShipmentRecord): Shipment {
  return {
    id: row.publicId, shipmentNo: row.shipmentNo, orderId: row.order.publicId, status: row.status,
    carrierCode: row.carrierCode, carrierName: row.carrierName, trackingNo: row.trackingNo,
    items: row.items.map((item) => ({ orderItemId: item.orderItem.publicId, quantity: item.quantity })),
    shippedAt: row.shippedAt.toISOString(), deliveredAt: row.deliveredAt?.toISOString() ?? null
  };
}
