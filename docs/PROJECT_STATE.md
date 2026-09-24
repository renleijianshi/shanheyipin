# PROJECT_STATE

更新时间：2026-09-24

## 当前阶段

- Phase A：本地接管与 GitHub Private 仓库同步均已完成。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- GitHub：`renleijianshi/shanheyipin`，Private，默认分支 `main`。
- Git：本地已完成 M01-M16、M23-M24、M30-M32；按用户要求暂不访问 GitHub，远程同步后置。
- 当前 UI/API 任务：独立后台已接入管理员会话登录与 RBAC 权限校验、工作台计数、商品 SPU/SKU/分类读写和上下架 API；已提供公开商品目录 HTTP 读取接口。后台订单、售后、供应链、库存、报表等页面与 API 仍待接入，小程序也尚未切换到公开 HTTP API。当前工作区缺少 `DATABASE_URL`，真实数据库联调与登录验收未完成。
- 当前分支：`feature/v13-frontend-fusion`。本轮后台 catalog API 与页面操作已提交为 `4970a0f`；远端同步按当前交接要求暂缓，真实 MySQL 联调待本机配置后完成。

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

1. 配置 MySQL 与初始管理员后，执行迁移并联调后台登录、商品/分类上下架及公开目录读取。
2. 接入 SKU 管理，再依模块索引逐项补订单、售后、供应链、库存和报表后台操作。
3. 将小程序 V19 数据适配切换至公开 API，并做完整前后台同库验收。
4. 按 `DESIGN.md` 检查 miniapp 全部页面，补微信构建工具链与真机验收。
5. 获取授权商品/产地实拍图，并替换未确认授权的演示图片。

## 阻塞

- npm audit 服务于 2026-09-20 返回 503；本模块未新增依赖，上一次锁文件审计为 0 漏洞。
