param(
  [Parameter(Mandatory=$true)]
  [string]$Task
)

$hard = @("支付","退款","库存","超卖","并发","订单状态","批次","迁移","权限","安全","事务","回调","payment","refund","inventory","concurrency","migration","security")
$simple = @("样式","按钮","文案","字段","表单","列表","CRUD","ui","css","copy","field","form","list")

$model = "gpt-5.6-terra"
$effort = "medium"

foreach ($k in $hard) {
  if ($Task -match [regex]::Escape($k)) {
    $model = "gpt-5.6-sol"
    $effort = "high"
    break
  }
}

if ($model -eq "gpt-5.6-terra") {
  foreach ($k in $simple) {
    if ($Task -match [regex]::Escape($k)) {
      $model = "gpt-5.6-luna"
      $effort = "low"
      break
    }
  }
}

Write-Host "Route -> $model / $effort"
codex exec -m $model --config "model_reasoning_effort=`"$effort`"" --config 'model_verbosity="low"' $Task
