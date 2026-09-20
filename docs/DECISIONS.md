# DECISIONS

> 只记录会长期影响项目的技术/业务决策。

- D001：小程序使用 uni-app + Vue 3 + TypeScript。
- D002：管理后台使用 Vue 3 + TypeScript + Vite + Element Plus。
- D003：API 使用 NestJS + TypeScript + Prisma。
- D004：数据库使用 MySQL 8，Redis 用作缓存/锁，不作为订单或库存事实源。
- D005：第一阶段采用模块化单体，不主动拆微服务。
- D006：金额统一使用整数“分”。
- D007：商品必须区分 SPU / SKU / 库存批次。
- D008：库存采用余额 + 批次 + 流水。
- D009：支付回调必须验签、验金额、幂等。
- D010：预售第一阶段采用全款预售。
- D011：正式目录固定为 `C:\Users\19993\Desktop\山禾颐品\daima`，对应唯一 Private 仓库 `shanheyipin`。
- D012：真实微信支付与支付宝均 Deferred；先实现支付抽象、支付单、状态机、幂等和 Mock/Disabled Provider。
- D013：生产采用 Caddy + systemd + production build + 现有 MySQL + 轻量 Redis，媒体放 OSS；不得触碰旧 `/opt/shanhe-yipin`。
- D014：模块使用短分支和原子提交推进，核心模块合并前独立 Review。
- D015：小程序登录采用 7 天不透明随机会话令牌；数据库只存 SHA-256 哈希，微信 `openid` 不作为公开业务 ID。
- D016：商品分类采用稳定唯一代码与任意层级父子树；层级写入串行校验防循环，有子分类时禁止删除，禁用父分类隐藏整个公开子树。
- D017：SPU 以草稿为安全默认；媒体和标签作为 SPU 聚合事务更新，媒体仅存 `products/` 命名空间下的 OSS 对象键，不存外部 URL。
- D018：SKU 金额与重量分别使用整数分、整数克；规格按数据库校对规则做 Unicode 与大小写规范化、排序后生成 SHA-256 签名，并以 `(product_id, spec_signature)` 保证同一 SPU 内组合唯一。SKU 不允许跨 SPU 移动，M09 不承担库存事实。
- D019：消费者商品 API 使用 Product/SKU 的公开 UUID，不暴露数据库自增 ID；商品可见性同时受 SPU、SKU 与完整分类祖先链状态约束。
