import type { PrismaClient } from '@prisma/client';
import { PrismaCartRepository } from '../cart/prisma-cart-repository.js';
import type { CheckoutRepository } from './checkout-service.js';

export class PrismaCheckoutRepository implements CheckoutRepository {
  private readonly carts: PrismaCartRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.carts = new PrismaCartRepository(prisma);
  }

  async findOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: BigInt(addressId), userId: BigInt(userId) }
    });
    if (!address) return null;
    return {
      id: address.id.toString(),
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail
    };
  }

  listCartItems(userId: string) {
    return this.carts.listItems(userId);
  }
}

export class DisabledShippingQuoteProvider {
  async quote(): Promise<never> {
    throw new Error('Shipping quote provider is not configured');
  }
}
