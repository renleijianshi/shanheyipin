export const PURCHASE_ORDER_STATUSES = [
  'DRAFT', 'APPROVED', 'ORDERED', 'PART_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'
] as const;
export type PurchaseOrderStatus = typeof PURCHASE_ORDER_STATUSES[number];

export interface PurchaseOrderItemInput {
  readonly skuId: string;
  readonly quantity: number;
  readonly unitCostCent: number;
}

export interface PurchaseOrderInput {
  readonly supplierId: string;
  readonly expectedAt: string | null;
  readonly note: string | null;
  readonly items: readonly PurchaseOrderItemInput[];
}

export interface PurchaseOrderItem extends PurchaseOrderItemInput {
  readonly skuCode: string;
  readonly skuName: string;
  readonly receivedQuantity: number;
  readonly lineAmountCent: number;
}

export interface PurchaseOrder {
  readonly id: string;
  readonly purchaseNo: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly status: PurchaseOrderStatus;
  readonly expectedAt: string | null;
  readonly totalAmountCent: number;
  readonly note: string | null;
  readonly items: readonly PurchaseOrderItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PurchaseOrderRepository {
  list(query: { readonly page: number; readonly pageSize: number; readonly status?: PurchaseOrderStatus; readonly supplierId?: string }): Promise<{
    readonly items: readonly PurchaseOrder[]; readonly total: number;
  }>;
  findByPublicId(publicId: string): Promise<PurchaseOrder | null>;
  create(input: PurchaseOrderInput): Promise<PurchaseOrder>;
  updateDraft(publicId: string, input: PurchaseOrderInput): Promise<PurchaseOrder>;
  transition(publicId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder>;
}

export class PurchaseOrderService {
  constructor(private readonly orders: PurchaseOrderRepository) {}

  list(query: { readonly page: number; readonly pageSize: number; readonly status?: PurchaseOrderStatus; readonly supplierId?: string }) {
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid purchase order page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) {
      throw new Error('Invalid purchase order page size');
    }
    if (query.status !== undefined && !isStatus(query.status)) throw new Error('Invalid purchase order status');
    if (query.supplierId !== undefined) validateId(query.supplierId, 'supplier');
    return this.orders.list(query);
  }

  async get(publicId: string): Promise<PurchaseOrder> {
    validateId(publicId, 'purchase order');
    const order = await this.orders.findByPublicId(publicId);
    if (!order) throw new Error('Purchase order not found');
    return order;
  }

  create(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    return this.orders.create(validate(input));
  }

  async updateDraft(publicId: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
    validateId(publicId, 'purchase order');
    const order = await this.get(publicId);
    if (order.status !== 'DRAFT') throw new Error('Only draft purchase orders can be edited');
    return this.orders.updateDraft(publicId, validate(input));
  }

  async transition(publicId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    validateId(publicId, 'purchase order');
    if (!isStatus(status)) throw new Error('Invalid purchase order status');
    const order = await this.get(publicId);
    const allowed: Readonly<Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]>> = {
      DRAFT: ['APPROVED', 'CANCELLED'],
      APPROVED: ['ORDERED', 'CANCELLED'],
      ORDERED: ['CANCELLED'],
      PART_RECEIVED: [],
      RECEIVED: ['CLOSED'],
      CLOSED: [],
      CANCELLED: []
    };
    if (!allowed[order.status].includes(status)) throw new Error(`Invalid purchase order transition: ${order.status} -> ${status}`);
    return this.orders.transition(publicId, status);
  }
}

function validate(input: PurchaseOrderInput): PurchaseOrderInput {
  validateId(input.supplierId, 'supplier');
  const expectedAt = input.expectedAt === null ? null : new Date(input.expectedAt);
  if (expectedAt && (!Number.isFinite(expectedAt.getTime()) || expectedAt.toISOString() !== input.expectedAt)) {
    throw new Error('Invalid expected receipt date');
  }
  const note = input.note?.trim().normalize('NFC') ?? null;
  if (note !== null && note.length > 500) throw new Error('Invalid purchase order note');
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) {
    throw new Error('Invalid purchase order items');
  }
  const items = input.items.map((item) => {
    validateId(item.skuId, 'SKU');
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000) {
      throw new Error('Invalid purchase quantity');
    }
    if (!Number.isSafeInteger(item.unitCostCent) || item.unitCostCent < 0 || item.unitCostCent > 4_294_967_295) {
      throw new Error('Invalid purchase unit cost');
    }
    const lineTotal = item.quantity * item.unitCostCent;
    if (!Number.isSafeInteger(lineTotal) || lineTotal > 4_294_967_295) throw new Error('Purchase line amount exceeds limit');
    return { skuId: item.skuId, quantity: item.quantity, unitCostCent: item.unitCostCent };
  });
  if (new Set(items.map(({ skuId }) => skuId)).size !== items.length) throw new Error('Duplicate purchase SKU');
  if (items.reduce((sum, item) => sum + item.quantity * item.unitCostCent, 0) > 4_294_967_295) {
    throw new Error('Purchase total exceeds limit');
  }
  return { supplierId: input.supplierId, expectedAt: input.expectedAt, note: note || null, items };
}

function isStatus(value: unknown): value is PurchaseOrderStatus {
  return typeof value === 'string' && PURCHASE_ORDER_STATUSES.includes(value as PurchaseOrderStatus);
}

function validateId(value: string, entity: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${entity} id`);
  }
}
