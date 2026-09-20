# PROJECT_STATE

更新时间：2026-09-20

## 当前阶段

- Phase A：本地接管与 GitHub Private 仓库同步均已完成。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- GitHub：`renleijianshi/shanheyipin`，Private，默认分支 `main`。
- Git：本地 `main` 已合并并推送 M01-M06，跟踪 `origin/main`。
- 当前任务：M07 商品分类在 `feature/M07-product-categories` 开发中。

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

1. 完成 M07 商品分类测试、Review、提交与合并。
2. 推送完成的功能分支并建立 PR 记录。
3. 进入 M08 SPU。

## 阻塞

- npm audit 服务于 2026-09-20 返回 503；本模块未新增依赖，上一次锁文件审计为 0 漏洞。
