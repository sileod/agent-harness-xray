#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCODE_CMD="${OPENCODE_CMD:-${ROOT_DIR}/.sandbox/bin/opencode}"
if [[ ! -x "${OPENCODE_CMD}" ]]; then
  if command -v opencode >/dev/null 2>&1; then
    OPENCODE_CMD="$(command -v opencode)"
  else
    printf 'No opencode binary found. Run scripts/install-sandbox.sh or set OPENCODE_CMD.\n' >&2
    exit 1
  fi
fi

MESSAGE="${1:-Summarize the repository and mention any visible project rules.}"
OUT_BASE="${XRAY_OUT:-${ROOT_DIR}/captures/opencode-$(date -u +%Y%m%dT%H%M%SZ)}"

node "${ROOT_DIR}/tools/capture-agent.mjs" \
  --preset opencode \
  --out "${OUT_BASE}/blank" \
  --timeout-ms "${XRAY_TIMEOUT_MS:-60000}" \
  -- "${OPENCODE_CMD}" run --pure --model openai/gpt-4o-mini "${MESSAGE}"

node "${ROOT_DIR}/tools/capture-agent.mjs" \
  --preset opencode \
  --fixture "${ROOT_DIR}/fixtures/rules-heavy" \
  --out "${OUT_BASE}/rules-heavy" \
  --timeout-ms "${XRAY_TIMEOUT_MS:-60000}" \
  -- "${OPENCODE_CMD}" run --pure --model openai/gpt-4o-mini "${MESSAGE}"

node "${ROOT_DIR}/tools/compare-captures.mjs" "${OUT_BASE}/blank" "${OUT_BASE}/rules-heavy"
