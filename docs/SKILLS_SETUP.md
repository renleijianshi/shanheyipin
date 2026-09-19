# Skills 选择说明（低 Token 版）

## 默认安装

### 1. planning-with-files（中文）
用途：长任务计划、断点续作、进度落盘。  
安装：`scripts/install-core-skills.ps1`

### 2. addyosmani/agent-skills
用途：需求、任务拆分、增量实现、TDD、API、UI、Debug、Review、安全、发布。  
Codex 优先使用原生插件；失败时回退 `npx skills`。

### 3. db-skills
用途：数据库 schema 检查、安全 migration、慢 SQL、数据质量。

### 4. managing-skills
用途：后续查找、更新、移除 Skills。

## 默认不安装

### Superpowers
优秀，但与 `agent-skills` 在计划、TDD、Debug、Review 上重叠。低 Token 模式先避免双套流程。

### Project Memory
本项目已经用 `planning-with-files + docs/PROGRESS.md + docs/DECISIONS.md` 持久化状态。再增加逐会话 memory 容易制造重复上下文。

### npx-skill-install
如果以后同时用 Claude/Cursor/Codex，再运行 `scripts/install-optional-skills.ps1` 建共享 Skill hub；只用 Codex 时不必增加复杂度。

## 原则
Skills 越多不代表越好。只安装真正会触发、互不冲突的流程。
