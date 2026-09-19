# GitHub 参考项目与借鉴说明

> 原则：借鉴功能模型、业务流程和架构思想，不默认复制代码。真正使用开源代码前必须再次核对许可证及依赖许可证。

## 1. Mall4j

仓库：
- https://github.com/gz-yami/mall4j
- https://github.com/gz-yami/mall4m

值得借鉴：
- B2C 单商户商城边界；
- 商品/SKU；
- 购物车；
- 下单；
- 支付；
- 会员；
- 运费；
- 后台；
- Redis/分布式锁思想；
- 微信小程序端结构。

注意：
- 开源主仓库标明 AGPLv3；
- 如以后闭源商用直接基于代码二次开发，必须先确认授权义务。

---

## 2. litemall

参考：
- https://github.com/linkgeek/litemall

值得借鉴：
- 小商城完整页面闭环；
- 专题；
- 分类；
- 商品；
- 优惠券；
- 团购；
- 评价；
- 收藏；
- 足迹；
- 售后；
- 管理后台模块划分。

适合拿来做“功能查漏清单”。

---

## 3. CRMEB

组织：
- https://github.com/crmeb

值得借鉴：
- 微信商城运营玩法；
- 优惠券；
- 积分；
- 秒杀；
- 分销；
- 用户运营；
- 营销页面。

山禾颐品第一期不需要全部照搬营销玩法。

---

## 4. ShopXO

参考：
- https://github.com/gongfuxiang/shopxo

值得借鉴：
- 多端商城；
- 多仓库；
- 供应商；
- 进销存；
- 采购入库/退货；
- 仓位；
- 盘点；
- 调拨；
- 组合商品；
- 多单位；
- 订单与进销存联动。

ShopXO 仓库说明其采用 MIT 许可，但真正复用代码前仍需以仓库 LICENSE 和实际依赖为准。

---

## 5. Inventoros

参考：
- https://github.com/Inventoros/Inventoros

值得借鉴：
- SKU；
- 变体；
- 仓位；
- 条码；
- 批次；
- 有效期；
- 序列号；
- kit/组合；
- assembly/work order；
- 组件消耗→成品产出。

其中“assembly/work order”思路非常适合山禾颐品的：
`散装柿饼 + 包材 → 礼盒成品`

---

## 6. RuoYi-Vue-Plus

参考：
- https://github.com/dromara/RuoYi-Vue-Plus

值得借鉴：
- RBAC；
- 多级权限；
- 数据权限；
- 日志；
- 任务调度；
- Redis；
- 对象存储；
- 中后台模块化设计。

本项目不建议为了“像若依”而照搬整个 Java 技术栈，仅借鉴后台治理能力。

---

## 7. ECShopX

参考：
- https://github.com/ShopeX/ECShopX

值得借鉴：
- B2C/B2B2C/S2B2C 思路；
- 商品、订单、会员、营销；
- 企业多角色；
- Open API；
- ERP/WMS 对接边界；
- 企业采购和多场景交易的扩展思路。

---

## 8. 本项目最终取舍

山禾颐品 v1 不复制一个“大而全商城”，而采用：

```text
Mall4j        → 核心交易主链路
litemall      → 用户端功能查漏
CRMEB         → 营销
ShopXO        → 进销存/供应链
Inventoros    → 批次/条码/包装加工
RuoYi Plus    → 后台权限/日志/任务
ECShopX       → 企业化扩展边界
```

最终实现保持为独立的山禾颐品业务模型。
