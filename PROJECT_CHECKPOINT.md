# 山禾颐品｜代码现状与续开发断点

更新时间：2026-09-24。本文件保留较早的代码交接记录；当前权威状态、四层验收表和下一步以 [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)、[`docs/LAUNCH_READINESS_PLAN.md`](docs/LAUNCH_READINESS_PLAN.md) 与 [`docs/MODULE_INDEX.md`](docs/MODULE_INDEX.md) 为准。范围仅为 `C:\Users\19993\Desktop\山禾颐品\daima`。

## 1. 下次如何省 Token

1. 先读根目录 `AGENTS.md`、本文件；执行 `git status --short --branch` 和 `git log -3 --oneline`。
2. 从第 5 节找到目标模块，只读对应 `tasks/Mxx_*.md`、1～3 份业务文档、所列源码与测试。需要改数据库时再读 `apps/api/prisma/schema.prisma` 的相关模型和对应 migration。
3. 优先 `git grep` / `git diff` 定位。不要每次重扫全部 `apps/`、全部 `docs/` 或重新阅读 V1 全套。
4. 完成一个模块后运行相关测试及 `npm run check`，检查 diff，再更新本文件中该模块状态、关键文件、缺口、测试结果和下一步。
5. 本文件与当前状态文件冲突时，以当前代码和 `docs/PROJECT_STATE.md` 为准；以下日期在 2026-09-24 前的表格是历史快照。

## 2. 历史核验基线（2026-09-23）

| 项目 | 2026-09-23 实况 |
| --- | --- |
| 当前仓库 | `C:\Users\19993\Desktop\山禾颐品\daima`，`origin = https://github.com/renleijianshi/shanheyipin.git` |
| 分支与本轮基线 | `feature/v13-frontend-fusion`，本轮修改前提交 `54028cf`；提交和远端状态以当次 `git status -sb`、`git ls-remote` 为准；`main` 未参与本轮修改 |
| 检查开始时工作树 | 本轮开始时干净；只修改 `apps/miniapp` 的 V19 页面与本交接文档 |
| 远程同步 | 上一轮 `54028cf` 已推送到跟踪分支；每次续写需重新核对本地 HEAD 与远端，不能将此行当作持续在线连接 |
| 代码规模证据 | 16 个 Prisma migration；API 22 个、miniapp 4 个、admin 2 个测试文件 |
| 本机验证 | 上轮 ESLint、uni-app 类型检查和 `UNI_INPUT_DIR=.` 下 Vite H5 构建通过；本轮界面调整未运行测试/构建，`git diff --check` 通过；CLI 默认 H5 build 仍找错 manifest 根目录；微信构建因 `estree-walker` exports 错误受阻，真机未验收 |
| 验证边界 | H5 浏览器已验证后台故事保存/列表显示/恢复默认流程；未在微信开发者工具验收，未验证真实商品/API、素材授权和生产部署 |

本次参考的 V1 原始资料位于 `C:\Users\19993\Desktop\山禾颐品\小程序文件`：`00_项目总览_README.md`、`AGENTS.md`、`山禾颐品_Work执行总说明_v1.md`。它们定义产品范围和最初路线；其中“业务代码尚未开始”、旧启动包目录、Docker/Nginx 建议均是当时状态。当前有效部署与支付决策见 `docs/DECISIONS.md` 和 `docs/PROJECT_STATE.md`，实际完成度以下表及代码为准。

## 3. 历史应用状态快照（2026-09-23，已由当前状态文件覆盖）

| 应用 | 已有 | 尚缺 | 优先读取 |
| --- | --- | --- | --- |
| API | `apps/api/src/modules/` 下的业务服务、Prisma 仓储和迁移 | `src/index.ts` 仍是 bootstrap manifest 和健康函数；未见 NestJS 启动、Controller、路由、OpenAPI 或实际监听 `127.0.0.1:3200` 的代码 | `apps/api/src/index.ts`、目标模块 service/repository/test |
| 微信小程序 | uni-app + Vue 3 V19 首页、分类、甄选、故事、商品详情片与五栏导航；H5 桌面手机画框；V12 分类/甄选契约；已接本机演示联动，后台可维护演示商品/甄选、故事、溯源和首页图片，前台可读取并维护本机购物车 | 未接线上 API/数据库，不能跨设备同步；V19 其余运营菜单仍为结构占位；外链礼盒原图失效，图片授权/微信域名未确认；后台图片尚不能本地上传；AppID 空；默认 H5 CLI 入口目录不匹配，微信构建因 `estree-walker` exports 错误受阻 | `apps/miniapp/README.md`、`apps/miniapp/src/v19-content-store.ts`、`apps/miniapp/pages/admin-preview/index.vue`、`apps/miniapp/pages/home/index.vue` |
| Web 管理后台 | “小程序前端添加”四种内容入口的数据模型和校验函数 | `apps/admin/src/` 只有 TS 文件；没有 Vue/Vite/Element Plus 页面、登录界面、管理路由或 API 连接 | `apps/admin/src/miniapp-frontend-content-model.ts` |

