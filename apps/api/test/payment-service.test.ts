import { describe, expect, it } from 'vitest';
import {
  DisabledPaymentProvider,
  MockPaymentProvider,
  PaymentProviderDisabledError,
  PaymentService,
  type PaymentOrder,
  type PaymentRepository
} from '../src/modules/payments/payment-service.js';

const orderId = 'f410126b-b44a-483f-aad5-8dfb83382599';
const paymentId = 'e0c75503-e3d5-4bd3-982f-dfef733736ac';

function repository(): PaymentRepository & { records: PaymentOrder[] } {
  const repo = {
    records: [] as PaymentOrder[],
    findOwnedOrder: async (_userId: string, id: string) => id === orderId ? {
      id: orderId, orderNo: 'SH20260921A1B2C3D4E5F6', orderStatus: 'CREATED' as const,
      paymentStatus: 'UNPAID' as const, payableAmountCent: 34800, paidAmountCent: 0
    } : null,
    findByIdempotency: async (_userId: string, key: string, hash: string) => {
      const found = repo.records.find((item) => item.idempotencyKey === key);
      if (found && found.requestHash !== hash) throw new Error('Payment idempotency key reused');
      return found ?? null;
    },
    claim: async (input: Omit<PaymentOrder, 'id' | 'paymentNo' | 'status' | 'clientAction' | 'failureReason'>) => {
      const existing = repo.records.find((item) => item.idempotencyKey === input.idempotencyKey);
      if (existing) return { payment: existing, isNew: false };
      const payment: PaymentOrder = {
        ...input, id: paymentId, paymentNo: 'PMOCK202609210001', status: 'CREATED',
        clientAction: null, failureReason: null
      };
      repo.records.push(payment);
      return { payment, isNew: true };
    },
    markPending: async (id: string, result: { providerPaymentId: string; clientAction: PaymentOrder['clientAction'] }) => {
      const current = repo.records.find((item) => item.id === id)!;
      const updated = { ...current, status: 'PENDING' as const, ...result };
      repo.records = repo.records.map((item) => item.id === id ? updated : item);
      return updated;
    },
    markFailed: async (id: string, reason: string) => update(repo, id, 'FAILED', reason),
    markUnknown: async (id: string, reason: string) => update(repo, id, 'UNKNOWN', reason),
    findOwnedPayment: async (_userId: string, id: string) => repo.records.find((item) => item.id === id) ?? null
  };
  return repo;
}

function update(
  repo: ReturnType<typeof repository>, id: string, status: 'FAILED' | 'UNKNOWN', reason: string
): PaymentOrder {
  const current = repo.records.find((item) => item.id === id)!;
  const updated = { ...current, status, failureReason: reason };
  repo.records = repo.records.map((item) => item.id === id ? updated : item);
  return updated;
}

describe('PaymentService', () => {
  it('creates a mock payment intent without real merchant credentials', async () => {
    const service = new PaymentService(repository(), new MockPaymentProvider());
    await expect(service.create('42', orderId, 'payment:web:abc12345')).resolves.toMatchObject({
      id: paymentId, provider: 'MOCK', status: 'PENDING', amountCent: 34800,
      clientAction: { type: 'MOCK_CONFIRM', paymentId }
    });
  });

  it('replays the claimed payment without invoking the provider twice', async () => {
    const repo = repository();
    let calls = 0;
    const provider = new MockPaymentProvider(async () => { calls += 1; });
    const service = new PaymentService(repo, provider);
    const first = await service.create('42', orderId, 'payment:web:abc12345');
    const replay = await service.create('42', orderId, 'payment:web:abc12345');
    expect(replay.id).toBe(first.id);
    expect(calls).toBe(1);
  });

  it('fails closed when payments are disabled', async () => {
    const repo = repository();
    const service = new PaymentService(repo, new DisabledPaymentProvider());
    await expect(service.create('42', orderId, 'payment:web:abc12345'))
      .rejects.toBeInstanceOf(PaymentProviderDisabledError);
    expect(repo.records[0]).toMatchObject({ status: 'FAILED', failureReason: 'PAYMENT_PROVIDER_DISABLED' });
  });

  it('records an unknown result for provider timeouts instead of retrying blindly', async () => {
    const repo = repository();
    const service = new PaymentService(repo, {
      name: 'MOCK',
      createPayment: async () => { throw new Error('timeout'); }
    });
    await expect(service.create('42', orderId, 'payment:web:abc12345'))
      .rejects.toThrow('Payment result unknown');
    expect(repo.records[0]).toMatchObject({ status: 'UNKNOWN', failureReason: 'PROVIDER_RESULT_UNKNOWN' });
  });

  it('rejects paid, cancelled, foreign or malformed orders', async () => {
    const repo = repository();
    const service = new PaymentService(repo, new MockPaymentProvider());
    repo.findOwnedOrder = async () => ({
      id: orderId, orderNo: 'SH1', orderStatus: 'CANCELLED', paymentStatus: 'CLOSED',
      payableAmountCent: 34800, paidAmountCent: 0
    });
    await expect(service.create('42', orderId, 'payment:web:abc12345')).rejects.toThrow('Order is not payable');
    await expect(service.create('42', '../order', 'payment:web:abc12345')).rejects.toThrow('Invalid order id');
    await expect(service.create('42', orderId, 'short')).rejects.toThrow('Invalid payment idempotency key');
  });
});
