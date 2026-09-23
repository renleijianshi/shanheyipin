export const SUPPLIER_TYPES = ['FARMER', 'COOPERATIVE', 'PACKAGING_FACTORY', 'OTHER'] as const;
export type SupplierType = typeof SUPPLIER_TYPES[number];
export type SupplierStatus = 'ACTIVE' | 'DISABLED';

export interface SupplierScores {
  readonly qualityScore: number | null;
  readonly deliveryScore: number | null;
  readonly quantityAccuracyScore: number | null;
  readonly afterSalesScore: number | null;
  readonly priceStabilityScore: number | null;
}

export interface SupplierInput extends SupplierScores {
  readonly supplierNo: string;
  readonly type: SupplierType;
  readonly name: string;
  readonly contactName: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly supplyCategories: readonly string[];
  readonly settlementTerms: string | null;
  readonly qualityGrade: string | null;
  readonly attachmentObjectKeys: readonly string[];
}

export interface Supplier extends SupplierInput {
  readonly publicId: string;
  readonly status: SupplierStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SupplierListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly keyword?: string;
  readonly type?: SupplierType;
  readonly status?: SupplierStatus;
}

export interface SupplierRepository {
  list(query: SupplierListQuery): Promise<{ readonly items: Supplier[]; readonly total: number }>;
  findByPublicId(publicId: string): Promise<Supplier | null>;
  findBySupplierNo(supplierNo: string): Promise<Supplier | null>;
  create(input: SupplierInput): Promise<Supplier>;
  update(publicId: string, input: SupplierInput): Promise<Supplier>;
  setStatus(publicId: string, status: SupplierStatus): Promise<Supplier>;
}

export class SupplierService {
  constructor(private readonly suppliers: SupplierRepository) {}

  list(query: SupplierListQuery) {
    if (!Number.isInteger(query.page) || query.page < 1) throw new Error('Invalid supplier page');
    if (!Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) {
      throw new Error('Invalid supplier page size');
    }
    if (query.type !== undefined && !isSupplierType(query.type)) throw new Error('Invalid supplier type');
    if (query.status !== undefined && !isSupplierStatus(query.status)) throw new Error('Invalid supplier status');
    const keyword = query.keyword?.trim();
    if (keyword && keyword.length > 100) throw new Error('Invalid supplier keyword');
    return this.suppliers.list({ ...query, ...(keyword ? { keyword } : {}) });
  }

  async get(publicId: string): Promise<Supplier> {
    validatePublicId(publicId);
    const supplier = await this.suppliers.findByPublicId(publicId);
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
  }

  async create(input: SupplierInput): Promise<Supplier> {
    const normalized = validate(input);
    if (await this.suppliers.findBySupplierNo(normalized.supplierNo)) {
      throw new Error('Supplier number already exists');
    }
    return this.suppliers.create(normalized);
  }

  async update(publicId: string, input: SupplierInput): Promise<Supplier> {
    validatePublicId(publicId);
    if (!(await this.suppliers.findByPublicId(publicId))) throw new Error('Supplier not found');
    const normalized = validate(input);
    const existing = await this.suppliers.findBySupplierNo(normalized.supplierNo);
    if (existing && existing.publicId !== publicId) throw new Error('Supplier number already exists');
    return this.suppliers.update(publicId, normalized);
  }

  async setStatus(publicId: string, status: SupplierStatus): Promise<Supplier> {
    validatePublicId(publicId);
    if (!isSupplierStatus(status)) throw new Error('Invalid supplier status');
    if (!(await this.suppliers.findByPublicId(publicId))) throw new Error('Supplier not found');
    return this.suppliers.setStatus(publicId, status);
  }
}

function validate(input: SupplierInput): SupplierInput {
  const supplierNo = input.supplierNo.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(supplierNo)) throw new Error('Invalid supplier number');
  const name = input.name.trim().normalize('NFC');
  if (name.length < 1 || name.length > 120) throw new Error('Invalid supplier name');
  if (!isSupplierType(input.type)) throw new Error('Invalid supplier type');

  const contactName = normalizeOptional(input.contactName, 50, 'supplier contact name');
  const phone = normalizeOptional(input.phone, 24, 'supplier phone');
  if (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7)) {
    throw new Error('Invalid supplier phone');
  }
  const address = normalizeOptional(input.address, 255, 'supplier address');
  const settlementTerms = normalizeOptional(input.settlementTerms, 500, 'supplier settlement terms');
  const qualityGrade = normalizeOptional(input.qualityGrade, 32, 'supplier quality grade');

  if (!Array.isArray(input.supplyCategories) || input.supplyCategories.length > 30) {
    throw new Error('Invalid supplier categories');
  }
  const supplyCategories = input.supplyCategories.map((value) => value.trim().normalize('NFC'));
  if (supplyCategories.some((value) => value.length < 1 || value.length > 80)
    || new Set(supplyCategories.map((value) => value.toLowerCase())).size !== supplyCategories.length) {
    throw new Error('Invalid supplier categories');
  }

  const attachmentObjectKeys = [...new Set(input.attachmentObjectKeys)];
  if (attachmentObjectKeys.length > 30 || attachmentObjectKeys.some((key) =>
    typeof key !== 'string' || key.length > 512 || !/^suppliers\/[A-Za-z0-9/_-]+\.[A-Za-z0-9]{1,10}$/.test(key)
    || key.split('/').includes('..'))) {
    throw new Error('Invalid supplier attachment object key');
  }

  return {
    supplierNo, type: input.type, name, contactName, phone, address, supplyCategories,
    settlementTerms, qualityGrade,
    qualityScore: validateScore(input.qualityScore),
    deliveryScore: validateScore(input.deliveryScore),
    quantityAccuracyScore: validateScore(input.quantityAccuracyScore),
    afterSalesScore: validateScore(input.afterSalesScore),
    priceStabilityScore: validateScore(input.priceStabilityScore),
    attachmentObjectKeys
  };
}

function normalizeOptional(value: string | null, maxLength: number, field: string): string | null {
  if (value === null) return null;
  const normalized = value.trim().normalize('NFC');
  if (normalized.length > maxLength) throw new Error(`Invalid ${field}`);
  return normalized || null;
}

function validateScore(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('Invalid supplier score');
  return value;
}

function isSupplierType(value: unknown): value is SupplierType {
  return typeof value === 'string' && SUPPLIER_TYPES.includes(value as SupplierType);
}

function isSupplierStatus(value: unknown): value is SupplierStatus {
  return value === 'ACTIVE' || value === 'DISABLED';
}

function validatePublicId(publicId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) {
    throw new Error('Invalid supplier id');
  }
}