`prototype/index.html` 仍为独立演示原型。V19 已迁移至 uni-app；最近两轮补了手机画框、首页主视觉、分类演示商品、甄选内容、商品详情与后台表单。本轮将详情改为独立滚动、固定底部加购栏，恢复甄选时令卡片和 V19 对照图片，并移除首页下方山野故事模块，保留首页快捷入口。前后台通过本机 storage 联动。它仍不是线上管理后台：没有登录/API/跨设备持久化；V19 原型的其他运营菜单也只是结构占位。礼盒原图链接失效，授权和微信域名未确认。详见 `apps/miniapp/README.md`。此前 lint/typecheck 和指定根目录后的 H5 build 通过；本轮未运行测试/构建；微信构建受依赖错误阻断，真机尚未验收。

## 4. 完成状态的口径

- **领域层已实现**：存在 service、必要的 Prisma 仓储/迁移、对应测试，表示代码基础已落地；不等于手机端可操作。
- **模型/契约已实现**：仅有类型、映射或控制器，不等于真实页面/接口。
- **未完成**：没有对应业务 service、正式页面或必要集成。
- 目前不存在已经验收的 `小程序 → HTTP API → MySQL → 支付/物流` 端到端链路。真实微信/支付宝支付、退款和微信发货同步均按项目决策 Deferred。

## 5. 模块导航与剩余工作

