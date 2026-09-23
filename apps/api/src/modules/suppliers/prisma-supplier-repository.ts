import type { Prisma, PrismaClient, Supplier as SupplierRow } from '@prisma/client';
import type { Supplier, SupplierInput, SupplierListQuery, SupplierRepository, SupplierStatus } from './supplier-service.js';

export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: SupplierListQuery): Promise<{ readonly items: Supplier[]; readonly total: number }> {
    const keyword = query.keyword?.trim();
    const where: Prisma.SupplierWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(keyword ? { OR: [
        { supplierNo: { contains: keyword } },
        { name: { contains: keyword } },
        { contactName: { contains: keyword } },
        { phone: { contains: keyword } }
      ] } : {})
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.supplier.count({ where })
    ]);
    return { items: rows.map(toSupplier), total };
  }

  async findByPublicId(publicId: string): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({ where: { publicId } });
    return row ? toSupplier(row) : null;
  }

  async findBySupplierNo(supplierNo: string): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({ where: { supplierNo } });
    return row ? toSupplier(row) : null;
  }

  async create(input: SupplierInput): Promise<Supplier> {
    return toSupplier(await this.prisma.supplier.create({ data: toData(input) }));
  }

  async update(publicId: string, input: SupplierInput): Promise<Supplier> {
    return toSupplier(await this.prisma.supplier.update({ where: { publicId }, data: toData(input) }));
  }

  async setStatus(publicId: string, status: SupplierStatus): Promise<Supplier> {
    return toSupplier(await this.prisma.supplier.update({ where: { publicId }, data: { status } }));
  }
}

function toData(input: SupplierInput): Prisma.SupplierUncheckedCreateInput {
  return {
    supplierNo: input.supplierNo, type: input.type, name: input.name,
    contactName: input.contactName, phone: input.phone, address: input.address,
    supplyCategories: [...input.supplyCategories] as Prisma.InputJsonValue,
    settlementTerms: input.settlementTerms, qualityGrade: input.qualityGrade,
    qualityScore: input.qualityScore, deliveryScore: input.deliveryScore,
    quantityAccuracyScore: input.quantityAccuracyScore, afterSalesScore: input.afterSalesScore,
    priceStabilityScore: input.priceStabilityScore,
    attachmentObjectKeys: [...input.attachmentObjectKeys] as Prisma.InputJsonValue
  };
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    publicId: row.publicId, supplierNo: row.supplierNo, type: row.type, name: row.name,
    contactName: row.contactName, phone: row.phone, address: row.address,
    supplyCategories: stringArray(row.supplyCategories), settlementTerms: row.settlementTerms,
    qualityGrade: row.qualityGrade, qualityScore: row.qualityScore,
    deliveryScore: row.deliveryScore, quantityAccuracyScore: row.quantityAccuracyScore,
    afterSalesScore: row.afterSalesScore, priceStabilityScore: row.priceStabilityScore,
    attachmentObjectKeys: stringArray(row.attachmentObjectKeys), status: row.status,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString()
  };
}

function stringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('Invalid supplier JSON data');
  }
  return value as string[];
}
