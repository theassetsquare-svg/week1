#!/usr/bin/env bash
# seo-cron.sh — unattended SEO maintenance for 놀쿨 (week1-6m5.pages.dev).
# Pulls latest, runs the monitor, applies safe auto-fixes when needed, and
# pushes (Cloudflare Pages auto-deploys on push to main). Designed to run from
# cron or a scheduled agent. All output is appended to scripts/.secrets/seo-cron.log.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
LOG="scripts/.secrets/seo-cron.log"
mkdir -p scripts/.secrets
ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
{
  echo "==================== $(ts) seo-cron start ===================="
  git pull --rebase --autostash 2>&1 | tail -2

  # Ensure deps exist (remote/CI checkouts have no node_modules).
  if [ ! -d node_modules/astro ]; then
    echo "installing deps..."
    (npm ci 2>/dev/null || npm install) 2>&1 | tail -3
  fi

  # 1) Monitor. Exit 0 = healthy, 1 = action needed, 2 = fatal.
  node scripts/auto-seo.mjs
  STATUS=$?
  echo "monitor exit=$STATUS"

  # 1b) Stage 1-4 LIVE regression monitor (one-blob/risk/CSS404/dual-URL/nolcool-direct/dead-end + build gates).
  node scripts/autopilot-stages.mjs
  STAGE=$?
  echo "stage-monitor exit=$STAGE"
  [ "$STAGE" -eq 1 ] && STATUS=1

  if [ "$STATUS" -eq 1 ]; then
    echo "issues detected → running auto-fix"
    node scripts/auto-fix.mjs 2>&1 | tail -10
    node scripts/indexnow.mjs 2>&1 | tail -2 || echo "indexnow skipped"
    if ! git diff --quiet || ! git diff --cached --quiet; then
      git add -A
      git commit -m "auto: SEO maintenance $(ts)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" 2>&1 | tail -2
      git push 2>&1 | tail -3 && echo "pushed → Cloudflare Pages will deploy"
    else
      echo "no file changes to commit"
    fi
    # re-run monitor to confirm
    node scripts/auto-seo.mjs; echo "post-fix monitor exit=$?"
  else
    echo "healthy — also resubmitting sitemap + IndexNow to keep indexing fresh"
    node -e "import('./scripts/lib/gsc-client.mjs').then(async g=>{const k=g.loadKey();const t=await g.getAccessToken(k,'https://www.googleapis.com/auth/webmasters');await g.submitSitemap(t,'${GSC_SITE:-https://week1-6m5.pages.dev/}','${GSC_SITE:-https://week1-6m5.pages.dev/}sitemap.xml');console.log('sitemap resubmitted');}).catch(e=>console.error('sitemap:',e.message));"
    node scripts/indexnow.mjs 2>&1 | tail -2 || echo "indexnow skipped"
  fi
  echo "==================== $(ts) seo-cron end ===================="
  echo ""
} >> "$LOG" 2>&1
tail -1 "$LOG"
