import { createHash } from 'node:crypto';

export type SkuSaleStatus = 'DRAFT' | 'ON_SALE' | 'OFF_SALE';
export type SkuStockMode = 'BATCH';

export interface SkuSpecInput { readonly name: string; readonly value: string }

export interface SkuInput {
  readonly productId: string;
  readonly skuCode: string;
  readonly skuName: string;
  readonly salePriceCent: number;
  readonly marketPriceCent: number | null;
  readonly weightGram: number;
  readonly barcode: string | null;
  readonly saleStatus: SkuSaleStatus;
  readonly stockMode: SkuStockMode;
  readonly presaleEnabled: boolean;
  readonly specs: readonly SkuSpecInput[];
}

export interface ValidatedSkuInput extends SkuInput { readonly specSignature: string }
export interface Sku extends SkuInput { readonly id: string; readonly publicId: string }
export interface SkuListQuery { readonly productId: string; readonly page: number; readonly pageSize: number }
export interface SkuListResult { readonly items: Sku[]; readonly total: number }

export interface SkuRepository {
  findProduct(id: string): Promise<{ readonly id: string; readonly status: 'DRAFT' | 'ON_SALE' | 'OFF_SALE' } | null>;
  create(input: ValidatedSkuInput): Promise<Sku>;
  update(id: string, input: ValidatedSkuInput): Promise<Sku>;
  findById(id: string): Promise<Sku | null>;
  list(query: SkuListQuery): Promise<SkuListResult>;
}

export class AdminSkuService {
  constructor(private readonly skus: SkuRepository) {}

  async create(input: SkuInput): Promise<Sku> {
    const valid = validate(input);
    await this.assertProduct(valid);
    return this.skus.create(valid);
  }

  async update(id: string, input: SkuInput): Promise<Sku> {
    validateId(id, 'SKU');
    const existing = await this.skus.findById(id);
    if (!existing) throw new Error('SKU not found');
    const valid = validate(input);
    if (existing.productId !== valid.productId) throw new Error('SKU cannot change parent product');
    await this.assertProduct(valid);
    return this.skus.update(id, valid);
  }

  async list(query: SkuListQuery): Promise<SkuListResult> {
    validateId(query.productId, 'product');
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid SKU page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) {
      throw new Error('Invalid SKU page size');
    }
    return this.skus.list(query);
  }

  private async assertProduct(input: ValidatedSkuInput): Promise<void> {
    const product = await this.skus.findProduct(input.productId);
    if (!product) throw new Error('Parent product not found');
    if (input.saleStatus === 'ON_SALE' && product.status !== 'ON_SALE') {
      throw new Error('Parent product must be on sale');
    }
  }
}

function validate(input: SkuInput): ValidatedSkuInput {
  const maxUnsignedInt = 4_294_967_295;
  validateId(input.productId, 'product');
  const skuCode = input.skuCode.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,63}$/.test(skuCode)) throw new Error('Invalid SKU code');
  const skuName = normalizeText(input.skuName, 100, 'SKU name');
  if (!Number.isSafeInteger(input.salePriceCent) || input.salePriceCent < 1 || input.salePriceCent > maxUnsignedInt) {
    throw new Error('Invalid sale price');
  }
  if (input.marketPriceCent !== null &&
      (!Number.isSafeInteger(input.marketPriceCent) || input.marketPriceCent > maxUnsignedInt)) {
    throw new Error('Invalid market price');
  }
  if (input.marketPriceCent !== null && input.marketPriceCent < input.salePriceCent) {
    throw new Error('Market price cannot be lower than sale price');
  }
  if (!Number.isSafeInteger(input.weightGram) || input.weightGram < 1 || input.weightGram > 1_000_000) {
    throw new Error('Invalid SKU weight');
  }
  const barcode = input.barcode?.trim() ?? null;
  if (barcode !== null && !/^\d{8,18}$/.test(barcode)) throw new Error('Invalid SKU barcode');
  if (!['DRAFT', 'ON_SALE', 'OFF_SALE'].includes(input.saleStatus)) throw new Error('Invalid SKU sale status');
  if (input.stockMode !== 'BATCH') throw new Error('Invalid SKU stock mode');
  if (typeof input.presaleEnabled !== 'boolean') throw new Error('Invalid presale setting');
  if (input.specs.length > 10) throw new Error('Too many SKU specifications');
  const specs = input.specs.map((spec) => ({
    name: normalizeText(spec.name, 30, 'specification name'),
    value: normalizeText(spec.value, 50, 'specification value')
  })).sort(compareSpecs);
  if (new Set(specs.map((spec) => spec.name.toLowerCase())).size !== specs.length) {
    throw new Error('Duplicate SKU specification');
  }
  const signatureSpecs = specs.map(({ name, value }) => ({
    name: name.toLowerCase(), value: value.toLowerCase()
  }));
  const specSignature = createHash('sha256').update(JSON.stringify(signatureSpecs)).digest('hex');
  return { ...input, skuCode, skuName, barcode, specs, specSignature };
}

function compareSpecs(left: SkuSpecInput, right: SkuSpecInput): number {
  const leftName = left.name.toLowerCase();
  const rightName = right.name.toLowerCase();
  return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
}

function normalizeText(value: string, max: number, field: string): string {
  const normalized = value.trim().normalize('NFC');
  if (normalized.length < 1 || normalized.length > max) throw new Error(`Invalid ${field}`);
  return normalized;
}

function validateId(id: string, field: string): void {
  if (!/^[1-9]\d*$/.test(id)) throw new Error(`Invalid ${field} id`);
}
