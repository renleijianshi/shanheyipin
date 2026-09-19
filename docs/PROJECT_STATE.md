# PROJECT_STATE

更新时间：2026-09-19

## 当前阶段

- Phase A：本地接管完成，GitHub 同步因 secondary rate limit 延后。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- Git：`main` 已有首次提交；M01 在 `feature/M01-project-bootstrap` 完成本地验证。
- 当前任务：M01 项目骨架已完成；下一任务 M02 数据库基础。

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

1. 本地 Review 并合并 M01。
2. 进入 M02 数据库基础。
3. GitHub 限流解除后，只做一次仓库创建/确认与推送，不重复扫描远端。

## 阻塞

- GitHub secondary rate limit：暂停全部远程访问，本地开发不受影响。