| 模块 | 代码状态与证据 | 下次只读的入口 / 实际缺口 |
| --- | --- | --- |
| M01–M02 骨架、数据库 | workspace、共享类型、Prisma schema/迁移、基础 CI 已有；`npm run check` 可通过 | `package.json`、`packages/shared-types/src/`、`apps/api/prisma/`；数据库部署与真实连接尚未验收 |
| M03 后台 RBAC | 权限领域代码、schema/migration、测试已有 | `apps/api/src/modules/admin/rbac.ts`、`apps/api/test/rbac.test.ts`；后台登录页面与 HTTP 鉴权链未落地 |
| M04–M06 登录、用户、地址 | auth/users/addresses 服务、仓储、迁移和测试已有；M06 代码确实存在 | `apps/api/src/modules/{auth,users,addresses}/` 和对应测试；缺 HTTP 入口及小程序页面 |
| M07–M09 分类、SPU、SKU | catalog 服务、仓储、迁移和测试已有；SKU 与 SPU 分离 | `apps/api/src/modules/catalog/`、`apps/api/test/{category,product,sku}-service.test.ts`；管理端 CRUD 页面和公开 HTTP 接口未落地 |
| M10 商品发现/详情 | catalog 查询服务、公开商品视图模型和测试已有 | `catalog-query-service.ts`、`apps/miniapp/src/catalog-view-model.ts`；正式列表/详情 Vue 页面与网络适配器未落地 |
| M11–M12 购物车、结算预览 | 服务、仓储/测试已有；结算只给预览、不锁库存 | `apps/api/src/modules/{cart,checkout}/`；缺小程序页面和 HTTP 路由 |
| M13 订单 | 订单快照、幂等、状态等 service/repository/schema/test 已有 | `apps/api/src/modules/orders/`；订单代码未调用库存预占/取消释放，真实下单前必须补事务一致性与并发测试 |
| M14–M15 支付抽象/回调 | PaymentOrder、Mock/Disabled Provider、Mock 验签与幂等逻辑、迁移/测试已有 | `apps/api/src/modules/payments/`；真实渠道 Deferred；缺 HTTP 接口和端到端验证 |
| M16 发货物流 | shipment 服务、仓储、迁移/测试已有，Mock/Disabled 发货同步 | `apps/api/src/modules/shipping/`；实物出库与正式批次分配、真实微信同步未接通 |
| M17 供应商 | 已有领域服务、Prisma 仓储及建表迁移；评分采用 1–5 整数，停用代替删除 | `apps/api/src/modules/suppliers/`、`tasks/M17_供应商.md`；管理 HTTP 接口尚未接入 |
| M18 采购单 | 已有采购单/明细、供应商/SKU 关系与快照、金额整数分、草稿编辑及审批/下单/取消/关闭状态变更；到货状态由 M19 接入 | `apps/api/src/modules/procurement/`、`tasks/M18_采购.md`；管理 HTTP 接口未接 |
| M19 到货 | 已有幂等收货单、分批明细、称重/包装/运输记录、超收保护和事务内采购数量累计；自动更新部分/完成收货状态 | `apps/api/src/modules/procurement/`、`tasks/M19_到货.md`；收货未接库存入库，留给 M21/M23/M24 |
| M20 质检 | 已有按收货明细抽检、质量观察、等级、对象存储图片键、检查员、幂等与超量拦截；抽检结论拆分合格/降级/拒收数量 | `apps/api/src/modules/procurement/quality-inspection-service.ts`、`tasks/M20_质检.md`；质检结论还未生成库存批次或库存流水 |
| M21–M22 批次与仓库 | 未完成 | 下一步从 `tasks/M21_批次.md` 开始；批次需承接收货/质检结果与供应商、采购来源，并后续接 M23/M24 库存余额/流水 |
| M23–M24 库存余额/流水 | `inventory` 服务、仓储、迁移/测试已有，含守恒与流水；部分批次/仓库是引用维度 | `apps/api/src/modules/inventory/`；待接订单预占/取消/支付/出库，正式批次与仓库管理仍属 M21–M22 |
| M25–M29 盘点、损耗、包装、成品批次 | 未见独立业务模块与完成测试 | `tasks/M25_*.md` 至 `M29_*.md`、`docs/07_商品采购仓储库存设计.md`；不能直接手改库存代替流水 |
| M30–M32 售后、退款、补发 | aftersales/refunds/reship service、仓储、迁移/测试已有；退款仅 Mock/Disabled | `apps/api/src/modules/{aftersales,refunds}/`；缺 HTTP/小程序操作流和全链路验收 |
| M33–M36 优惠券、预售、会员、积分 | 未见独立业务模块 | 对应 `tasks/M33_*.md` 至 `M36_*.md`，再读 `docs/09_会员营销内容溯源企业团购.md` |
| M37–M39 内容、溯源、一盒一码 | miniapp/admin 中仅有 Port、草稿类型与入口模型；无正式领域服务/持久化 | `apps/miniapp/src/v12-ports.ts`、`apps/admin/src/miniapp-frontend-content-model.ts`；不得把模型标为内容/溯源模块完成 |
| M40–M42 企业团购、报价、多地址 | 未见独立业务模块 | 对应任务卡与 `docs/09_会员营销内容溯源企业团购.md` |
| M43–M46 报表、安全验收、全链路测试、部署 | `.github/workflows/ci.yml` 有质量门禁；其余未完成 | `docs/10_运营后台数据报表.md`、`docs/11_安全合规部署运维.md`、`docs/12_测试验收与里程碑.md`；CI 的定时检查不是本地代码自动提交/推送 |

## 6. 下一步顺序

1. **下一模块：M21 批次**，入口 `tasks/M21_批次.md`、`docs/07_商品采购仓储库存设计.md`。需关联供应商、采购单、到货记录、质检结果、仓库、等级、数量/重量与单位成本，再决定合格/降级/拒收货品如何进入不同库存状态。若开发目标转为让小程序可见，应另开明确任务实现 uni-app 运行骨架和首页，再接商品 HTTP 路由/网络适配。
2. 在开放真实下单前，必须补 M13 ↔ M23/M24 的库存原子预占、取消/超时释放和支付后待出库转换，并做并发/幂等验证。
3. 后续逐步补 API HTTP 层、正式小程序页面与后台页面；不要把 `prototype/` 或 TS 模型算作正式 UI 完成。
4. 每次变更先查 Git、改相关文件、测试、审 diff、提交；GitHub 连通时推送并核对远端提交。网络或权限失败须记录具体原因，不能写“已同步”。

## 7. 下次更新本文件的最小模板

`日期 / 分支 / HEAD / 工作树`；`本次模块及改动文件`；`已验证命令与结果`；`剩余缺口`；`下一模块及入口文件`；`push 结果`。只改变化的段落，避免重写整篇。

