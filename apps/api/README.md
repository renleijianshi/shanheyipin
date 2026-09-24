# API 本机运行

管理后台使用本 API 的 `/api/v1/admin/*` 接口；小程序可通过 `/api/v1/categories`、`/api/v1/products`、`/api/v1/search` 和商品详情 GET 接口读取已上架目录。

首次启用前，需要在本机安全环境配置 `DATABASE_URL`（MySQL 连接）以及 `ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD`。初始管理员密码至少 12 位。不要将真实凭据写进 Git。

```powershell
npm run db:migrate:deploy
npm run build
npm run bootstrap:admin --workspace @shanheyipin/api
npm run start --workspace @shanheyipin/api
```

API 仅绑定 `127.0.0.1:3200`。管理员首次创建只允许在 `admin_users` 为空时运行；管理登录产生 8 小时会话，退出会撤销会话。商品与分类写操作分别要求 `catalog.product.write`、`catalog.category.write` 权限。首次管理员通过系统管理员角色拥有全部权限。

当前 HTTP 层覆盖管理登录/登出、工作台计数、商品与分类管理及公开商品目录读取。其他后台领域接口和小程序网络适配仍需按 `docs/MODULE_INDEX.md` 后续接入。
