import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  Sku,
  SkuListQuery,
  SkuListResult,
  SkuRepository,
  ValidatedSkuInput
} from './sku-service.js';

const skuInclude = {
  specificationValues: {
    include: { specValue: { include: { spec: true } } }
  }
} satisfies Prisma.ProductSkuInclude;

type SkuRecord = Prisma.ProductSkuGetPayload<{ include: typeof skuInclude }>;

export class PrismaSkuRepository implements SkuRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findProduct(id: string) {
    const row = await this.prisma.product.findUnique({
      where: { id: BigInt(id) }, select: { id: true, status: true }
    });
    return row ? { id: row.id.toString(), status: row.status } : null;
  }

  create(input: ValidatedSkuInput): Promise<Sku> {
    return this.prisma.$transaction(async (tx) => {
      await requireValidProduct(tx, input);
      const specValueIds = await resolveSpecValueIds(tx, input);
      const row = await tx.productSku.create({
        data: toCreateData(input, specValueIds),
        include: skuInclude
      });
      return toSku(row);
    });
  }

  update(id: string, input: ValidatedSkuInput): Promise<Sku> {
    return this.prisma.$transaction(async (tx) => {
      const skuId = BigInt(id);
      await tx.$queryRaw`SELECT id FROM product_skus WHERE id = ${skuId} FOR UPDATE`;
      const existing = await tx.productSku.findUnique({
        where: { id: skuId }, select: { productId: true }
      });
      if (!existing) throw new Error('SKU not found');
      if (existing.productId !== BigInt(input.productId)) throw new Error('SKU cannot change parent product');

      await requireValidProduct(tx, input);
      const specValueIds = await resolveSpecValueIds(tx, input);
      await tx.skuSpecRelation.deleteMany({ where: { skuId } });
      await tx.productSku.update({ where: { id: skuId }, data: toMutableData(input) });
      if (specValueIds.length > 0) {
        await tx.skuSpecRelation.createMany({
          data: specValueIds.map((specValueId) => ({ skuId, specValueId }))
        });
      }
      return toSku(await requireSku(tx, skuId));
    });
  }

  async findById(id: string): Promise<Sku | null> {
    const row = await this.prisma.productSku.findUnique({
      where: { id: BigInt(id) }, include: skuInclude
    });
    return row ? toSku(row) : null;
  }

  async list(query: SkuListQuery): Promise<SkuListResult> {
    const where: Prisma.ProductSkuWhereInput = { productId: BigInt(query.productId) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productSku.findMany({
        where,
        include: skuInclude,
        orderBy: [{ id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.productSku.count({ where })
    ]);
    return { items: rows.map(toSku), total };
  }
}

async function requireValidProduct(
  tx: Prisma.TransactionClient,
  input: ValidatedSkuInput
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: BigInt(input.productId) }, select: { status: true }
  });
  if (!product) throw new Error('Parent product not found');
  if (input.saleStatus === 'ON_SALE' && product.status !== 'ON_SALE') {
    throw new Error('Parent product must be on sale');
  }
}

async function resolveSpecValueIds(
  tx: Prisma.TransactionClient,
  input: ValidatedSkuInput
): Promise<bigint[]> {
  const ids: bigint[] = [];
  for (const [sortOrder, item] of input.specs.entries()) {
    const spec = await tx.productSpec.upsert({
      where: { productId_name: { productId: BigInt(input.productId), name: item.name } },
      update: { sortOrder },
      create: { productId: BigInt(input.productId), name: item.name, sortOrder }
    });
    const value = await tx.productSpecValue.upsert({
      where: { specId_value: { specId: spec.id, value: item.value } },
      update: {},
      create: { specId: spec.id, value: item.value, sortOrder: 0 }
    });
    ids.push(value.id);
  }
  return ids;
}

function toMutableData(input: ValidatedSkuInput): Prisma.ProductSkuUpdateInput {
  return {
    skuCode: input.skuCode,
    skuName: input.skuName,
    salePriceCent: input.salePriceCent,
    marketPriceCent: input.marketPriceCent,
    weightGram: input.weightGram,
    barcode: input.barcode,
    saleStatus: input.saleStatus,
    stockMode: input.stockMode,
    presaleEnabled: input.presaleEnabled,
    specSignature: input.specSignature
  };
}

function toCreateData(input: ValidatedSkuInput, specValueIds: readonly bigint[]): Prisma.ProductSkuCreateInput {
  return {
    product: { connect: { id: BigInt(input.productId) } },
    skuCode: input.skuCode,
    skuName: input.skuName,
    salePriceCent: input.salePriceCent,
    marketPriceCent: input.marketPriceCent,
    weightGram: input.weightGram,
    barcode: input.barcode,
    saleStatus: input.saleStatus,
    stockMode: input.stockMode,
    presaleEnabled: input.presaleEnabled,
    specSignature: input.specSignature,
    specificationValues: {
      create: specValueIds.map((id) => ({ specValue: { connect: { id } } }))
    }
  };
}

async function requireSku(tx: Prisma.TransactionClient, id: bigint): Promise<SkuRecord> {
  const row = await tx.productSku.findUnique({ where: { id }, include: skuInclude });
  if (!row) throw new Error('SKU not found');
  return row;
}

function toSku(row: SkuRecord): Sku {
  const specs = row.specificationValues
    .map(({ specValue }) => ({ name: specValue.spec.name, value: specValue.value }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  return {
    id: row.id.toString(),
    publicId: row.publicId,
    productId: row.productId.toString(),
    skuCode: row.skuCode,
    skuName: row.skuName,
    salePriceCent: row.salePriceCent,
    marketPriceCent: row.marketPriceCent,
    weightGram: row.weightGram,
    barcode: row.barcode,
    saleStatus: row.saleStatus,
    stockMode: row.stockMode,
    presaleEnabled: row.presaleEnabled,
    specs
  };
}
