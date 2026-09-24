import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hashAdminPassword } from './modules/admin/admin-auth-service.js';
import { AdminProductService } from './modules/catalog/product-service.js';
import { PrismaProductRepository } from './modules/catalog/prisma-product-repository.js';
import { AdminSkuService } from './modules/catalog/sku-service.js';
import { PrismaSkuRepository } from './modules/catalog/prisma-sku-repository.js';

const database = new URL(process.env.DATABASE_URL ?? 'file:invalid');
if (process.env.INTERNAL_TEST_MODE !== 'true' || process.env.NODE_ENV === 'production' ||
    database.hostname !== '127.0.0.1' || database.port !== '3307' || database.pathname !== '/shanheyipin_internal_test') {
  throw new Error('Seed is restricted to the isolated local internal-test database on port 3307');
}
const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const mediaRoot = process.env.MEDIA_STORAGE_DIR;
if (!username || !password || !mediaRoot) throw new Error('Missing internal-test environment configuration');
const prisma = new PrismaClient();
try {
  if (!await prisma.adminUser.findUnique({ where: { username } })) {
    const passwordHash = await hashAdminPassword(password);
    await prisma.$transaction(async tx => {
      const role = await tx.role.upsert({ where: { code: 'internal-test-owner' }, update: {}, create: { code: 'internal-test-owner', name: '内部测试管理员', isSystem: true } });
      const permission = await tx.permission.upsert({ where: { code: '*' }, update: {}, create: { code: '*', name: '全部管理权限', scope: 'API' } });
      await tx.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
      const admin = await tx.adminUser.create({ data: { username, displayName: '内部测试管理员', passwordHash } });
      await tx.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });
    });
  }
  await mkdir(resolve(mediaRoot, 'products/internal-test'), { recursive: true });
  await cp(resolve('assets/internal-test/products'), resolve(mediaRoot, 'products/internal-test'), { recursive: true, force: false });
  const categories = new Map<string, bigint>();
  for (const [index, [code, name]] of [['seasonal','应季甄选'], ['gift','礼盒'], ['mountain','山野好物']].entries()) {
    const row = await prisma.category.upsert({ where: { code: code! }, update: {}, create: { code: code!, name: name!, status: 'ENABLED', sortOrder: index * 10 } });
    categories.set(code!, row.id);
  }
  const catalog = new AdminProductService(new PrismaProductRepository(prisma));
  const skus = new AdminSkuService(new PrismaSkuRepository(prisma));
  const samples = [
    { name: '舟曲吊柿 · 初尝小袋', subtitle: '一份山野甜，随身慢慢尝', category: 'seasonal', image: 'persimmon', weights: [150,300], prices: [1990,3590], packing: '试吃袋' },
    { name: '舟曲吊柿 · 日常分享装', subtitle: '软糯柿香，留给日常的小欢喜', category: 'seasonal', image: 'pouch', weights: [500,1000], prices: [5990,10900], packing: '分享袋' },
    { name: '山河有礼 · 吊柿礼盒', subtitle: '把山河风物，装进一份心意', category: 'gift', image: 'gift', weights: [600,1200], prices: [9900,17900], packing: '礼盒' },
    { name: '山野茶点 · 柿香小食', subtitle: '茶席之间，慢慢品一口清甜', category: 'mountain', image: 'persimmon', weights: [250,500], prices: [3290,5990], packing: '茶点袋' }
  ];
  for (const [index, sample] of samples.entries()) {
    const code = `TEST-PERSIMMON-${index + 1}`;
    if (await prisma.productSku.findUnique({ where: { skuCode: `${code}-1` } })) continue;
    const product = await catalog.create({
      categoryId: categories.get(sample.category)!.toString(), name: sample.name, subtitle: sample.subtitle,
      productType: 'STANDARD', origin: '甘肃 · 舟曲（测试资料）', sortOrder: index * 10, status: 'ON_SALE',
      content: `${sample.subtitle}。以舟曲吊柿为灵感的内部测试商品，用于体验规格选择、商品编辑与上下架。\n\n风味介绍\n绵软的果肉、温润的甜香，适合搭配一杯清茶，在闲暇时慢慢享用。\n\n包装与规格\n${sample.packing}设计，提供 ${sample.weights.join(' 克 / ')} 克两种测试规格。\n\n温馨提示\n本商品价格、包装、产地文案和 AI 生成图片仅供内部测试，不能作为正式销售、配料、保质期或食品认证依据。正式商品资料以生产发布版本为准。`,
      media: [sample.image, 'orchard'].map((image, sortOrder) => ({ type: 'IMAGE' as const, objectKey: `products/internal-test/${image}.png`, altText: '内部测试 · AI 生成示意图', sortOrder })),
      tags: ['内部测试', sample.packing]
    });
    for (const [variant, weight] of sample.weights.entries()) {
      await skus.create({ productId: product.id, skuCode: `${code}-${variant + 1}`, skuName: `${weight} 克 · ${sample.packing}`,
        salePriceCent: sample.prices[variant]!, marketPriceCent: null, weightGram: weight, barcode: null,
        saleStatus: 'ON_SALE', stockMode: 'BATCH', presaleEnabled: false,
        specs: [{ name: '净含量', value: `${weight}克` }, { name: '包装', value: sample.packing }] });
    }
  }
  const sampleProduct = await prisma.product.findFirst({ where: { name: '舟曲吊柿 · 初尝小袋' }, select: { id: true } });
  const sampleStoryTitle = '山野来信 · 风物介绍（内部测试）';
  if (!await prisma.story.findFirst({ where: { title: sampleStoryTitle } })) {
    await prisma.story.create({ data: {
      contentType: 'ORIGIN', title: sampleStoryTitle,
      summary: '用于验证内容后台与小程序读取的内测文章，不代表已核实的产地信息。',
      body: '【内部测试内容】这篇示例仅用于验证文章草稿、封面、发布和小程序详情流程。文中没有提供真实产地、种植、工艺或交易证明。\n\n封面为 AI 生成的示意图，并非授权实拍。正式内容需经业务负责人核实并替换图片后再发布。',
      coverObjectKey: 'products/internal-test/orchard.png', relatedProductId: sampleProduct?.id ?? null,
      status: 'PUBLISHED', sortOrder: 10, publishedAt: new Date()
    } });
  }
  process.stdout.write('Internal-test administrator, 4 products, 8 SKUs, one published test story and AI sample media are ready. Existing edits are preserved.\n');
} finally { await prisma.$disconnect(); }
