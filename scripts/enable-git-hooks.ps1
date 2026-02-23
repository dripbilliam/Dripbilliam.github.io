# Enables repository-tracked hooks from .githooks/
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

git config core.hooksPath .githooks
Write-Host "Git hooks enabled: core.hooksPath=.githooks"
