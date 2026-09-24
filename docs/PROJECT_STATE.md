# PROJECT_STATE

更新时间：2026-09-24

## 当前阶段

- Phase A：本地接管与 GitHub Private 仓库同步均已完成。
- 正式目录：`C:\Users\19993\Desktop\山禾颐品\daima`。
- GitHub：`renleijianshi/shanheyipin`，Private，默认分支 `main`。
- Git：本地已完成 M01-M16、M23-M24、M30-M32；按用户要求暂不访问 GitHub，远程同步后置。
- 当前 UI 任务：V19 小程序主要页面视觉迁移已完成第一、二批；独立后台 Vue/Vite 工作台、商品/分类读屏与商品编辑界面已建立。管理 API、后台登录/RBAC 联调、写入操作、正式素材及微信真机验收仍未完成。
- 当前分支：`feature/v13-frontend-fusion`。UI 页面改动分阶段推送后，远端与本地保持同一提交；本轮后台工程界面变更待验证提交。

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

1. 完成后台 UI 类型检查、构建与响应布局检查；验证后按阶段提交并推送。
2. 与 API/认证实现对齐后台接口路径和权限会话，再启用新增、编辑、订单、售后及供应链操作。
3. 按 `DESIGN.md` 检查 miniapp 全部页面，补微信构建工具链与真机验收。
4. 获取授权商品/产地实拍图，并替换未确认授权的演示图片。

## 阻塞

- npm audit 服务于 2026-09-20 返回 503；本模块未新增依赖，上一次锁文件审计为 0 漏洞。
