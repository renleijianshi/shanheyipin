param([ValidateSet('setup','start','stop')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'ShanheYipin/internal-test'
$mysqlRoot = Join-Path $runtimeRoot 'mysql-8.4.11-winx64'
$mysql = Join-Path $mysqlRoot 'bin/mysql.exe'
$mysqld = Join-Path $mysqlRoot 'bin/mysqld.exe'
$config = Join-Path $runtimeRoot 'my.ini'
$envFile = Join-Path $projectRoot '.env.internal-test'
function New-InternalTestSecret {
  $bytes = New-Object byte[] 32
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $random.GetBytes($bytes) } finally { $random.Dispose() }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function Get-InternalTestEnvValue([string]$Name) {
  $line = Get-Content -LiteralPath $envFile | Where-Object { $_.StartsWith("$Name=") } | Select-Object -First 1
  if (!$line) { throw "Missing internal-test setting: $Name" }
  return $line.Substring($Name.Length + 1)
}
function Ensure-InternalTestViteEnv([string]$Path,[hashtable]$Required) {
  $exists = Test-Path -LiteralPath $Path
  $lines = if ($exists) { @(Get-Content -LiteralPath $Path) } else { @() }
  $changed = !$exists
  foreach ($key in $Required.Keys) {
    $matches = @($lines | Where-Object { $_.StartsWith("$key=") })
    if ($matches.Count -gt 1) { throw "Conflicting duplicate internal-test UI setting: $key" }
    if ($matches.Count -eq 1) {
      if ($matches[0].Substring($key.Length + 1) -cne [string]$Required[$key]) {
        throw "Refusing conflicting internal-test UI setting: $key"
      }
    } else {
      $lines += "$key=$($Required[$key])"
      $changed = $true
    }
  }
  if ($changed) { $lines | Set-Content -LiteralPath $Path -Encoding utf8NoBOM }
  $override = Join-Path (Split-Path $Path -Parent) '.env.development.local'
  if (Test-Path -LiteralPath $override) {
    foreach ($key in $Required.Keys) {
      $matches = @(Get-Content -LiteralPath $override | Where-Object { $_.StartsWith("$key=") })
      if ($matches.Count -gt 1 -or ($matches.Count -eq 1 -and $matches[0].Substring($key.Length + 1) -cne [string]$Required[$key])) {
        throw "Refusing conflicting internal-test UI override: $key"
      }
    }
  }
}
function Test-InternalTestWebPage([string]$Url,[string]$ExpectedTitle) {
  try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec 4 -UseBasicParsing
    return ([int]$response.StatusCode -eq 200 -and $response.Content.Contains($ExpectedTitle))
  } catch { return $false }
}
function Ensure-InternalTestWebServer([string]$Name,[int]$Port,[string]$ExpectedTitle,[string]$NpmArgs) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  $url = "http://127.0.0.1:$Port/"
  if ($listener) {
    if (!(Test-InternalTestWebPage -Url $url -ExpectedTitle $ExpectedTitle)) {
      throw "Port $Port is occupied by a different service; it was left untouched."
    }
    return
  }
  $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
  $quote = [char]34
  $command = "cd /d $quote$projectRoot$quote && $quote$npm$quote $NpmArgs"
  $log = Join-Path $runtimeRoot "$Name.log"
  $process = Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/s','/c',$command) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $log -RedirectStandardError (Join-Path $runtimeRoot "$Name-error.log")
  $process.Id | Set-Content (Join-Path $runtimeRoot "$Name.pid")
  for ($attempt=0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-InternalTestWebPage -Url $url -ExpectedTitle $ExpectedTitle) { return }
  }
  throw "$Name did not become ready on port $Port; inspect its local log."
}

