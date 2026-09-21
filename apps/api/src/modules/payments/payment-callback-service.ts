import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProviderName } from './payment-service.js';

export interface PaymentCallbackEvent {
  readonly eventId: string;
  readonly provider: PaymentProviderName;
  readonly providerPaymentId: string;
  readonly paymentNo: string;
  readonly amountCent: number;
  readonly status: 'SUCCEEDED';
  readonly paidAt: string;
}

export interface PaymentCallbackVerifier {
  verify(input: { readonly rawBody: string; readonly signature: string }): PaymentCallbackEvent;
}

export interface PaymentCallbackRepository {
  apply(event: PaymentCallbackEvent): Promise<{ readonly duplicate: boolean; readonly paymentId: string }>;
}

export class MockPaymentCallbackVerifier implements PaymentCallbackVerifier {
  constructor(private readonly secret: string) {
    if (secret.length < 16) throw new Error('Mock callback secret is too short');
  }

  verify(input: { readonly rawBody: string; readonly signature: string }): PaymentCallbackEvent {
    if (!/^[0-9a-f]{64}$/i.test(input.signature)) throw new Error('Invalid payment callback signature');
    const expected = createHmac('sha256', this.secret).update(input.rawBody).digest();
    const received = Buffer.from(input.signature, 'hex');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new Error('Invalid payment callback signature');
    }
    return parseEvent(input.rawBody);
  }
}

export class PaymentCallbackService {
  constructor(
    private readonly verifier: PaymentCallbackVerifier,
    private readonly callbacks: PaymentCallbackRepository
  ) {}

  async handle(input: { readonly rawBody: string; readonly signature: string }) {
    if (Buffer.byteLength(input.rawBody, 'utf8') > 65_536) {
      throw new Error('Payment callback body too large');
    }
    const event = this.verifier.verify(input);
    const result = await this.callbacks.apply(event);
    return { acknowledged: true, duplicate: result.duplicate } as const;
  }
}

function parseEvent(rawBody: string): PaymentCallbackEvent {
  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new Error('Invalid payment callback body');
  }
  if (!isRecord(value)
    || !isBoundedId(value.eventId, 128)
    || value.provider !== 'MOCK'
    || !isBoundedId(value.providerPaymentId, 128)
    || !isBoundedId(value.paymentNo, 34)
    || !Number.isSafeInteger(value.amountCent) || (value.amountCent as number) < 1
    || value.status !== 'SUCCEEDED'
    || typeof value.paidAt !== 'string' || !isIsoDate(value.paidAt)) {
    throw new Error('Invalid payment callback body');
  }
  return {
    eventId: value.eventId as string,
    provider: 'MOCK',
    providerPaymentId: value.providerPaymentId as string,
    paymentNo: value.paymentNo as string,
    amountCent: value.amountCent as number,
    status: 'SUCCEEDED',
    paidAt: value.paidAt as string
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedId(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= maxLength
    && /^[A-Za-z0-9:._-]+$/.test(value);
}

function isIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
