# 山禾颐品运营管理后台

## 当前状态

`web/` 是 Vue 3 + Vite 的正式后台界面入口，包含账号登录、经营概览、商品列表/编辑/上下架和商品分类维护。`src/` 保留现有管理领域模型与验证逻辑。

管理 UI 使用同源 `/api/v1/admin/*` 请求；Vite 开发服务把 `/api` 转发到项目约定的 `127.0.0.1:3200`。登录后令牌保存在当前浏览器会话中，API 每次请求检查会话、管理员状态和对应 RBAC 权限。分类与商品改动写入 MySQL；公开小程序目录接口读同一份商品、SKU、分类数据。

当前管理 HTTP 层已覆盖认证、经营概览计数、SPU/SKU/分类读写、上下架和公开目录读取。还未覆盖订单履约、售后、供应链、库存、报表等后台模块；商品素材上传仍缺。不要将这些未接入模块当作可执行运营操作。

## 本机开发

配置好 `apps/api/README.md` 中的数据库和首次管理员后，从仓库根目录启动 API：

```powershell
npm run dev --workspace @shanheyipin/admin
```

打开 `http://127.0.0.1:5174`。页面布局适配桌面、中等屏幕和手机；未启动 API 时登录会显示明确的服务错误。

后台仅在 API 服务 `127.0.0.1:3200` 和数据库已配置时可登录。此工作区没有已配置的 `DATABASE_URL`，本轮无法用真实数据库账户做完整联调。

## 验证

```powershell
npm run typecheck --workspace @shanheyipin/admin
npm run build --workspace @shanheyipin/admin
```

目录 CRUD 和上下架接口已支持写请求；其余后台模块按进度文件逐项接入。
