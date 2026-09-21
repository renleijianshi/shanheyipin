# 山禾颐品小程序开发断点

## 1. 文档用途

本文件是山禾颐品小程序的**唯一开发断点**，也是新的 AI / Worker / Codex 的续开发入口。

默认启动流程：

1. 先读取本文件；
2. 执行 `git status`，再查看最近约 10 条 Git commit；
3. 仅根据当前任务读取相关模块、相关测试、必要的 Prisma schema 和接口；
4. 禁止默认全仓扫描；
5. 仅在本文件与代码明显冲突、Git commit 不一致、迁移/编译问题跨模块、数据库 schema 发生重大变化、发现架构级问题，或用户明确要求时，才扩大扫描范围。

目标：以最少 Token 获取足够上下文。

## 2. 当前 Git 基线

| 项目 | 当前事实 |
|---|---|
| 仓库 | `renleijianshi/shanheyipin` |
| origin | `https://github.com/renleijianshi/shanheyipin.git` |
| 当前分支 | `main` |
| 本地 HEAD（本文件提交前） | `ec74e1e521b597bbec9e16ea5f18f0672b3d5817` |
| HEAD 信息 | `docs: refresh interactive prototype status` |
| 最后已记录的 `origin/main` | `d8deb4af53b7c914e08d5e690bd5e635b77c8bc2` |
| 已记录同步差异 | 本地在本文件提交前领先 41 commits，未落后 |
| GitHub 刷新状态 | 2026-09-21 20:05 UTC 尝试 `git fetch origin main`，因当前执行环境缺少 GitHub HTTPS 凭据失败；远程是否有之后的新提交尚未在本环境重新确认。 |
| 文档生成时间 | 2026-09-21 20:05 UTC |

本文件提交后，应以最新 `HEAD` 为实际断点。GitHub 同步完成前，不能把本地领先状态误写为“已推送”。

## 3. 当前已完成模块

- M01 项目骨架
- M02 数据库基础
- M03 管理后台 RBAC
- M04 微信登录抽象
- M05 用户中心
- M06 用户地址
- M07 商品分类
- M08 SPU 商品
- M09 SKU 规格
- M10 商品列表、搜索与详情
- M11 购物车
- M12 结算预览
- M13 订单
- M14 支付抽象
- M15 支付回调抽象
- M16 发货物流
- M23 库存余额
- M24 库存流水
- M30 售后
- M31 退款抽象
- M32 补发

共 21 个已完成模块。

## 4. 当前已形成的业务能力

当前已支持的核心链路：

`商品 → 购物车 → 结算 → 订单 → Mock 支付 → 支付回调 → 发货物流 → 售后 → 退款 / 补发`

这代表核心领域层、持久化层和单元测试能力；不代表整个微信小程序已完整上线运行。完整 HTTP API 接入、端到端验收和部署上线仍未完成。

## 5. 库存系统当前能力

库存余额按批次维度维护以下数量：

| 字段 | 含义 |
|---|---|
| `physical` | 物理库存 |
| `available` | 可售库存 |
| `locked` | 锁定库存 |
| `outbound` | 待出库库存 |
| `frozen` | 冻结库存 |
| `defective` | 残次库存 |
| `returnInspection` | 退货待检库存 |

已具备：库存守恒、防止负库存、数据库行锁/并发保护、每次余额变化同事务生成库存流水、来源单据、前后数量快照、幂等保护、补发原子扣库存和补发成本记录。

## 6. 支付与外部能力状态

### 已实现

- Mock Payment
- Disabled Payment
- Mock Refund
- Disabled Refund
- Mock Shipment Sync
- Disabled Shipment Sync

### 暂停

- 真实微信支付
- 真实支付宝支付
- 真实退款渠道
- 微信真实发货同步

原因：现阶段先完成系统架构和业务闭环，待取得商户号与对应资质后再接真实渠道。后续 AI 不得擅自开始真实支付接入，除非用户明确要求。

## 7. 尚未完成模块

### M17–M22

供应商、采购、到货、质检、正式批次和仓库业务。数据库中可能已为库存和批次提前存在基础数据结构，但正式业务模块尚未完成。

### M25–M29

盘点、损耗、包装 BOM、包装任务、成品批次。

### M33–M36

优惠券、预售、会员、积分。

### M37–M39

内容、溯源、一盒一码。

### M40–M42

企业团购、报价、多地址配送。

### M43–M46

报表、安全总检查、全链路验收、部署上线。

## 8. 当前测试基线

| 项目 | 结果 |
|---|---|
| 测试文件 | 25（按 `apps/**/test/*.test.ts` 当前计数） |
| 历史最后一次已知结果 | 91 项测试通过；TypeScript 检查通过 |
| 本次完整验证 | 未完成：`npm run check` 在 lint 首步失败，原因是压缩包自带的 Windows `node_modules/.bin/eslint` 在本 Linux 环境无执行权限（`Permission denied`）。这不是测试断言失败。 |
| 本次验证时间 | 2026-09-21 20:05 UTC |

在原 Windows 项目环境或重新安装依赖后的兼容环境中，应运行：`npm run check`。失败前不得将本次结果写成“全部通过”。

## 9. 下一默认开发断点

若用户未改变开发顺序，默认下一模块是 **M17 供应商管理**。本次未开发 M17。

做 M17 时，优先只查看：

- Prisma schema 中供应商、采购、仓库、批次的必要位置；
- `supplier` / `purchasing` 相关模块；
- 与库存和批次连接的必要接口；
- 现有模块的编码模式；
- 相关测试。

不得为了做 M17 把所有 TypeScript 文件重新读取一遍。

## 10. 每次开发结束后的断点更新规则

每完成一个模块，必须更新本文件，至少记录：

- 当前 HEAD commit；
- 新完成模块；
- 新增数据库结构；
- 新增 API / Service / Repository；
- 新增测试和当前测试数量；
- 新风险或技术债；
- 下一开发模块；
- 是否已经 push GitHub。

随后 commit，再 push GitHub。目标是让 GitHub 代码与 `PROJECT_CHECKPOINT.md` 永远处于同一进度。

## 11. 当前同步待办

本文件已在本地建立，但当前执行环境没有 GitHub HTTPS 凭据，尚未推送。下次在已登录 GitHub 的电脑或已配置安全凭据的环境中，应先执行：

```bash
git fetch origin main
git rev-list --left-right --count origin/main...main
git push origin main
```

仅当结果显示本地未落后且正常 push 成功后，才将此处更新为“GitHub 已同步”。禁止 `git push --force`、重写历史或覆盖远程提交。
