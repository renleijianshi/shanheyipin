# V19 小程序页面迁移说明

更新时间：2026-09-23

## 采用的来源

- V19 原型副本：`apps/miniapp/v19-preview.html`；该文件保留为视觉和交互对照，不作为正式小程序运行入口。
- 迁移依据：V19 页面内的 uni-app 迁移约定、`apps/miniapp/src/v12-ui-model.ts` 与 `apps/miniapp/src/v12-ports.ts`。
- 开发约束：仓库根目录 `AGENTS.md`、`PROJECT_CHECKPOINT.md` 与 `.agents/skills/shanheyipin-miniapp-ui/SKILL.md`。

## 已映射到正式 uni-app 页面

- V19 的颜色 token、舟曲首页主视觉与文案、四个快捷入口、商品卡、山野故事入口和产品详情片；保留首页右上角“后台预览”测试入口。H5 宽屏以 390px 手机画框展示小程序，避免 `rpx` 在电脑上被放大。
- 五个原生底部导航：首页、分类、甄选、购物车、我的。
- 分类筛选与甄选频道沿用 V12 页面契约；甄选页不显示价格和加购。
- 山野故事、扫码溯源与后台预览作为二级页面；溯源按钮调用 `uni.scanCode`。
- 后台预览沿用 V19 的经营、小程序前台、交易、用户增长、供应链、企业与系统分组。首页图片、商品新增/上下架、甄选归属、故事发布/草稿、溯源记录启用/停用均可在本机保存，并被前台读取；提供恢复演示数据入口。
- 分类商品加入本地演示购物车，购物车可增减数量；首页、分类、甄选、故事与溯源页面会重新显示时读取后台保存的数据。
- 首页下方故事展示模块已按用户要求移除，快捷入口仍可打开故事列表；分类商品详情改为固定底栏、内容独立滚动，完整保留图片、产地、规格、详情和加入购物车；甄选页恢复本地/本期内容、时令卡片与 V19 对照图；后台表单改为明确高度的独立滚动面板，按钮和横向菜单样式统一。

## 主要代码入口

- 页面路由与原生 tabBar：`pages.json`
- 首页（故事快捷入口；首页下方故事模块已移除）：`pages/home/index.vue`
- 分类、甄选、购物车、我的：`pages/category/index.vue`、`pages/selection/index.vue`、`pages/cart/index.vue`、`pages/profile/index.vue`
- 故事、溯源、后台预览：`pages/story/index.vue`、`pages/trace/index.vue`、`pages/admin-preview/index.vue`
- 共用商品卡和详情片、设计 token、预览商品：`components/ProductTile.vue`、`components/ProductSheet.vue`、`styles/tokens.css`、`preview-products.ts`
- V19 本地预览数据和前后台联动：`src/v19-content-store.ts`
- V12 页面契约与 Port：`src/v12-ui-model.ts`、`src/v12-ports.ts`

## 目前仍是预览的内容

- 目前共用本机 uni-app storage，不是线上数据库或 API；不同设备/用户之间不会同步。购物车、商品详情和溯源仍是演示流程，不能创建真实订单或验证线上批次。图片及演示商品信息来源 V19 HTML，未作为正式商品/授权素材。
- V19 的订单、售后、会员、营销、采购、仓储、加工、财务、权限等菜单在原 HTML 中也是结构占位；当前保留导航并说明尚待管理后台和对应 API 实现。
- 当前本机 V19 视觉预览使用原 HTML 中的外部演示图片 URL；礼盒原图链接已失效，页面显示回退图。图片不是已确认授权的正式素材，也未核对微信下载域名。正式上线前必须换成授权素材和对象存储键；后台图片管理目前支持 URL 编辑，尚未提供本地上传。
- manifest 的微信 AppID 为空；本版本不能发布。
- 2026-09-23 的验证：Vue/TS 类型检查、仓库 ESLint 通过；指定 `UNI_INPUT_DIR=.` 后 Vite H5 编译通过。直接执行 `npm run build:h5` 仍因 CLI 默认寻找不存在的 `src/manifest.json` 失败；`build:mp-weixin` 在加载 Vite 配置时因 `estree-walker` 包 exports 报错，微信端未能完成构建和真机验收。

## 下次续写顺序

1. 补齐并验收 uni-app H5/微信小程序构建工具链，使用微信开发者工具检查真机布局与交互。
2. 实现并接入内容/溯源 API 与正式 Web 管理后台认证；将本机预览存储替换为后端数据。
3. 接商品详情、购物车及结算 API；真实下单前完成订单与库存预占的事务链路。
4. 接入经确认授权的图片素材/对象键和微信合法下载域名。

## 本次联动变更

- `2026-09-23`：增加 `src/v19-content-store.ts` 本机预览数据层；后台保存的商品、甄选、故事、溯源和首页图能反馈到前台；加入/调整购物车演示数据。
- `2026-09-23`：补齐 V19 视觉迁移：真实首页主视觉、窄屏布局、分类商品、选品图文、故事切换、商品详情与后台桌面布局；本机演示存储由 v2 升级为 v3，保留用户新增商品并更新默认演示商品。
- `2026-09-23`：修正商品详情抽屉的滚动与固定加购栏；甄选页恢复时令内容和原型对应图片；移除首页下方山野故事展示模块，保留快捷入口；调整后台导航和弹窗滚动及控件反馈。
- 验证：`npm run lint`、`npm run typecheck:uni --workspace @shanheyipin/miniapp` 通过；设置 `UNI_INPUT_DIR=.` 后 Vite H5 构建通过。package script 默认入口目录不匹配导致直接 CLI build 报错，仍需修正统一启动脚本。微信构建/真机尚未验收。

## 本机运行

- 用 HBuilderX 打开 `apps/miniapp`，或从子目录执行 `npm run dev:h5` / `npm run dev:mp-weixin`。
- 微信开发者工具需要已配置的 AppID；当前 manifest 中留空，且微信端构建需先解决上面的依赖错误。
