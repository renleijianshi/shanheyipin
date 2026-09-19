# API 设计规范

## 1. 基础

统一前缀：

```text
/api/v1/
```

返回结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "..."
}
```

> 上述 JSON 仅为协议示意，不代表程序实现。

---

## 2. 身份认证

### 用户端

- 微信 `code` 换取服务端登录态；
- 服务端签发 access token；
- refresh token 可选；
- 不把 openid 当公开业务 ID。

### 管理端

- 账号密码；
- 可选 MFA；
- RBAC；
- 操作审计。

---

## 3. API 分组

### Auth

- `POST /auth/wechat/login`
- `POST /auth/phone/bind`
- `POST /auth/logout`
- `POST /auth/account/cancel`

### User

- `GET /me`
- `PATCH /me`
- `GET /me/addresses`
- `POST /me/addresses`
- `GET /me/coupons`
- `GET /me/points`
- `GET /me/favorites`

### Catalog

- `GET /categories`
- `GET /products`
- `GET /products/:id`
- `GET /products/:id/skus`
- `GET /search`

### Cart

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`

### Checkout

- `POST /checkout/preview`
- `POST /orders`

### Orders

- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/cancel`
- `POST /orders/:id/confirm-receipt`

### Payments

- `POST /orders/:id/payment`
- `POST /payments/wechat/notify`
- `GET /payments/:id/status`

### Shipping

- `GET /orders/:id/logistics`

### Aftersale

- `POST /aftersales`
- `GET /aftersales`
- `GET /aftersales/:id`
- `POST /aftersales/:id/return-logistics`

### Marketing

- `GET /coupons/available`
- `POST /coupons/:id/claim`
- `GET /promotions`
- `GET /presales/:id`

### Content

- `GET /articles`
- `GET /articles/:id`
- `GET /topics/:id`

### Trace

- `GET /trace/:code`
- `POST /trace/:code/scan`

### Enterprise

- `POST /enterprise/inquiries`
- `GET /enterprise/inquiries/my`

---

## 4. 管理 API 分组

```text
/admin/auth
/admin/dashboard
/admin/products
/admin/skus
/admin/orders
/admin/aftersales
/admin/users
/admin/coupons
/admin/promotions
/admin/content
/admin/suppliers
/admin/purchases
/admin/receipts
/admin/warehouses
/admin/inventory
/admin/stocktakes
/admin/losses
/admin/processing
/admin/trace-codes
/admin/enterprise
/admin/finance
/admin/reports
/admin/staff
/admin/roles
/admin/audit-logs
```

---

## 5. 幂等

以下接口必须支持幂等：

- 下单；
- 支付回调；
- 退款回调；
- 发货同步；
- 库存调整；
- 采购收货；
- 完工入库。

方法：
- `Idempotency-Key`；
- 唯一业务单号；
- 数据库唯一索引；
- 状态检查。

---

## 6. 分页

统一：

```text
page=1
pageSize=20
```

后台大数据量列表后期可改 cursor。

---

## 7. 错误码分域

- 10xxx：认证；
- 20xxx：用户；
- 30xxx：商品；
- 40xxx：订单；
- 41xxx：库存；
- 42xxx：支付；
- 43xxx：售后；
- 50xxx：营销；
- 60xxx：供应链；
- 70xxx：权限；
- 90xxx：系统。

---

## 8. API 安全

- 参数 schema 校验；
- SQL 注入由 ORM + 参数化控制；
- XSS 输出编码；
- 限流；
- IP/账号风控；
- 管理接口拒绝前端传入任意角色；
- 导出接口单独授权；
- 上传文件检查 MIME、大小、后缀；
- 私有文件使用签名 URL。
