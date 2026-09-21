import { createHash } from 'node:crypto';

export type PaymentProviderName = 'MOCK' | 'DISABLED' | 'WECHAT' | 'ALIPAY';
export type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CLOSED' | 'UNKNOWN';
export type PaymentClientAction =
  | { readonly type: 'MOCK_CONFIRM'; readonly paymentId: string }
  | {
      readonly type: 'WECHAT_JSAPI'; readonly appId: string; readonly timeStamp: string;
      readonly nonceStr: string; readonly package: string; readonly signType: 'RSA'; readonly paySign: string;
    }
  | { readonly type: 'ALIPAY_TRADE'; readonly tradeNo: string };

export interface PaymentOrder {
  readonly id: string;
  readonly paymentNo: string;
  readonly orderId: string;
  readonly userId: string;
  readonly provider: PaymentProviderName;
  readonly status: PaymentStatus;
  readonly amountCent: number;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly providerPaymentId?: string;
  readonly clientAction: PaymentClientAction | null;
  readonly failureReason: string | null;
}

export interface PayableOrder {
  readonly id: string;
  readonly orderNo: string;
  readonly orderStatus: string;
  readonly paymentStatus: string;
  readonly payableAmountCent: number;
  readonly paidAmountCent: number;
}

export interface PaymentRepository {
  findOwnedOrder(userId: string, orderId: string): Promise<PayableOrder | null>;
  findByIdempotency(userId: string, idempotencyKey: string, requestHash: string): Promise<PaymentOrder | null>;
  claim(input: Omit<PaymentOrder, 'id' | 'paymentNo' | 'status' | 'clientAction' | 'failureReason'>): Promise<{
    readonly payment: PaymentOrder;
    readonly isNew: boolean;
  }>;
  markPending(paymentId: string, result: {
    readonly providerPaymentId: string;
    readonly clientAction: PaymentClientAction;
  }): Promise<PaymentOrder>;
  markFailed(paymentId: string, reason: string): Promise<PaymentOrder>;
  markUnknown(paymentId: string, reason: string): Promise<PaymentOrder>;
  findOwnedPayment(userId: string, paymentId: string): Promise<PaymentOrder | null>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(input: {
    readonly paymentId: string;
    readonly paymentNo: string;
    readonly orderNo: string;
    readonly amountCent: number;
  }): Promise<{ readonly providerPaymentId: string; readonly clientAction: PaymentClientAction }>;
}

export class PaymentProviderDisabledError extends Error {
  constructor() {
    super('Payment provider is disabled');
    this.name = 'PaymentProviderDisabledError';
  }
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'MOCK' as const;

  constructor(private readonly onCreate?: () => Promise<void>) {}

  async createPayment(input: Parameters<PaymentProvider['createPayment']>[0]) {
    await this.onCreate?.();
    return {
      providerPaymentId: `mock:${input.paymentNo}`,
      clientAction: { type: 'MOCK_CONFIRM' as const, paymentId: input.paymentId }
    };
  }
}

export class DisabledPaymentProvider implements PaymentProvider {
  readonly name = 'DISABLED' as const;

  async createPayment(): Promise<never> {
    throw new PaymentProviderDisabledError();
  }
}

export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly provider: PaymentProvider
  ) {}

  async create(userId: string, orderId: string, idempotencyKey: string): Promise<PaymentOrder> {
    assertPositiveId(userId, 'Invalid user id');
    assertUuid(orderId, 'Invalid order id');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      throw new Error('Invalid payment idempotency key');
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify({ orderId, provider: this.provider.name }))
      .digest('hex');
    const replay = await this.payments.findByIdempotency(userId, idempotencyKey, requestHash);
    if (replay) return replay;

    const order = await this.payments.findOwnedOrder(userId, orderId);
    if (!order) throw new Error('Order not found');
    if (order.orderStatus !== 'CREATED' || order.paymentStatus !== 'UNPAID'
      || order.paidAmountCent !== 0 || order.payableAmountCent < 1) {
      throw new Error('Order is not payable');
    }
    const claimed = await this.payments.claim({
      orderId: order.id,
      userId,
      provider: this.provider.name,
      amountCent: order.payableAmountCent,
      idempotencyKey,
      requestHash
    });
    if (!claimed.isNew) return claimed.payment;

    try {
      const result = await this.provider.createPayment({
        paymentId: claimed.payment.id,
        paymentNo: claimed.payment.paymentNo,
        orderNo: order.orderNo,
        amountCent: claimed.payment.amountCent
      });
      if (!isValidProviderResult(this.provider.name, claimed.payment.id, result)) {
        throw new Error('Invalid payment provider response');
      }
      return this.payments.markPending(claimed.payment.id, result);
    } catch (error) {
      if (error instanceof PaymentProviderDisabledError) {
        await this.payments.markFailed(claimed.payment.id, 'PAYMENT_PROVIDER_DISABLED');
        throw error;
      }
      await this.payments.markUnknown(claimed.payment.id, 'PROVIDER_RESULT_UNKNOWN');
      throw new Error('Payment result unknown', { cause: error });
    }
  }

  async get(userId: string, paymentId: string): Promise<PaymentOrder> {
    assertPositiveId(userId, 'Invalid user id');
    assertUuid(paymentId, 'Invalid payment id');
    const payment = await this.payments.findOwnedPayment(userId, paymentId);
    if (!payment) throw new Error('Payment not found');
    return payment;
  }
}

function isValidProviderResult(
  provider: PaymentProviderName,
  paymentId: string,
  result: { readonly providerPaymentId: string; readonly clientAction: PaymentClientAction }
): boolean {
  if (!/^[A-Za-z0-9:._-]{1,128}$/.test(result.providerPaymentId)) return false;
  if (provider === 'MOCK') {
    return result.clientAction.type === 'MOCK_CONFIRM' && result.clientAction.paymentId === paymentId;
  }
  if (provider === 'WECHAT') return result.clientAction.type === 'WECHAT_JSAPI';
  if (provider === 'ALIPAY') return result.clientAction.type === 'ALIPAY_TRADE';
  return false;
}

function assertPositiveId(value: string, message: string): void {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(message);
}

function assertUuid(value: string, message: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(message);
  }
}
