# 山禾颐品

本目录是山禾颐品唯一正式代码仓库，包含微信小程序、管理后台、API 与共享包。

## 本地开发入口

```powershell
npm install
npm run check
```

Node.js 要求 22 或更高版本。日常任务先读 `AGENTS.md`、`docs/PROJECT_STATE.md` 和 `docs/MODULE_INDEX.md` 的相关段落。

## 目录

- `apps/miniapp` 微信小程序入口
- `apps/admin` 管理后台入口
- `apps/api` API 入口（生产预留 `127.0.0.1:3200`）
- `packages/shared-types` 跨应用共享类型
- `docs` 产品/技术/状态文档
- `tasks` 低 Token 原子任务卡
- `scripts` Skill 安装与 Codex 启动脚本

## 支付状态

真实微信支付与支付宝当前均为 Deferred。现阶段只允许支付抽象、Mock 与 Disabled Provider；不得提交真实商户密钥或证书。

## 第一条指令

```text
执行 tasks/M06_地址.md。
严格遵守 AGENTS.md。
不要读取无关文档，完成后只输出摘要和测试结果。
```
