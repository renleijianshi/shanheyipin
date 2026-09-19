# PROJECT_STATE

更新时间：2026-09-19

## 当前阶段

- Phase A：进行中。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- Git：已初始化 `main`，等待首次提交与 GitHub 远端。
- 当前任务：M01 项目骨架。

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

1. 完成首次提交并推送 `main`。
2. 在 `feature/M01-project-bootstrap` 完成 workspace、miniapp、admin、api、质量门禁与 CI。
3. Review 后合并，再进入 M02。

## 阻塞

- GitHub 命令行未安装；需通过已登录浏览器或用户首次授权创建/确认私有仓库。
- Git 提交者身份尚未从 GitHub 账户确认。

