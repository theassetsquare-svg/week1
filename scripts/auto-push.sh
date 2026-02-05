#!/usr/bin/env bash
set -euo pipefail

# Simple polling auto-commit/push loop for this repo.
# Edit SLEEP_SECONDS if you want faster/slower checks.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLEEP_SECONDS=3
BRANCH="${AUTO_PUSH_BRANCH:-main}"
REMOTE="${AUTO_PUSH_REMOTE:-origin}"

cd "$REPO_DIR"

echo "[auto-push] Watching $REPO_DIR (every ${SLEEP_SECONDS}s)"

echo "[auto-push] Using ${REMOTE}/${BRANCH}"

echo "[auto-push] Press Ctrl+C to stop"

while true; do
  if ! git diff --quiet || ! git diff --cached --quiet; then
    ts="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    git add -A
    # Only commit if there is actually something staged.
    if ! git diff --cached --quiet; then
      git commit -m "Auto update ${ts}" >/dev/null
      git push "$REMOTE" "$BRANCH" >/dev/null
      echo "[auto-push] Pushed ${ts}"
    fi
  fi
  sleep "$SLEEP_SECONDS"
done
