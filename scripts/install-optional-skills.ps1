$ErrorActionPreference = "Stop"
Write-Host "=== 可选 Skills（默认不安装，避免重复上下文） ==="

# 多 Agent 共用 Skills hub；如果未来同时使用 Claude/Cursor/Codex 再装
npx -y skills add OpenGHz/npx-skill-install -s npx-skill-install -g -y

Write-Host "Superpowers 与 addyosmani/agent-skills 功能重叠较大。"
Write-Host "如确实需要，请在 Codex 的 /plugins 中搜索 Superpowers 后手工启用。"
Write-Host "Project Memory 默认不装；本项目用 planning-with-files + PROGRESS/DECISIONS 控制上下文更省 Token。"
