import { createHash } from 'node:crypto';
import type { Aftersale, AftersaleType } from '@shanheyipin/shared-types';

export interface CreateAftersaleInput { readonly orderId: string; readonly type: AftersaleType; readonly reason: string; readonly description: string; readonly items: readonly { readonly orderItemId: string; readonly quantity: number }[]; }
export interface AftersaleRepository {
  findByIdempotency(userId: string, key: string, hash: string): Promise<Aftersale | null>;
  create(input: { readonly userId: string; readonly key: string; readonly hash: string; readonly request: CreateAftersaleInput }): Promise<Aftersale>;
  listOwned(userId: string): Promise<readonly Aftersale[]>;
  findOwned(userId: string, aftersaleId: string): Promise<Aftersale | null>;
  decide(adminUserId: string, aftersaleId: string, approved: boolean, note: string): Promise<Aftersale>;
}

export class AftersaleService {
  constructor(private readonly aftersales: AftersaleRepository) {}
  async create(userId: string, key: string, input: CreateAftersaleInput): Promise<Aftersale> {
    assertNumeric(userId, 'user');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Invalid aftersale idempotency key');
    const request = normalize(input);
    const hash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
    return await this.aftersales.findByIdempotency(userId, key, hash)
      ?? this.aftersales.create({ userId, key, hash, request });
  }
  list(userId: string) { assertNumeric(userId, 'user'); return this.aftersales.listOwned(userId); }
  async get(userId: string, id: string) { assertNumeric(userId, 'user'); assertUuid(id, 'aftersale'); const row = await this.aftersales.findOwned(userId, id); if (!row) throw new Error('Aftersale not found'); return row; }
  decide(adminUserId: string, id: string, approved: boolean, note: string) {
    assertNumeric(adminUserId, 'admin user'); assertUuid(id, 'aftersale');
    const normalized = note.trim().normalize('NFC'); if (normalized.length < 1 || normalized.length > 200) throw new Error('Invalid decision note');
    return this.aftersales.decide(adminUserId, id, approved, normalized);
  }
}

function normalize(input: CreateAftersaleInput): CreateAftersaleInput {
  assertUuid(input.orderId, 'order');
  if (!['REFUND_ONLY','RETURN_REFUND','RESHIP','COMPENSATION'].includes(input.type)) throw new Error('Invalid aftersale type');
  const reason = input.reason.trim().normalize('NFC'); const description = input.description.trim().normalize('NFC');
  if (reason.length < 1 || reason.length > 100) throw new Error('Invalid aftersale reason');
  if (description.length < 1 || description.length > 500) throw new Error('Invalid aftersale description');
  if (input.items.length < 1 || input.items.length > 100) throw new Error('Invalid aftersale items');
  const seen = new Set<string>();
  const items = input.items.map((item) => { assertUuid(item.orderItemId, 'order item'); if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Invalid aftersale quantity'); if (seen.has(item.orderItemId)) throw new Error('Duplicate aftersale item'); seen.add(item.orderItemId); return { orderItemId: item.orderItemId.toLowerCase(), quantity: item.quantity }; }).sort((a,b) => a.orderItemId.localeCompare(b.orderItemId));
  return { orderId: input.orderId.toLowerCase(), type: input.type, reason, description, items };
}
function assertNumeric(value: string, label: string) { if (!/^[1-9]\d*$/.test(value)) throw new Error(`Invalid ${label} id`); }
function assertUuid(value: string, label: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`Invalid ${label} id`); }
