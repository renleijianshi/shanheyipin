# Codex 最省 Token 工作流

1. 每次从 `tasks/Mxx_*.md` 开始。
2. 根目录 `AGENTS.md` 自动提供长期规则。
3. 不让 Codex重新总结项目。
4. 普通搜索交给 Luna explorer；普通实现用 Terra；高风险 Review 才用 Sol。
5. Review 先看 `git diff`，不要重新读全库。
6. 一个任务一个分支/一组小 commit。
7. 输出保持 `model_verbosity=low`。
8. 失败一次先定位；连续两次仍失败才提高推理强度。
9. 高风险关键词：订单、支付、库存、退款、批次、并发、migration、安全。
10. 默认不要同时启用多套重叠 Skills。

## 启动示例

简单：
```powershell
.\scripts\codex-luna.ps1 "给商品列表增加一个筛选按钮，严格按 AGENTS.md。"
```

普通：
```powershell
.\scripts\codex-terra.ps1 "执行 tasks/M07_商品分类.md。"
```

核心：
```powershell
.\scripts\codex-sol.ps1 "执行 tasks/M15_支付回调.md，只处理幂等与测试。"
```

自动关键词路由：
```powershell
.\scripts\codex-auto.ps1 "实现支付回调的重复通知幂等测试"
```
