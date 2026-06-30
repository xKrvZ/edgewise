# Bootstraps the PostHog hobby stack under .docker/posthog/
# Usage (from repo root): powershell -ExecutionPolicy Bypass -File .docker/posthog/bootstrap.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$PostHogDir = Join-Path $RepoRoot '.docker\posthog'
$CloneDir = Join-Path $PostHogDir 'posthog'
$ShareDir = Join-Path $PostHogDir 'share'

Write-Host "PostHog bootstrap -> $PostHogDir"

if (-not (Test-Path $CloneDir)) {
  Write-Host 'Cloning PostHog (shallow, ~200 MB)...'
  git clone --filter=blob:none --depth 1 https://github.com/PostHog/posthog.git $CloneDir
} else {
  Write-Host 'PostHog clone already present, refreshing compose files only.'
}

Copy-Item (Join-Path $CloneDir 'docker-compose.base.yml') (Join-Path $PostHogDir 'docker-compose.base.yml') -Force
Copy-Item (Join-Path $CloneDir 'docker-compose.hobby.yml') (Join-Path $PostHogDir 'docker-compose.hobby.yml') -Force
Copy-Item (Join-Path $CloneDir '.env.services') (Join-Path $PostHogDir '.env.services') -Force

$MmdbPath = Join-Path $ShareDir 'GeoLite2-City.mmdb'
if (-not (Test-Path $MmdbPath)) {
  Write-Host 'Downloading GeoLite2-City.mmdb for PostHog...'
  New-Item -ItemType Directory -Force -Path $ShareDir | Out-Null
  $DownloadScript = @'
const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const target = process.argv[2];
https.get('https://mmdbcdn.posthog.net/', (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    fs.writeFileSync(target, zlib.brotliDecompressSync(Buffer.concat(chunks)));
  });
}).on('error', (err) => {
  console.error(err);
  process.exit(1);
});
'@
  $ScriptPath = Join-Path $env:TEMP 'posthog-download-geoip.cjs'
  Set-Content -Path $ScriptPath -Value $DownloadScript -Encoding UTF8
  node $ScriptPath $MmdbPath
  Remove-Item $ScriptPath -ErrorAction SilentlyContinue
  $DateJson = Join-Path $ShareDir 'GeoLite2-City.json'
  @{ date = (Get-Date -Format 'yyyy-MM-dd') } | ConvertTo-Json | Set-Content $DateJson
}

$EnvFile = Join-Path $PostHogDir '.env'
$EnvExample = Join-Path $PostHogDir '.env.example'
if (-not (Test-Path $EnvFile)) {
  Copy-Item $EnvExample $EnvFile
  Write-Host "Created $EnvFile from .env.example"
} else {
  Write-Host "Keeping existing $EnvFile"
}

# Shell scripts bind-mounted into Linux containers must use LF (CRLF breaks shebang exec on Windows).
$ComposeDir = Join-Path $PostHogDir 'compose'
if (Test-Path $ComposeDir) {
  Get-ChildItem -Path $ComposeDir -File | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName).Replace("`r`n", "`n").Replace("`r", "`n")
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($_.FullName, $content, $utf8NoBom)
  }
  Write-Host "Normalized LF line endings in $ComposeDir"
}

Write-Host ''
Write-Host 'Bootstrap complete. Next step:'
Write-Host '  docker compose -f .docker/posthog/docker-compose.hobby.yml -f docker-compose.posthog.yml --env-file .docker/posthog/.env up -d'
