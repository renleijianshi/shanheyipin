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
