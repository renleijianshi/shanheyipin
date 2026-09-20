# MODULE_INDEX

| 模块 | 状态 | 主要位置 | 相关文档 |
|---|---|---|---|
| M01 项目骨架 | 已完成 | `apps/`, `packages/`, `.github/` | `tasks/M01_项目骨架.md`, `docs/04_技术架构设计.md` |
| M02 数据库基础 | 已完成 | `apps/api/prisma/`, `apps/api/src/infrastructure/database/` | `docs/05_数据库_ER与表设计.md` |
| M03 管理后台 RBAC | 已完成 | `apps/api/src/modules/admin/`, `apps/api/prisma/` | `docs/03_角色权限与业务流程.md` |
| M04 微信登录 | 已完成 | `apps/api/src/modules/auth/`, `apps/api/prisma/` | `docs/01_产品需求_PRD.md`, `docs/06_API设计规范.md` |
| M05 用户中心 | 已完成 | `apps/api/src/modules/users/`, `apps/api/prisma/` | `docs/01_产品需求_PRD.md`, `docs/05_数据库_ER与表设计.md` |
| M06 地址 | 已完成 | `apps/api/src/modules/addresses/`, `apps/api/prisma/` | `docs/01_产品需求_PRD.md`, `docs/06_API设计规范.md` |
| M07 商品分类 | 已完成 | `apps/api/src/modules/catalog/`, `apps/api/prisma/` | `tasks/M07_商品分类.md`, `docs/01_产品需求_PRD.md`, `docs/05_数据库_ER与表设计.md`, `docs/06_API设计规范.md` |
| M08 SPU | 已完成 | `apps/api/src/modules/catalog/`, `apps/api/prisma/` | `tasks/M08_SPU.md`, `docs/01_产品需求_PRD.md`, `docs/05_数据库_ER与表设计.md` |
| M09 SKU | 已完成 | `apps/api/src/modules/catalog/`, `apps/api/prisma/` | `tasks/M09_SKU.md`, `docs/01_产品需求_PRD.md`, `docs/05_数据库_ER与表设计.md` |
| M10-M12 商品详情、购物车与结算 | 待开始 | `apps/api/src/modules/catalog/`, `cart`, `checkout` | `docs/01_产品需求_PRD.md`, `docs/05_数据库_ER与表设计.md`, `docs/06_API设计规范.md` |
| M13-M16 订单/支付抽象/物流 | 待开始 | `apps/api/src/orders`, `payments`, `shipping` | `docs/08_订单支付退款售后设计.md` |
| M17-M29 供应链与库存 | 待开始 | `apps/api/src/procurement`, `inventory`, `processing` | `docs/07_商品采购仓储库存设计.md` |
| M30-M32 售后 | 待开始 | `apps/api/src/aftersales`, `refunds` | `docs/08_订单支付退款售后设计.md` |
| M33-M42 增长/内容/溯源/B2B | 待开始 | 对应业务模块 | `docs/09_会员营销内容溯源企业团购.md` |
| M43-M46 报表/安全/测试/部署 | 待开始 | `apps/api/src/analytics`, `infra/`, `.github/` | `docs/10_运营后台数据报表.md`, `docs/11_安全合规部署运维.md`, `docs/12_测试验收与里程碑.md` |

读取规则：先按模块定位本表，只读对应任务、1-3 份文档和相关代码/测试。
