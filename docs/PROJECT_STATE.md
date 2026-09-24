# PROJECT_STATE

更新时间：2026-09-24

## 当前阶段

- Phase A：本地接管与 GitHub Private 仓库同步均已完成。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- GitHub：`renleijianshi/shanheyipin`，Private，默认分支 `main`。
- Git：用户于本轮重新授权查看 GitHub；2026-09-24 fetch 成功，审计基线本地 `131c05d` 比远端开发分支 `c8e595c` 领先 2、落后 0；远端 main 为 `d73518a`。本轮未 push，不代表写权限已验证。
- 当前 UI/API 任务：独立后台已接入管理员会话登录与 RBAC 权限校验、工作台计数、商品 SPU/SKU/分类读写和上下架 API；已提供公开商品目录 HTTP 读取接口。后台订单、售后、供应链、库存、报表等页面与 API 仍待接入，小程序也尚未切换到公开 HTTP API。当前工作区缺少 `DATABASE_URL`，真实数据库联调与登录验收未完成。
- 当前分支：`feature/v13-frontend-fusion`；后台 catalog 提交实际为 `a5de655`，本机只读预览登录为 `131c05d`。`admin / 123` 只用于本机演示，不能据此认定真实数据库管理员已开通。
- 上线状态：尚不可正式交易上线。M01-M20、M23-M24、M30-M32 的“完成”主要指相应代码层，不能代替 HTTP、前后台接入、MySQL 与真机验收；订单库存预占尚未接入。
- 完整差距表、证据、实施顺序与验收标准：`docs/LAUNCH_READINESS_PLAN.md`，下次按该文档的当前阶段局部读取。

## 已确认约束

- 本目录与唯一 GitHub Private 仓库 `shanheyipin` 一一对应，不建立第二份代码副本。
- 模块化单体；全栈 TypeScript；金额使用整数分。
- Real WeChat Pay = Deferred。
- Real Alipay = Deferred。
- 当前只允许 Mock/Disabled 支付提供方；不得因商户资质阻塞其他模块。
- 新 API 绑定 `127.0.0.1:3200`。
- 不覆盖、删除或停止服务器旧 `/opt/shanhe-yipin` 及其服务。
- 生产目标为 Caddy + systemd + 现有 MySQL + 轻量 Redis；媒体放 OSS；构建和测试优先放在 GitHub Actions。

## 下一步

1. 修复微信构建入口及 `estree-walker` 加载兼容问题；配置测试 MySQL 与初始管理员，执行迁移。
2. 验收现有商品/分类/SKU API 和后台，将小程序首页、分类、详情接到同一数据库。
3. 补首页配置、甄选、故事、媒体上传；保留 V19 视觉和已确认交互。
4. 按上线方案逐项补消费者 HTTP、交易页面、库存事务、履约、供应链、营销、溯源、企业业务与报表。
5. 完成 CI 数据库集成、微信真机、安全与部署验收；真实支付仍 Deferred，正式收款前另行验收。

## 阻塞

- 2026-09-24：本机无 `DATABASE_URL`、根 `.env`，3200/3306 未监听；真实数据库联调未进行。
- 微信默认构建找不到 `src/manifest.json`；指定输入根目录后仍报 `estree-walker` exports 错误；AppID 为空。
- 本次根检查 30 文件/101 测试与后台构建通过；不等同于真实数据库及微信发布验收。
- npm audit 服务于 2026-09-20 返回 503；本模块未新增依赖，上一次锁文件审计为 0 漏洞。
