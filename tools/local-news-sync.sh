#!/usr/bin/env bash
set -euo pipefail

# Local AIHOT-cadence news sync runner for xdlkc.github.io.
# Uses an isolated git worktree so background syncing NEVER disturbs your main working tree.
# Intended to be triggered every 15 minutes via macOS launchd; per-source intervals
# (60 / 120 / 180 min) are enforced via --due-state=/tmp/xdlkc-news-sync-state.json.

REPO_DIR="/Users/lkc/Code/xdlkc.github.io"
WORKTREE_DIR="/tmp/xdlkc-news-sync-worktree"
LOCK_DIR="/tmp/xdlkc-news-sync.lock"
STATE_FILE="/tmp/xdlkc-news-sync-state.json"
LOG_FILE="${REPO_DIR}/tmp/local-news-sync.log"

mkdir -p "${REPO_DIR}/tmp"

# Ensure Node 24+ & Homebrew bins are in PATH under launchd
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Another sync is already running; skipping." >> "${LOG_FILE}"
  exit 0
fi
trap 'rmdir "${LOCK_DIR}" 2>/dev/null || true' EXIT

# Load local .env if present (contains GLM_API_KEY / AIHOT_LLM_API_KEY; never committed)
if [ -f "${REPO_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_DIR}/.env"
  set +a
fi

# Fallback: read enabled GLM provider keyFile & baseURL directly from loom's providers.json (in-memory only)
if [ -z "${AIHOT_LLM_API_KEY:-}" ] && [ -z "${GLM_API_KEY:-}" ]; then
  LOOM_PROVIDERS="${HOME}/Library/Application Support/ModelHub/.local/providers.json"
  if [ -f "${LOOM_PROVIDERS}" ]; then
    LOOM_GLM_KEY="$(node -e "
      const fs = require('fs'), path = require('path');
      const p = process.argv[1];
      const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const [id, v] of Object.entries(cfg.providers || {})) {
        if (v && v.enabled !== false && /glm|bigmodel/i.test(id + ' ' + (v.prefix || '') + ' ' + (v.baseURL || '')) && v.keyFile) {
          const kf = path.isAbsolute(v.keyFile) ? v.keyFile : path.join(path.dirname(p), v.keyFile);
          if (fs.existsSync(kf)) {
            process.stdout.write(fs.readFileSync(kf, 'utf8').trim());
            process.exit(0);
          }
        }
      }
    " "${LOOM_PROVIDERS}" 2>/dev/null || true)"
    if [ -n "${LOOM_GLM_KEY}" ]; then
      export GLM_API_KEY="${LOOM_GLM_KEY}"
      unset LOOM_GLM_KEY
    fi
  fi
fi

{
  echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] Starting local AIHOT news sync ==="

  if [ -z "${AIHOT_LLM_API_KEY:-}" ] && [ -z "${GLM_API_KEY:-}" ] && [ -z "${ZHIPU_API_KEY:-}" ] && [ -z "${OPENAI_API_KEY:-}" ]; then
    echo "[local-news-sync] Missing GLM_API_KEY / AIHOT_LLM_API_KEY in ${REPO_DIR}/.env; skipping."
    exit 0
  fi

  git -C "${REPO_DIR}" fetch origin master --quiet

  if [ ! -d "${WORKTREE_DIR}/.git" ] && [ ! -f "${WORKTREE_DIR}/.git" ]; then
    git -C "${REPO_DIR}" worktree add --detach "${WORKTREE_DIR}" origin/master --quiet
  else
    git -C "${WORKTREE_DIR}" checkout --detach origin/master --quiet
    git -C "${WORKTREE_DIR}" reset --hard origin/master --quiet
  fi

  # Symlink node_modules from main repo so Readability/cheerio/linkedom work with zero reinstall
  if [ ! -e "${WORKTREE_DIR}/node_modules" ] && [ -d "${REPO_DIR}/node_modules" ]; then
    ln -s "${REPO_DIR}/node_modules" "${WORKTREE_DIR}/node_modules"
  fi

  cd "${WORKTREE_DIR}"
  node tools/aihot-sync.js \
    --due-state="${STATE_FILE}" \
    --hours=36 \
    --max-candidates=25 \
    --max-new=12

  if [ -n "$(git status --porcelain source/_data/news.json source/_data/news-hot.json)" ]; then
    git add source/_data/news.json source/_data/news-hot.json
    git commit -m "chore(news): local AIHOT news sync" --quiet
    git push origin HEAD:master --quiet
    echo "[local-news-sync] Pushed updated news to origin/master."
  else
    echo "[local-news-sync] No new curated news items to push."
  fi
} >> "${LOG_FILE}" 2>&1
