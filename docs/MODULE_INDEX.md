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
| M10 商品详情 | 已完成 | `apps/api/src/modules/catalog/`, `apps/miniapp/src/`, `prototype/` | `tasks/M10_商品详情.md`, `docs/02_功能清单与页面地图.md`, `docs/06_API设计规范.md` |
| M11 购物车 | 已完成 | `apps/api/src/modules/cart/`, `apps/api/prisma/` | `tasks/M11_购物车.md`, `docs/05_数据库_ER与表设计.md`, `docs/06_API设计规范.md` |
| M12 结算预览 | 已完成 | `apps/api/src/modules/checkout/` | `tasks/M12_结算.md`, `docs/06_API设计规范.md`, `docs/08_订单支付退款售后设计.md` |
| M13 订单 | 已完成 | `apps/api/src/modules/orders/`, `apps/api/prisma/` | `tasks/M13_订单.md`, `docs/08_订单支付退款售后设计.md` |
| M14 支付抽象 | 已完成 | `apps/api/src/modules/payments/`, `apps/api/prisma/` | `tasks/M14_微信支付.md`, `docs/08_订单支付退款售后设计.md`, `docs/11_安全合规部署运维.md` |
| M15 支付回调抽象 | 已完成 | `apps/api/src/modules/payments/`, `apps/api/prisma/` | `tasks/M15_支付回调.md`, `docs/08_订单支付退款售后设计.md`, `docs/11_安全合规部署运维.md` |
| M16 发货物流 | 已完成 | `apps/api/src/modules/shipping/`, `apps/api/prisma/` | `tasks/M16_发货物流.md`, `docs/08_订单支付退款售后设计.md` |
| M17 供应商 | 已完成（领域层） | `apps/api/src/modules/suppliers/`, `apps/api/prisma/` | `tasks/M17_供应商.md`, `docs/07_商品采购仓储库存设计.md` |
| M18 采购 | 已完成（领域层） | `apps/api/src/modules/procurement/`, `apps/api/prisma/` | `tasks/M18_采购.md`, `docs/07_商品采购仓储库存设计.md` |
| M19 到货 | 已完成（领域层） | `apps/api/src/modules/procurement/`, `apps/api/prisma/` | `tasks/M19_到货.md`, `docs/07_商品采购仓储库存设计.md` |
| M20 质检 | 已完成（领域层） | `apps/api/src/modules/procurement/`, `apps/api/prisma/` | `tasks/M20_质检.md`, `docs/07_商品采购仓储库存设计.md` |
| 小程序 V19 页面 | 进行中（首页、分类、甄选、商品详情、购物车、我的、地址、故事、溯源均有正式 uni-app 页面并统一主要视觉；本机后台预览可联动，线上 API 未接） | `apps/miniapp/pages/`, `apps/miniapp/src/v19-content-store.ts` | `apps/miniapp/README.md`, `DESIGN.md`, `apps/miniapp/src/v12-ui-model.ts`, `apps/miniapp/src/v12-ports.ts` |
| 独立运营后台 UI | 进行中（Vue/Vite 工作台、商品列表/编辑、分类界面已建立；服务端管理 HTTP API 与认证尚未实现） | `apps/admin/web/`, `apps/admin/src/` | `apps/admin/README.md`, `DESIGN.md`, `docs/06_API设计规范.md` |
| M21-M22/M25-M29 批次、仓库、加工 | 待开始 | `apps/api/src/modules/` 对应供应链目录 | `docs/07_商品采购仓储库存设计.md` |
| M23-M24 库存余额/流水 | 已完成 | `apps/api/src/modules/inventory/`, `apps/api/prisma/` | `tasks/M23_库存余额.md`, `tasks/M24_库存流水.md`, `docs/07_商品采购仓储库存设计.md` |
| M30-M32 售后/退款/补发 | 已完成 | `apps/api/src/modules/aftersales/`, `apps/api/src/modules/refunds/`, `apps/api/prisma/` | `tasks/M30_售后.md`, `tasks/M31_退款.md`, `tasks/M32_补发.md` |
| M33-M42 增长/内容/溯源/B2B | 待开始 | 对应业务模块 | `docs/09_会员营销内容溯源企业团购.md` |
| M43-M46 报表/安全/测试/部署 | 待开始 | `apps/api/src/analytics`, `infra/`, `.github/` | `docs/10_运营后台数据报表.md`, `docs/11_安全合规部署运维.md`, `docs/12_测试验收与里程碑.md` |

读取规则：先按模块定位本表，只读对应任务、1-3 份文档和相关代码/测试。
