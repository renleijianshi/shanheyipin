import { createHash } from 'node:crypto';

export const TRANSPORT_STATUSES = ['UNKNOWN', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION'] as const;
export type ReceiptTransportStatus = typeof TRANSPORT_STATUSES[number];

export interface PurchaseReceiptItemInput {
  readonly skuId: string;
  readonly quantity: number;
  readonly grossWeightGram: number | null;
  readonly netWeightGram: number | null;
}

export interface PurchaseReceiptInput {
  readonly arrivedAt: string;
  readonly transportStatus: ReceiptTransportStatus;
  readonly grossWeightGram: number | null;
  readonly netWeightGram: number | null;
  readonly packagingDescription: string | null;
  readonly note: string | null;
  readonly items: readonly PurchaseReceiptItemInput[];
}

export interface PurchaseReceipt extends PurchaseReceiptInput {
  readonly id: string;
  readonly receiptNo: string;
  readonly purchaseOrderId: string;
  readonly purchaseNo: string;
  readonly createdAt: string;
}

export interface PurchaseReceiptRepository {
  create(
    purchaseOrderId: string,
    idempotencyKey: string,
    requestHash: string,
    input: PurchaseReceiptInput
  ): Promise<PurchaseReceipt>;
}

export class PurchaseReceiptService {
  constructor(private readonly receipts: PurchaseReceiptRepository) {}

  create(purchaseOrderId: string, idempotencyKey: string, input: PurchaseReceiptInput): Promise<PurchaseReceipt> {
    validateId(purchaseOrderId, 'purchase order');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid receipt idempotency key');
    const normalized = validate(input);
    const requestHash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    return this.receipts.create(purchaseOrderId, idempotencyKey, requestHash, normalized);
  }
}

function validate(input: PurchaseReceiptInput): PurchaseReceiptInput {
  const arrivedAt = new Date(input.arrivedAt);
  if (!Number.isFinite(arrivedAt.getTime()) || arrivedAt.toISOString() !== input.arrivedAt) {
    throw new Error('Invalid receipt arrival time');
  }
  if (!TRANSPORT_STATUSES.includes(input.transportStatus)) throw new Error('Invalid receipt transport status');
  const grossWeightGram = validateWeight(input.grossWeightGram);
  const netWeightGram = validateWeight(input.netWeightGram);
  if (grossWeightGram !== null && netWeightGram !== null && netWeightGram > grossWeightGram) {
    throw new Error('Net weight cannot exceed gross weight');
  }
  const packagingDescription = normalizeOptional(input.packagingDescription, 255, 'packaging description');
  const note = normalizeOptional(input.note, 500, 'receipt note');
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) {
    throw new Error('Invalid receipt items');
  }
  const items = input.items.map((item) => {
    validateId(item.skuId, 'SKU');
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000) {
      throw new Error('Invalid received quantity');
    }
    const itemGross = validateWeight(item.grossWeightGram);
    const itemNet = validateWeight(item.netWeightGram);
    if (itemGross !== null && itemNet !== null && itemNet > itemGross) throw new Error('Net weight cannot exceed gross weight');
    return { skuId: item.skuId, quantity: item.quantity, grossWeightGram: itemGross, netWeightGram: itemNet };
  });
  if (new Set(items.map((item) => item.skuId)).size !== items.length) throw new Error('Duplicate receipt SKU');
  return {
    arrivedAt: input.arrivedAt, transportStatus: input.transportStatus,
    grossWeightGram, netWeightGram, packagingDescription, note: note || null, items
  };
}

function validateWeight(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0 || value > 4_294_967_295) throw new Error('Invalid receipt weight');
  return value;
}

function normalizeOptional(value: string | null, max: number, field: string): string | null {
  if (value === null) return null;
  const normalized = value.trim().normalize('NFC');
  if (normalized.length > max) throw new Error(`Invalid ${field}`);
  return normalized || null;
}

function validateId(value: string, entity: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${entity} id`);
  }
}
