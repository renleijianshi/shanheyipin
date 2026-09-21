# PROJECT_STATE

更新时间：2026-09-21

## 当前阶段

- Phase A：本地接管与 GitHub Private 仓库同步均已完成。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- GitHub：`renleijianshi/shanheyipin`，Private，默认分支 `main`。
- Git：本地 `main` 已合并 M01-M15；按用户要求暂不访问 GitHub，远程同步后置。
- 当前任务：M15 支付回调抽象已完成；下一任务 M16 发货物流（真实微信支付继续 Deferred）。

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

1. 进入 M16 发货物流。
2. 继续仅基于本地仓库推进，暂不访问 GitHub。
3. 用户恢复 GitHub 工作后再一次性核对并同步远程。

## 阻塞

- npm audit 服务于 2026-09-20 返回 503；本模块未新增依赖，上一次锁文件审计为 0 漏洞。
