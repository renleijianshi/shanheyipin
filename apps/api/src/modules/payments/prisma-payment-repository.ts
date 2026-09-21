import { randomBytes } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  PaymentClientAction,
  PaymentOrder,
  PaymentRepository,
  PaymentStatus
} from './payment-service.js';

const paymentInclude = { order: { select: { publicId: true } } } satisfies Prisma.PaymentOrderInclude;
type PaymentOrderRecord = Prisma.PaymentOrderGetPayload<{ include: typeof paymentInclude }>;

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOwnedOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { publicId: orderId, userId: BigInt(userId) },
      select: {
        publicId: true, orderNo: true, orderStatus: true, paymentStatus: true,
        payableAmountCent: true, paidAmountCent: true
      }
    });
    return order ? { id: order.publicId, ...order } : null;
  }

  async findByIdempotency(userId: string, idempotencyKey: string, requestHash: string) {
    const payment = await this.prisma.paymentOrder.findUnique({
      where: { userId_idempotencyKey: { userId: BigInt(userId), idempotencyKey } },
      include: paymentInclude
    });
    if (!payment) return null;
    if (payment.requestHash !== requestHash) throw new Error('Payment idempotency key reused');
    return toPayment(payment);
  }

  async claim(input: Parameters<PaymentRepository['claim']>[0]) {
    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const userId = BigInt(input.userId);
        const order = await tx.order.findFirst({
          where: { publicId: input.orderId, userId },
          select: {
            id: true, publicId: true, orderStatus: true, paymentStatus: true,
            payableAmountCent: true, paidAmountCent: true
          }
        });
        if (!order) throw new Error('Order not found');
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`;
        const locked = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
        if (locked.orderStatus !== 'CREATED' || locked.paymentStatus !== 'UNPAID'
          || locked.paidAmountCent !== 0 || locked.payableAmountCent !== input.amountCent) {
          throw new Error('Order is not payable');
        }
        return tx.paymentOrder.create({
          data: {
            paymentNo: `PM${randomBytes(16).toString('hex').toUpperCase()}`,
            orderId: locked.id,
            userId,
            provider: input.provider,
            amountCent: input.amountCent,
            idempotencyKey: input.idempotencyKey,
            requestHash: input.requestHash
          },
          include: paymentInclude
        });
      });
      return { payment: toPayment(payment), isNew: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.findByIdempotency(input.userId, input.idempotencyKey, input.requestHash);
        if (raced) return { payment: raced, isNew: false };
      }
      throw error;
    }
  }

  markPending(paymentId: string, result: {
    readonly providerPaymentId: string;
    readonly clientAction: PaymentClientAction;
  }) {
    return this.transition(paymentId, 'PENDING', {
      providerPaymentId: result.providerPaymentId,
      clientAction: result.clientAction
    });
  }

  markFailed(paymentId: string, reason: string) {
    return this.transition(paymentId, 'FAILED', { failureReason: reason });
  }

  markUnknown(paymentId: string, reason: string) {
    return this.transition(paymentId, 'UNKNOWN', { failureReason: reason });
  }

  async findOwnedPayment(userId: string, paymentId: string): Promise<PaymentOrder | null> {
    const payment = await this.prisma.paymentOrder.findFirst({
      where: { publicId: paymentId, userId: BigInt(userId) },
      include: paymentInclude
    });
    return payment ? toPayment(payment) : null;
  }

  private async transition(
    paymentId: string,
    status: Extract<PaymentStatus, 'PENDING' | 'FAILED' | 'UNKNOWN'>,
    data: { readonly providerPaymentId?: string; readonly clientAction?: PaymentClientAction; readonly failureReason?: string }
  ): Promise<PaymentOrder> {
    const payment = await this.prisma.$transaction(async (tx) => {
      const current = await tx.paymentOrder.findUnique({ where: { publicId: paymentId } });
      if (!current) throw new Error('Payment not found');
      await tx.$queryRaw`SELECT id FROM payment_orders WHERE id = ${current.id} FOR UPDATE`;
      const locked = await tx.paymentOrder.findUniqueOrThrow({ where: { id: current.id } });
      if (locked.status === status) {
        return tx.paymentOrder.findUniqueOrThrow({ where: { id: locked.id }, include: paymentInclude });
      }
      if (locked.status !== 'CREATED') throw new Error('Invalid payment state transition');
      const updateData: Prisma.PaymentOrderUpdateInput = {
        status,
        ...(data.providerPaymentId === undefined ? {} : { providerPaymentId: data.providerPaymentId }),
        ...(data.clientAction === undefined
          ? {}
          : { clientAction: data.clientAction as Prisma.InputJsonValue }),
        ...(data.failureReason === undefined ? {} : { failureReason: data.failureReason })
      };
      return tx.paymentOrder.update({
        where: { id: locked.id },
        data: updateData,
        include: paymentInclude
      });
    });
    return toPayment(payment);
  }
}

function toPayment(row: PaymentOrderRecord): PaymentOrder {
  return {
    id: row.publicId,
    paymentNo: row.paymentNo,
    orderId: row.order.publicId,
    userId: row.userId.toString(),
    provider: row.provider,
    status: row.status,
    amountCent: row.amountCent,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    ...(row.providerPaymentId === null ? {} : { providerPaymentId: row.providerPaymentId }),
    clientAction: parseClientAction(row.clientAction),
    failureReason: row.failureReason
  };
}

function parseClientAction(value: Prisma.JsonValue): PaymentClientAction | null {
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value) || typeof value.type !== 'string') {
    throw new Error('Invalid payment client action');
  }
  if (value.type === 'MOCK_CONFIRM' && typeof value.paymentId === 'string') {
    return { type: 'MOCK_CONFIRM', paymentId: value.paymentId };
  }
  if (value.type === 'ALIPAY_TRADE' && typeof value.tradeNo === 'string') {
    return { type: 'ALIPAY_TRADE', tradeNo: value.tradeNo };
  }
  if (value.type === 'WECHAT_JSAPI'
    && typeof value.appId === 'string' && typeof value.timeStamp === 'string'
    && typeof value.nonceStr === 'string' && typeof value.package === 'string'
    && value.signType === 'RSA' && typeof value.paySign === 'string') {
    return {
      type: 'WECHAT_JSAPI', appId: value.appId, timeStamp: value.timeStamp,
      nonceStr: value.nonceStr, package: value.package, signType: 'RSA', paySign: value.paySign
    };
  }
  throw new Error('Invalid payment client action');
}
