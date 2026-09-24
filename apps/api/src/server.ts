import { createServer } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { AdminAuthService } from './modules/admin/admin-auth-service.js';
import { createAdminHttpHandler } from './modules/admin/admin-http-handler.js';
import { PrismaAdminAuthRepository } from './modules/admin/prisma-admin-auth-repository.js';
import { AdminCategoryService, PublicCategoryService } from './modules/catalog/category-service.js';
import { PrismaCategoryRepository } from './modules/catalog/prisma-category-repository.js';
import { AdminProductService } from './modules/catalog/product-service.js';
import { PrismaProductRepository } from './modules/catalog/prisma-product-repository.js';
import { PublicCatalogService } from './modules/catalog/catalog-query-service.js';
import { PrismaCatalogQueryRepository } from './modules/catalog/prisma-catalog-query-repository.js';
import { AdminSkuService } from './modules/catalog/sku-service.js';
import { PrismaSkuRepository } from './modules/catalog/prisma-sku-repository.js';

try { process.loadEnvFile(); } catch { /* environment may be supplied by the process manager */ }

const prisma = new PrismaClient();
const handler = createAdminHttpHandler({
  auth: new AdminAuthService(new PrismaAdminAuthRepository(prisma)),
  products: new AdminProductService(new PrismaProductRepository(prisma)),
  categories: new AdminCategoryService(new PrismaCategoryRepository(prisma)),
  skus: new AdminSkuService(new PrismaSkuRepository(prisma)),
  publicCatalog: new PublicCatalogService(new PrismaCatalogQueryRepository(prisma)),
  publicCategories: new PublicCategoryService(new PrismaCategoryRepository(prisma)),
  dashboard: async () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
    const startOfDay = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00+08:00`);
    const [sales, todayOrders, pendingShipments, aftersales] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', paidAt: { gte: startOfDay } }, _sum: { paidAmountCent: true } }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { fulfillmentStatus: 'WAIT_SHIP' } }),
      prisma.aftersale.count({ where: { status: { in: ['APPLIED', 'APPROVED', 'RETURN_PENDING', 'RETURN_RECEIVED'] } } })
    ]);
    return { todaySalesCent: sales._sum.paidAmountCent ?? 0, todayOrders, pendingShipments, aftersales };
  }
});
const port = Number(process.env.API_PORT ?? 3200);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('API_PORT must be a valid TCP port');
const server = createServer((request, response) => { void handler(request, response); });
server.listen(port, '127.0.0.1', () => process.stdout.write(`山禾颐品 API listening on 127.0.0.1:${port}\n`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });
