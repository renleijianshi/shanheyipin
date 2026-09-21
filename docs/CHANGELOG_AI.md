# CHANGELOG_AI

## 2026-09-19

- 将有效启动包迁入唯一正式目录。
- 初始化 Git `main`。
- 建立 PROJECT_STATE、MODULE_INDEX、REQUIREMENTS、DECISIONS、PROGRESS、CHANGELOG_AI 长期记忆。
- 记录真实微信支付与支付宝 Deferred、Mock/Disabled 优先及轻量部署约束。
- 完成 M01：npm workspace、api/admin/miniapp 入口、共享类型、TypeScript、ESLint、Vitest、构建与本地 CI 工作流。
- M01 本地验证通过：lint、typecheck、4 tests、build、production audit。
- 完成 M02：Prisma 6/MySQL 数据源、生成客户端、数据库 URL 校验、空基线 migration 和安全迁移运行手册。
- M02 本地验证通过：Prisma validate、lint、typecheck、7 tests、build。
- 完成 M03：管理员、角色、六类权限、关联表、唯一约束与纯领域鉴权函数。
- M03 本地验证通过：Prisma generate/validate、lint、typecheck、11 tests、build、0 audit vulnerabilities。
- 完成 M04：微信 code 交换适配器、用户自动创建/绑定、随机会话令牌、Prisma 用户/微信身份/会话模型。
- 修正 Prisma `migration_lock.toml` 到 CLI 要求的 `migrations/` 目录。
- M04 本地验证通过：Prisma validate、lint、typecheck、17 tests、build；npm audit 因官方服务 503 未重复请求。
- 完成 M05：最小公开用户资料、昵称规范化、OSS 头像对象键校验与 Prisma 仓储。
- M05 本地验证通过：Prisma generate、lint、typecheck、20 tests、build。
- 完成 M06：地址 CRUD、用户归属校验、默认地址事务切换、删除后默认回补和订单地址快照。
- M06 本地验证通过：Prisma generate/validate、lint、typecheck、23 tests、build。
- 完成 GitHub Private 仓库确认、本地 `origin` 绑定与 M01-M06 `main` 首次同步。
- 完成 M07：分类树模型、后台 CRUD 契约、小程序启用树、层级防循环与安全删除。
- 完成 M08：SPU 主数据、媒体、标签、上下架校验、分页管理与 Prisma 事务仓储。
- 完成 M09：SKU 主数据、规范化规格与唯一签名、整数价格/重量、条码、上下架约束及 Prisma 事务仓储；库存明确后置。
- 完成 M10：公开商品列表、搜索、详情查询，分类祖先可见性过滤、小程序展示模型，以及可点击的小程序/运营后台 HTML 原型。
- 完成 M11：单用户购物车、SKU 合并加购、数量与条目上限、用户归属校验、并发串行写入、商品可售性复核和失效项保留展示；购物车不占库存。
- M11 本地验证通过：Prisma generate/validate、lint、typecheck、54 tests、build。
- 完成 M12：结算条目选择、地址归属、服务端商品计价、优惠明细占位、固定运费与满额包邮报价器，以及 Disabled 运费配置保护。
- M12 本地验证通过：Prisma validate、lint、typecheck、59 tests、build。
- 完成 M13：订单主表、商品/地址快照、金额明细、状态日志、用户级幂等键与请求哈希、事务内二次校验、购物车清理、列表详情和未支付取消。
- 修复订单重试先重新读取已清空购物车的问题：现先回放幂等结果，仅新请求进入结算。
- M13 本地验证通过：Prisma generate/validate、lint、typecheck、63 tests、build；库存预占明确待 M23。
