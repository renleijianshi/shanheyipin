# 山禾颐品运营管理后台

## 当前状态

`web/` 是 Vue 3 + Vite 的正式后台界面入口，包含经营概览、商品列表、商品编辑表单和商品分类页。`src/` 保留现有管理领域模型与验证逻辑。

管理 UI 使用同源 `/api/v1/admin/*` 请求；Vite 开发服务把 `/api` 转发到项目约定的 `127.0.0.1:3200`。请求遵循项目公共响应的 `data` 包装，并读取当前浏览器会话中的 `shanhe.admin.accessToken`（若认证层写入）。

**当前仓库尚无可运行的管理 HTTP 服务、登录/权限会话或管理写接口。**因此管理界面不会显示伪造的指标或商品，读取失败时明确给出错误状态；商品编辑表单可查看，但保存保持禁用。不要将当前 UI 视为已可执行运营操作。

## 本机开发

从仓库根目录运行：

```powershell
npm run dev --workspace @shanheyipin/admin
```

打开 `http://127.0.0.1:5174`。页面布局针对 1366px 起的桌面、中等屏幕和手机适配。管理 API 尚未运行时，界面展示服务未接通说明。

## 验证

```powershell
npm run typecheck --workspace @shanheyipin/admin
npm run build --workspace @shanheyipin/admin
```

接口联调需等待管理认证、仪表盘、商品与分类 HTTP 路由实现；当前仅做只读请求，不执行任何写操作。
