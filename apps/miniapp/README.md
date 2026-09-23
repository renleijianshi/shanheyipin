# V19 小程序页面迁移说明

更新时间：2026-09-23

## 采用的来源

- 外部设计稿：`C:\Users\19993\AppData\Local\Temp\codex-file-preview-0U11BJ\山禾颐品_UI_V19_首页精简版.html`（本机临时预览文件，不随 Git 仓库提交）。
- 迁移依据：V19 页面内的 uni-app 迁移约定、`apps/miniapp/src/v12-ui-model.ts` 与 `apps/miniapp/src/v12-ports.ts`。
- 开发约束：仓库根目录 `AGENTS.md`、`PROJECT_CHECKPOINT.md` 与 `.agents/skills/shanheyipin-miniapp-ui/SKILL.md`。

## 已映射到正式 uni-app 页面

- V19 的颜色 token、舟曲首页主视觉与文案、四个快捷入口、商品卡、山野故事入口和产品快捷详情片；保留“测试：进入后台预览”按钮。
- 五个原生底部导航：首页、分类、甄选、购物车、我的。
- 分类筛选与甄选频道沿用 V12 页面契约；甄选页不显示价格和加购。
- 山野故事、扫码溯源与后台预览作为二级页面；溯源按钮调用 `uni.scanCode`。
- 后台预览按照 V19 的经营、小程序前台、交易、用户增长、供应链、企业与系统分组，所有操作均标为演示，不写入数据。

## 主要代码入口

- 页面路由与原生 tabBar：`pages.json`
- 首页：`pages/home/index.vue`
- 分类、甄选、购物车、我的：`pages/category/index.vue`、`pages/selection/index.vue`、`pages/cart/index.vue`、`pages/profile/index.vue`
- 故事、溯源、后台预览：`pages/story/index.vue`、`pages/trace/index.vue`、`pages/admin-preview/index.vue`
- 共用商品卡、设计 token、预览商品：`components/ProductTile.vue`、`styles/tokens.css`、`preview-products.ts`
- V12 页面契约与 Port：`src/v12-ui-model.ts`、`src/v12-ports.ts`

## 目前仍是预览的内容

- 商品卡片数据来自 `preview-products.ts`，不是正式商品目录；加入购物车、商品详情、故事列表及后台菜单没有接 API。
- 设计稿内的外部图片链接未直接嵌入小程序。图片的授权、稳定性及微信合法下载域名未确认；页面以 V19 色彩构图和 CSS 场景占位，正式上线前需接入授权素材及对象存储键。
- manifest 的微信 AppID 为空；本版本不能发布。
- 2026-09-23 的验证：Vue/TS 类型检查与仓库 ESLint 通过；uni-app H5 页面构建在 Vite 5.2.8 / uni-app compiler 5.24 环境通过。微信小程序构建未通过：当前 npm workspace 的 Node 24 + uni-app CLI 在解析配置时报 `No "exports" main defined ... estree-walker`。Node 22 下直接调用 Vite 可构建 H5；微信平台 CLI 的配置加载仍触发同一问题，需单独修复工具链版本/依赖兼容后，再用微信开发者工具验收。

## 下次续写顺序

1. 先确认 Node 与 uni-app CLI/`estree-walker` 兼容，修复 `build:mp-weixin` 并在微信开发者工具打开。
2. 接入真实商品查询 Adapter，删除预览商品作为真实内容的可能性；完成商品详情、购物车及结算 API 页面。
3. 加入经确认授权的图片素材/对象键和微信下载域名配置。
4. 独立实现 Web 管理后台认证与内容 API；当前页面“后台”按钮只用于设计预览。

## 本机运行

- 用 HBuilderX 打开 `apps/miniapp`，或从子目录执行 `npm run dev:h5` / `npm run dev:mp-weixin`。
- 微信开发者工具需要已配置的 AppID；当前 manifest 中留空，且微信端构建需先解决上面的依赖错误。
