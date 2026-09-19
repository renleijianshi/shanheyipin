$ErrorActionPreference = "Stop"

Write-Host "=== 山禾颐品 Codex 核心 Skills 安装 ==="

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "未检测到 Node.js，请先安装 Node.js LTS。"
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  throw "未检测到 npx。"
}
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  Write-Warning "未检测到 codex CLI；npx Skills 仍可安装，但 Codex 插件步骤会跳过。"
}

# 1) 长任务/断点续作：中文版本
npx -y skills add OthmanAdi/planning-with-files --skill planning-with-files-zh -g -y

# 2) Skill 管理器
npx -y skills add mikekelly/managing-skills -g -y --all

# 3) 数据库 Skills
npm install -g db-skills
db-skills add --all -g -y --agent codex

# 4) 工程全生命周期 Agent Skills（Codex 原生插件优先）
if (Get-Command codex -ErrorAction SilentlyContinue) {
  try {
    codex plugin marketplace add addyosmani/agent-skills
    codex plugin add agent-skills@agent-skills
  } catch {
    Write-Warning "Codex 插件安装失败，回退到 npx skills。"
    npx -y skills add addyosmani/agent-skills -g -y
  }
} else {
  npx -y skills add addyosmani/agent-skills -g -y
}

Write-Host ""
Write-Host "=== 已完成核心安装 ==="
Write-Host "建议重新启动 Codex，然后运行：npx skills list -g"