New-Item -ItemType Directory -Force $runtimeRoot | Out-Null
if ($Action -eq 'stop') {
  foreach ($name in @('api','mysql')) {
    $pidFile = Join-Path $runtimeRoot "$name.pid"
    if (Test-Path $pidFile) {
      $processId = [int](Get-Content $pidFile)
      $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
      if ($processInfo -and ($processInfo.CommandLine -like "*$projectRoot*" -or $processInfo.CommandLine -like "*$runtimeRoot*")) {
        Stop-Process -Id $processId -ErrorAction SilentlyContinue
      }
    }
  }
  Write-Output 'Internal test processes stopped. Database and uploads preserved.'
  exit
}
if (!(Test-Path $mysqld)) {
  $archive = Join-Path $projectRoot '.cache/internal-test/mysql.zip'
  if (!(Test-Path $archive)) {
    New-Item -ItemType Directory -Force (Split-Path $archive -Parent) | Out-Null
    & curl.exe -f -L --retry 2 -o $archive 'https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.11-winx64.zip'
    if ($LASTEXITCODE -ne 0) { throw 'Official MySQL download failed' }
  }
  Expand-Archive -LiteralPath $archive -DestinationPath $runtimeRoot -Force
}
$accessFile = Join-Path $runtimeRoot 'access.txt'
$existingDatabase = Join-Path $runtimeRoot 'data/mysql'
if (!(Test-Path $envFile) -and (Test-Path $existingDatabase)) {
  throw 'Internal-test config is missing for an existing database; no data or credentials were overwritten.'
}
if (!(Test-Path $envFile)) {
  $dbPassword = New-InternalTestSecret
  $adminPassword = New-InternalTestSecret
  $mediaRoot = (Join-Path $runtimeRoot 'media').Replace('\','/')
  $databaseUrl = "mysql://shanhe_test:$dbPassword@127.0.0.1:3307/shanheyipin_internal_test"
  @("DATABASE_URL=$databaseUrl", 'INTERNAL_TEST_MODE=true', 'NODE_ENV=development', 'ADMIN_BOOTSTRAP_USERNAME=walker', "ADMIN_BOOTSTRAP_PASSWORD=$adminPassword", "MEDIA_STORAGE_DIR=$mediaRoot") | Set-Content -LiteralPath $envFile -Encoding utf8NoBOM
  @('[client]', 'host=127.0.0.1', 'port=3307', 'user=root', "password=$dbPassword") | Set-Content -LiteralPath (Join-Path $runtimeRoot 'client.ini') -Encoding utf8NoBOM
  @("内部测试后台账号：walker", "密码：$adminPassword", '仅用于本机隔离测试环境，不用于生产。') | Set-Content -LiteralPath $accessFile -Encoding utf8NoBOM
}
$databaseLine = Get-Content -LiteralPath $envFile | Where-Object { $_.StartsWith('DATABASE_URL=') } | Select-Object -First 1
if (!$databaseLine) { throw 'Internal-test DATABASE_URL is missing.' }
$databaseUri = [uri]($databaseLine.Substring('DATABASE_URL='.Length))
$userInfoParts = $databaseUri.UserInfo -split ':',2
if ($databaseUri.Scheme -ne 'mysql' -or $databaseUri.Host -ne '127.0.0.1' -or $databaseUri.Port -ne 3307 -or $databaseUri.AbsolutePath -ne '/shanheyipin_internal_test' -or $userInfoParts.Count -ne 2 -or $userInfoParts[0] -ne 'shanhe_test') {
  throw 'Refusing to migrate: DATABASE_URL must target the isolated local internal-test database on port 3307.'
}
if ((Get-InternalTestEnvValue 'INTERNAL_TEST_MODE') -ne 'true' -or (Get-InternalTestEnvValue 'NODE_ENV') -eq 'production') {
  throw 'Refusing to migrate outside internal-test development mode.'
}
  $dbPassword = New-InternalTestSecret
$mediaPath = [System.IO.Path]::GetFullPath((Get-InternalTestEnvValue 'MEDIA_STORAGE_DIR'))
$runtimePath = [System.IO.Path]::GetFullPath($runtimeRoot).TrimEnd('\') + '\'
if (!$mediaPath.StartsWith($runtimePath,[System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to use media outside the isolated internal-test runtime directory.'
}
if (!(Test-Path -LiteralPath $accessFile)) {
  @("内部测试后台账号：$(Get-InternalTestEnvValue 'ADMIN_BOOTSTRAP_USERNAME')", "密码：$(Get-InternalTestEnvValue 'ADMIN_BOOTSTRAP_PASSWORD')", '仅用于本机隔离测试环境，不用于生产。') | Set-Content -LiteralPath $accessFile -Encoding utf8
}
$dataDir = (Join-Path $runtimeRoot 'data').Replace('\','/')
@('[mysqld]', "basedir=$($mysqlRoot.Replace('\','/'))", "datadir=$dataDir", 'port=3307', 'bind-address=127.0.0.1', 'mysqlx=OFF', 'character-set-server=utf8mb4', 'collation-server=utf8mb4_unicode_ci', 'innodb-buffer-pool-size=128M', "pid-file=$($runtimeRoot.Replace('\','/'))/mysql.pid") | Set-Content $config -Encoding utf8NoBOM
if (!(Test-Path (Join-Path $runtimeRoot 'data/mysql'))) {
  & $mysqld "--defaults-file=$config" --initialize-insecure --console 2>&1 | Out-File (Join-Path $runtimeRoot 'initialize.log')
  if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed; see initialize.log' }
  $sqlPath = Join-Path $runtimeRoot 'bootstrap.sql'
  "ALTER USER 'root'@'localhost' IDENTIFIED BY '$dbPassword'; CREATE DATABASE IF NOT EXISTS shanheyipin_internal_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'shanhe_test'@'127.0.0.1' IDENTIFIED BY '$dbPassword'; GRANT ALL PRIVILEGES ON shanheyipin_internal_test.* TO 'shanhe_test'@'127.0.0.1';" | Set-Content $sqlPath -Encoding utf8NoBOM
}
$mysqlListener = Get-NetTCPConnection -State Listen -LocalPort 3307 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mysqlListener) {
  $mysqlProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($mysqlListener.OwningProcess)" -ErrorAction SilentlyContinue
  if (!$mysqlProcess -or $mysqlProcess.Name -ne 'mysqld.exe' -or $mysqlProcess.CommandLine -notlike "*$runtimeRoot*") {
    throw 'Port 3307 is occupied by a different process; it was left untouched.'
  }
}
if (!$mysqlListener) {
  $args = @("--defaults-file=`"$config`"")
  $sqlPath = Join-Path $runtimeRoot 'bootstrap.sql'
  if (Test-Path $sqlPath) { $args += "--init-file=`"$sqlPath`"" }
  Start-Process -FilePath $mysqld -ArgumentList $args -WindowStyle Hidden -RedirectStandardError (Join-Path $runtimeRoot 'mysql-error.log') | Out-Null
  for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    & $mysql "--defaults-extra-file=$(Join-Path $runtimeRoot 'client.ini')" -N -e 'SELECT 1' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
  }
  if ($LASTEXITCODE -ne 0) { throw 'Test MySQL did not become ready' }
  if (Test-Path $sqlPath) { Remove-Item -LiteralPath $sqlPath }
}
$apiListener = Get-NetTCPConnection -State Listen -LocalPort 3200 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($apiListener) {
  $apiProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($apiListener.OwningProcess)" -ErrorAction SilentlyContinue
  $apiCommand = [string]$apiProcess.CommandLine
  if (!$apiProcess -or $apiProcess.Name -ne 'node.exe' -or !$apiCommand.Contains('apps/api/dist/server.js') -or !$apiCommand.Contains('.env.internal-test')) {
    throw 'Port 3200 is occupied by a different process; it was left untouched.'
  }
}
& node --env-file=.env.internal-test node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { throw 'Test database migration failed' }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
& node --env-file=.env.internal-test apps/api/dist/seed-internal-test.js
if ($LASTEXITCODE -ne 0) { throw 'Test seed failed' }
$miniappEnv = Join-Path $projectRoot 'apps/miniapp/.env.local'
Ensure-InternalTestViteEnv -Path $miniappEnv -Required @{
  VITE_API_BASE_URL='/'
  VITE_MEDIA_BASE_URL='/media'
  VITE_INTERNAL_TEST='true'
  VITE_HOME_HERO_OBJECT_KEY='products/internal-test/orchard.png'
}
$adminEnv = Join-Path $projectRoot 'apps/admin/.env.local'
Ensure-InternalTestViteEnv -Path $adminEnv -Required @{ VITE_INTERNAL_TEST='true' }

if (!$apiListener) {
  $api = Start-Process -FilePath (Get-Command node).Source -ArgumentList @("--env-file=`"$envFile`"", "`"$projectRoot/apps/api/dist/server.js`"") -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeRoot 'api.log') -RedirectStandardError (Join-Path $runtimeRoot 'api-error.log')
  $api.Id | Set-Content (Join-Path $runtimeRoot 'api.pid')
}
$apiHealthy = $false
for ($attempt=0; $attempt -lt 30; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3200/health' -TimeoutSec 2
    if ($health.data.status -eq 'ok') { $apiHealthy = $true; break }
  } catch { Start-Sleep -Seconds 1 }
}
if (!$apiHealthy) { throw 'Internal-test API did not become ready on port 3200.' }
Ensure-InternalTestWebServer -Name 'admin' -Port 5174 -ExpectedTitle '山禾颐品 · 运营管理' -NpmArgs 'run dev --workspace @shanheyipin/admin'
Ensure-InternalTestWebServer -Name 'miniapp' -Port 5173 -ExpectedTitle '山禾颐品' -NpmArgs 'run dev:h5 --workspace @shanheyipin/miniapp -- --host 127.0.0.1 --port 5173 --strictPort'
Write-Output 'Internal test MySQL: 127.0.0.1:3307; API: 127.0.0.1:3200. Data is persistent.'
Write-Output "Local admin credentials: $runtimeRoot/access.txt"