## 8. 2026-09-24 前台与后台预览 UI 更新

- “我的”页已改成账户服务卡片布局；新增 `apps/miniapp/pages/address/index.vue` 收货地址本机预览页，支持本机保存、地区选择、编辑、删除与默认地址选择。页面明确标注本地预览，未连接 M06 API/用户登录。
- 后台工作台标题、KPI、快捷入口居中；商品编辑甄选勾选控件改成对齐的选项卡；恢复演示数据改为低权重次要按钮。
- 路由在 `apps/miniapp/pages.json`；界面说明见 `apps/miniapp/README.md`。
- 已在 H5 预览中实际查看“我的”页、收货地址空状态/新增表单、后台工作台与商品编辑勾选项；uni-app 类型检查和 `UNI_INPUT_DIR=.` H5 构建通过，微信端真机仍未验收。

## 9. 2026-09-24 后台 API 与商品目录首批联接

- 本轮基线：`feature/v13-frontend-fusion`，起始 HEAD `c8e595c`；已有 4 个无关未跟踪文件，未修改。
- 新增管理员密码 scrypt 校验、8 小时数据库会话、退出撤销、权限查询；首次 owner 账号只能在管理员表为空时通过 bootstrap CLI 创建。新增 `admin_sessions` migration。
- API 增加 `127.0.0.1:3200` 启动入口；已挂载管理登录、RBAC 保护的 dashboard 计数、商品 SPU/SKU/分类 CRUD/上下架，以及公开分类/商品/搜索/详情读取接口。
- 后台现在提供登录、商品新增/编辑/上下架、SKU 规格/价格编辑、分类新增/编辑/启停/删除并调用真实 API；商品素材上传仍缺，其他模块后台尚未接入。小程序还没有切换到这些公开 API。
- 验证：Prisma client generate、根 `npm run check`（ESLint、TypeScript、30 个测试文件/101 tests、tsc build）、后台 Vue/Vite build、Prisma schema validate（使用非连接用占位 URL）均通过。未连数据库做 E2E。
- 真实联调阻塞：当前工作区无 `.env` 且无 `DATABASE_URL`；需安全配置 MySQL 连接并设首位管理员环境变量，然后执行 migration、build、bootstrap、start。不得在聊天中发送数据库密码。
- 本地查看后台：开发模式使用只读预览登录，账号配置存于 Git 忽略的 `apps/admin/.env.development.local`；页面展示样例数据并标注预览，写操作会被拒绝。已重启 Vite `127.0.0.1:5174` 读取该配置。
- 下一步：完成 M09 SKU 管理界面/API 验收，再接小程序公共 catalog port；后台依 M13/M16、M17-M20、M23-M32 等服务能力补管理操作。提交与 push 尚未执行。

## 10. 2026-09-24 构建修复与公开商品目录接入（当前）

- 本轮开始：分支 `feature/v13-frontend-fusion`，HEAD `18c9fb4`，远端 `c8e595c`；以最终 Git/远端核对结果为准。保留原有四个未跟踪预览文件，不纳入提交。
- uni-app 的 H5/微信 CLI 已统一指定输入根目录；添加锁定的 CJS 兼容 `estree-walker@2.0.2`；修复地址页微信 checkbox 编译错误。
- 管理端已具有会话/RBAC/catalog HTTP；小程序首页、分类和商品详情已接公开目录 HTTP，媒体按配置域名解析对象键。无数据库，因此只验收代码接线，未验收后台发布后跨设备同步。
- 隐藏消费者侧本机商品/购物车/故事/溯源/地址样例；未接服务的页面展示明确状态；只读运营预览页从发布路由移除。后台预览的身份和页脚现明确标识本机演示。
- 验证：`npm run check`（33 文件/109 tests）、uni-app 类型检查、H5/微信包/后台构建均通过；浏览器查看手机前台与桌面后台页面。API 3200 / MySQL 3306 不可用，AppID 空，真机未验收。
- 阻塞：为完成真实联调需安全配置测试 MySQL 与管理员；需授权媒体及 OSS 域名；配置微信 AppID 后再真机验收。真实支付继续 Deferred。
- 下一步：先 MySQL catalog E2E，再媒体/首页内容服务，然后用户交易、库存履约、售后及剩余模块。支付 Deferred 不阻塞这些工作。
