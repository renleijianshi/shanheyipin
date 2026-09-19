Write-Host "=== Codex / Skills 环境检查 ==="
$commands = "node","npm","npx","codex","git"
foreach ($c in $commands) {
  if (Get-Command $c -ErrorAction SilentlyContinue) {
    Write-Host "[OK] $c"
  } else {
    Write-Host "[MISSING] $c"
  }
}
Write-Host ""
npx -y skills list -g
