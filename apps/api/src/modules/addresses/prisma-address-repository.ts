import type { Prisma, PrismaClient } from '@prisma/client';
import type { Address, AddressInput, AddressRepository } from './address-service.js';

export class PrismaAddressRepository implements AddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string): Promise<Address[]> {
    const rows = await this.prisma.userAddress.findMany({
      where: { userId: BigInt(userId) }, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
    });
    return rows.map(toAddress);
  }

  create(userId: string, input: AddressInput): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId);
      await lockUser(tx, ownerId);
      if (input.isDefault) await tx.userAddress.updateMany({ where: { userId: ownerId }, data: { isDefault: false } });
      return toAddress(await tx.userAddress.create({ data: { userId: ownerId, ...input } }));
    });
  }

  update(userId: string, addressId: string, input: AddressInput): Promise<Address> {
    return this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId); const id = BigInt(addressId);
      await lockUser(tx, ownerId);
      const owned = await tx.userAddress.findFirst({ where: { id, userId: ownerId } });
      if (!owned) throw new Error('Address not found');
      if (input.isDefault) await tx.userAddress.updateMany({ where: { userId: ownerId }, data: { isDefault: false } });
      return toAddress(await tx.userAddress.update({ where: { id }, data: input }));
    });
  }

  remove(userId: string, addressId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const ownerId = BigInt(userId); const id = BigInt(addressId);
      await lockUser(tx, ownerId);
      const owned = await tx.userAddress.findFirst({ where: { id, userId: ownerId } });
      if (!owned) throw new Error('Address not found');
      await tx.userAddress.delete({ where: { id } });
      if (owned.isDefault) {
        const next = await tx.userAddress.findFirst({ where: { userId: ownerId }, orderBy: { updatedAt: 'desc' } });
        if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }
}

async function lockUser(tx: Prisma.TransactionClient, userId: bigint): Promise<void> {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

function toAddress(row: { id: bigint; recipientName: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean }): Address {
  return { id: row.id.toString(), recipientName: row.recipientName, phone: row.phone, province: row.province, city: row.city, district: row.district, detail: row.detail, isDefault: row.isDefault };
}
