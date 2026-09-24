# V19 小程序页面与运行状态

更新时间：2026-09-24

## 页面与数据

- V19 原型 `v19-preview.html` 仅作视觉参考；当前正式入口是 `pages.json` 中的 uni-app 路由。H5 宽屏用 390px 手机画框显示页面。
- 首页、分类和商品详情通过公开 catalog HTTP API 获取后台已发布商品、在售 SKU、规格与价格；API 不可用时显示错误和重试，不回退到本地演示商品。
- 商品媒体保存对象键，通过 `VITE_MEDIA_BASE_URL` 解析；未配置域名、缺少图片或加载失败时显示实拍素材待接入。未经确认的 V19 外链图片不用于当前商品卡。
- 保留已确认的详情介绍、规格选择、实时 SKU 价格和固定购买栏。购物车接口尚未接入，因此“加入购物车”保留为禁用控件并说明原因。
- 甄选、故事、溯源、登录、地址、购物车、订单、物流、售后尚未连接正式服务；相应页面不展示本机样例记录，不保存在本机的地址/购物车，也不接受下单。
- 首页下方山野故事模块保持移除。故事、溯源快捷入口标示待接入；小程序发布路由已移除运营预览页。
- 后台商品/分类的管理页面与 HTTP API 已实现；本机后台预览仅只读演示，真实管理员及 MySQL 写操作尚未验收。

## 主要代码入口

- 路由、原生 tabBar：`pages.json`
- 首页、分类、商品详情组件：`pages/home/index.vue`、`pages/category/index.vue`、`components/ProductTile.vue`、`components/ProductSheet.vue`
- HTTP envelope 与 uni 请求：`src/public-api-client.ts`
- 商品列表/详情适配：`src/public-catalog-port.ts`
- 对象键到媒体 URL：`src/public-media-url.ts`
- V12 页面契约：`src/v12-ui-model.ts`、`src/v12-ports.ts`
- 设计基线：根目录 `DESIGN.md`

## 验证与边界

- 通过：`npm run check`（33 个测试文件 / 109 项测试）、`npm run typecheck:uni --workspace @shanheyipin/miniapp`、微信构建、H5 构建、后台构建。
- 浏览器检查：前台首页、分类、甄选、购物车、我的与地址状态页；桌面后台工作台与商品表。商品 API 断开时页面显示连接错误。
- 尚未验收：真实 API + MySQL、后台发布后跨设备同步、详情实际 SKU 交互、真实媒体/OSS、微信开发者工具/真机、AppID 与正式发布。当前 `manifest.json` AppID 为空。
- 本机无 `DATABASE_URL`，API 3200 与 MySQL 3306 未监听；浏览器不能验收真实商品内容或管理员写入。
- 实际运行支付保持 Mock/Disabled；真实微信支付/退款继续 Deferred。

## 下一步

1. 配置测试 MySQL 和测试管理员，迁移并启动 API，验收后台新增/修改/上下架→小程序首页/分类/详情刷新。
2. 配置授权实拍素材与媒体域名，验收对象键和微信合法下载域名。
3. 接入首页内容、甄选、故事与溯源管理/查询，再按顺序接登录、地址、购物车、结算、订单、库存履约和售后。
4. 设置 AppID，完成微信开发者工具与真机检查。

## 本机运行

- 从仓库根目录运行 `npm run dev:h5 --workspace @shanheyipin/miniapp`，H5 默认请求 `/api`，代理到 `127.0.0.1:3200`。
- 微信开发者工具使用 `apps/miniapp/dist/build/mp-weixin`；AppID 留空时可以生成包，但不能发布。
