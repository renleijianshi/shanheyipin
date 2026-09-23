# 山禾颐品｜代码现状与续开发断点

更新时间：2026-09-23。本文件供下次开发先读，记录的是**正式仓库实际代码**，不是 V1 规划的完成承诺。范围仅为 `C:\Users\19993\Desktop\山禾颐品\daima`。

## 1. 下次如何省 Token

1. 先读根目录 `AGENTS.md`、本文件；执行 `git status --short --branch` 和 `git log -3 --oneline`。
2. 从第 5 节找到目标模块，只读对应 `tasks/Mxx_*.md`、1～3 份业务文档、所列源码与测试。需要改数据库时再读 `apps/api/prisma/schema.prisma` 的相关模型和对应 migration。
3. 优先 `git grep` / `git diff` 定位。不要每次重扫全部 `apps/`、全部 `docs/` 或重新阅读 V1 全套。
4. 完成一个模块后运行相关测试及 `npm run check`，检查 diff，再更新本文件中该模块状态、关键文件、缺口、测试结果和下一步。
5. 本文件与代码冲突时以代码和 Git 为准；旧 `docs/TASKS.md`、`docs/PROJECT_STATE.md`、`docs/PROGRESS.md` 中部分“下一任务/同步”描述未及时更新。

## 2. 本次核验基线

| 项目 | 2026-09-23 实况 |
| --- | --- |
| 当前仓库 | `C:\Users\19993\Desktop\山禾颐品\daima`，`origin = https://github.com/renleijianshi/shanheyipin.git` |
| 分支与检查时 HEAD | `feature/v13-frontend-fusion`；开始本次 V19 页面工作时为 `19ee256`，本次提交后补充新 HEAD |
| 检查开始时工作树 | 本次任务开始前工作树干净；本次新增 V19 uni-app 页面、标准工程入口与迁移说明 |
| 远程同步 | 2026-09-23 已为本仓库配置 `http://127.0.0.1:7897` Git 代理；开发分支与默认 `main` 均通过 `git ls-remote` 核对为 `205896e`。后续每次提交仍须实际推送并核对；代理未运行或网络中断时不能宣称同步 |
| 代码规模证据 | 16 个 Prisma migration；API 22 个、miniapp 4 个、admin 2 个测试文件 |
| 本机验证 | 本次 `npm run lint`、`npm run typecheck:uni --workspace @shanheyipin/miniapp` 通过；Node 22 下直接以 Vite 编译 H5 通过；`build:mp-weixin` 仍失败 |
| 验证边界 | 本次未运行全仓测试；未在微信开发者工具验收，未验证真实商品/API、素材授权、购物车端到端或生产部署 |

本次参考的 V1 原始资料位于 `C:\Users\19993\Desktop\山禾颐品\小程序文件`：`00_项目总览_README.md`、`AGENTS.md`、`山禾颐品_Work执行总说明_v1.md`。它们定义产品范围和最初路线；其中“业务代码尚未开始”、旧启动包目录、Docker/Nginx 建议均是当时状态。当前有效部署与支付决策见 `docs/DECISIONS.md` 和 `docs/PROJECT_STATE.md`，实际完成度以下表及代码为准。

## 3. 三个应用的真实完成度

| 应用 | 已有 | 尚缺 | 优先读取 |
| --- | --- | --- | --- |
| API | `apps/api/src/modules/` 下的业务服务、Prisma 仓储和迁移 | `src/index.ts` 仍是 bootstrap manifest 和健康函数；未见 NestJS 启动、Controller、路由、OpenAPI 或实际监听 `127.0.0.1:3200` 的代码 | `apps/api/src/index.ts`、目标模块 service/repository/test |
| 微信小程序 | 已建立 uni-app + Vue 3 页面骨架，V19 首页/分类/甄选/空购物车/我的/故事/扫码溯源/后台预览、V19 设计 token、五栏原生导航及测试后台入口均已落入 `apps/miniapp/`；V12 分类/甄选契约继续复用 | 当前商品为预览数据、图片为占位，商品/购物车/内容/后台 API 未接；manifest AppID 为空；H5 构建和页面类型检查通过，微信端编译被 uni-app CLI 与 `estree-walker` 依赖解析错误阻塞，不能宣称可发布 | `apps/miniapp/README.md`、`apps/miniapp/pages.json`、`apps/miniapp/pages/home/index.vue`、`apps/miniapp/src/v12-ports.ts`、`apps/miniapp/src/v12-ui-model.ts` |
| Web 管理后台 | “小程序前端添加”四种内容入口的数据模型和校验函数 | `apps/admin/src/` 只有 TS 文件；没有 Vue/Vite/Element Plus 页面、登录界面、管理路由或 API 连接 | `apps/admin/src/miniapp-frontend-content-model.ts` |

`prototype/index.html` 仍为独立演示原型。本机临时预览文件 `山禾颐品_UI_V19_首页精简版.html` 已按其 V19 视觉契约迁移到正式 uni-app 页面；映射细节、依赖来源、已知缺口及后续顺序见 `apps/miniapp/README.md`。首页保留“测试：进入后台预览”按钮，进入的是只读演示后台，无登录或 API 写入。V19 引用的外链图片尚未确认授权与微信域名，页面以占位呈现。H5 与类型检查通过；微信端构建被当前 CLI/`estree-walker` 依赖兼容问题阻塞。

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
