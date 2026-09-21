import { createHash } from 'node:crypto';
import type {
  CheckoutPreview,
  OrderAftersaleStatus,
  OrderAddressSnapshot,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  OrderPriceDetail,
  OrderStatus,
  OrderStatusLog,
  OrderItemSnapshot
} from '@shanheyipin/shared-types';

export interface PersistedOrder {
  readonly id: string;
  readonly orderNo: string;
  readonly orderType: 'STANDARD';
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: OrderPaymentStatus;
  readonly fulfillmentStatus: OrderFulfillmentStatus;
  readonly aftersaleStatus: OrderAftersaleStatus;
  readonly goodsAmountCent: number;
  readonly discountAmountCent: number;
  readonly freightAmountCent: number;
  readonly payableAmountCent: number;
  readonly paidAmountCent: number;
  readonly createdAt: string;
  readonly items: readonly OrderItemSnapshot[];
  readonly address: OrderAddressSnapshot;
  readonly priceDetails: readonly OrderPriceDetail[];
  readonly statusLogs: readonly OrderStatusLog[];
}

export interface CheckoutPreviewProvider {
  preview(userId: string, input: {
    readonly addressId: string;
    readonly cartItemIds: readonly string[];
  }): Promise<CheckoutPreview>;
}

export interface OrderRepository {
  findByIdempotency(userId: string, idempotencyKey: string, requestHash: string): Promise<PersistedOrder | null>;
  create(input: {
    readonly userId: string;
    readonly idempotencyKey: string;
    readonly requestHash: string;
    readonly cartItemIds: readonly string[];
    readonly preview: CheckoutPreview;
  }): Promise<PersistedOrder>;
  list(userId: string, query: { readonly page: number; readonly pageSize: number }): Promise<{
    readonly items: readonly PersistedOrder[];
    readonly total: number;
  }>;
  findOwned(userId: string, orderId: string): Promise<PersistedOrder | null>;
  cancel(userId: string, orderId: string, reason: string): Promise<PersistedOrder>;
}

export class OrderService {
  constructor(
    private readonly checkout: CheckoutPreviewProvider,
    private readonly orders: OrderRepository
  ) {}

  async create(
    userId: string,
    idempotencyKey: string,
    input: { readonly addressId: string; readonly cartItemIds: readonly string[] }
  ): Promise<PersistedOrder> {
    assertUserId(userId);
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid idempotency key');
    const requestHash = hashIntent(input);
    const replay = await this.orders.findByIdempotency(userId, idempotencyKey, requestHash);
    if (replay) return replay;
    const preview = await this.checkout.preview(userId, input);
    return this.orders.create({ userId, idempotencyKey, requestHash, cartItemIds: input.cartItemIds, preview });
  }

  async list(userId: string, query: { readonly page: number; readonly pageSize: number }) {
    assertUserId(userId);
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid order page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 50) {
      throw new Error('Invalid order page size');
    }
    return this.orders.list(userId, query);
  }

  async get(userId: string, orderId: string): Promise<PersistedOrder> {
    assertUserId(userId);
    assertOrderId(orderId);
    const order = await this.orders.findOwned(userId, orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async cancel(userId: string, orderId: string, reason: string): Promise<PersistedOrder> {
    assertUserId(userId);
    assertOrderId(orderId);
    const normalizedReason = reason.trim().normalize('NFC');
    if (normalizedReason.length < 1 || normalizedReason.length > 200) throw new Error('Invalid cancellation reason');
    return this.orders.cancel(userId, orderId, normalizedReason);
  }
}

function hashIntent(input: { readonly addressId: string; readonly cartItemIds: readonly string[] }): string {
  return createHash('sha256').update(JSON.stringify({
    addressId: input.addressId,
    cartItemIds: [...input.cartItemIds].sort()
  })).digest('hex');
}

function assertUserId(userId: string): void {
  if (!/^[1-9]\d*$/.test(userId)) throw new Error('Invalid user id');
}

function assertOrderId(orderId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new Error('Invalid order id');
  }
}
