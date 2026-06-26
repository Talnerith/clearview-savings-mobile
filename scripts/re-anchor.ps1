# Print everything a fresh Claude Code session needs to re-anchor on this
# project, in reading order. Windows-native companion to re-anchor.sh.
#
# Usage:
#   pwsh scripts/re-anchor.ps1        # auto-detect newest milestone
#   pwsh scripts/re-anchor.ps1 2      # force milestone 2
#
# Tip: pipe to the clipboard with  pwsh scripts/re-anchor.ps1 | Set-Clipboard

param([int]$Milestone = 0)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Get-NewestMilestone {
  $highest = 0
  Get-ChildItem -Path "docs/specs", "docs/milestones" -Filter "M*.md" -ErrorAction SilentlyContinue |
    ForEach-Object {
      if ($_.Name -match '^M(\d+)') {
        $n = [int]$Matches[1]
        if ($n -gt $highest) { $highest = $n }
      }
    }
  return $highest
}

if ($Milestone -le 0) { $Milestone = Get-NewestMilestone }
if ($Milestone -le 0) {
  Write-Error "No milestone docs found in docs/specs/ or docs/milestones/"
  exit 1
}

$spec     = "docs/specs/M$Milestone.md"
$plan     = "docs/milestones/M$Milestone.md"
$progress = "docs/milestones/M$Milestone-progress.md"

function Show-Section {
  param([string]$Title, [string]$Path)
  Write-Output ""
  Write-Output "================================================================"
  Write-Output "== $Title"
  if ($Path) { Write-Output "== $Path" }
  Write-Output "================================================================"
  Write-Output ""
}

function Dump-File {
  param([string]$Path, [string]$Missing = "")
  if (Test-Path $Path) { Get-Content $Path -Raw }
  elseif ($Missing) { Write-Output $Missing }
  else { Write-Output "(missing: $Path)" }
}

Show-Section "CLAUDE.md (project rules)" "CLAUDE.md"
Dump-File "CLAUDE.md"

Show-Section "Milestone $Milestone spec (frozen pre-flight contract)" $spec
Dump-File $spec "(no spec for M$Milestone — not written yet, or predates the convention)"

Show-Section "Milestone $Milestone plan (implementation)" $plan
Dump-File $plan

Show-Section "Milestone $Milestone progress (current handoff)" $progress
Dump-File $progress "(no progress doc for M$Milestone — either not started or already complete)"

Show-Section "Durable memory index" "memory/MEMORY.md"
Dump-File "memory/MEMORY.md"

Show-Section "Last 10 commits" ""
if (Test-Path ".git") {
  git log -n 10 --pretty=format:'%h  %ad  %s' --date=short
  Write-Output ""
} else { Write-Output "(not a git repo)" }

Show-Section "Git branch + status" ""
if (Test-Path ".git") {
  Write-Output ("Branch: " + (git rev-parse --abbrev-ref HEAD))
  Write-Output ""
  git status --short --branch
} else { Write-Output "(not a git repo)" }
