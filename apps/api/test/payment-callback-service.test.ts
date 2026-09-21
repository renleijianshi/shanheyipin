import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  MockPaymentCallbackVerifier,
  PaymentCallbackService,
  type PaymentCallbackEvent,
  type PaymentCallbackRepository
} from '../src/modules/payments/payment-callback-service.js';

const secret = 'local-test-secret-only';
const event: PaymentCallbackEvent = {
  eventId: 'evt_mock_001', provider: 'MOCK', providerPaymentId: 'mock:PM001',
  paymentNo: 'PM001', amountCent: 34800, status: 'SUCCEEDED', paidAt: '2026-09-21T06:30:00.000Z'
};

function signedBody(value: PaymentCallbackEvent) {
  const rawBody = JSON.stringify(value);
  return { rawBody, signature: createHmac('sha256', secret).update(rawBody).digest('hex') };
}

function repository(expectedAmount = 34800): PaymentCallbackRepository {
  const seen = new Set<string>();
  return {
    apply: async (received) => {
      if (received.amountCent !== expectedAmount) throw new Error('Payment callback amount mismatch');
      if (seen.has(received.eventId)) return { duplicate: true, paymentId: 'pay-public-id' };
      seen.add(received.eventId);
      return { duplicate: false, paymentId: 'pay-public-id' };
    }
  };
}

describe('PaymentCallbackService', () => {
  it('verifies a signed mock callback and applies it once', async () => {
    const repo = repository();
    const service = new PaymentCallbackService(new MockPaymentCallbackVerifier(secret), repo);
    const request = signedBody(event);
    await expect(service.handle(request)).resolves.toEqual({ acknowledged: true, duplicate: false });
  });

  it('acknowledges duplicate notifications without applying payment twice', async () => {
    const repo = repository();
    const service = new PaymentCallbackService(new MockPaymentCallbackVerifier(secret), repo);
    const request = signedBody(event);
    await service.handle(request);
    await expect(service.handle(request)).resolves.toEqual({ acknowledged: true, duplicate: true });
  });

  it('rejects invalid signatures and malformed or oversized bodies', async () => {
    const service = new PaymentCallbackService(new MockPaymentCallbackVerifier(secret), repository());
    await expect(service.handle({ rawBody: JSON.stringify(event), signature: '0'.repeat(64) }))
      .rejects.toThrow('Invalid payment callback signature');
    await expect(service.handle({ rawBody: '{bad json', signature: '0'.repeat(64) }))
      .rejects.toThrow();
    await expect(service.handle({ rawBody: 'x'.repeat(65537), signature: '0'.repeat(64) }))
      .rejects.toThrow('Payment callback body too large');
  });

  it('rejects signed callbacks with an altered amount', async () => {
    const service = new PaymentCallbackService(new MockPaymentCallbackVerifier(secret), repository());
    await expect(service.handle(signedBody({ ...event, amountCent: 1 })))
      .rejects.toThrow('Payment callback amount mismatch');
  });
});
