#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_CMD="${CODEX_CMD:-${ROOT_DIR}/.sandbox/bin/codex}"
if [[ ! -x "${CODEX_CMD}" ]]; then
  if command -v codex >/dev/null 2>&1; then
    CODEX_CMD="$(command -v codex)"
  else
    printf 'No codex binary found. Run scripts/install-sandbox.sh or set CODEX_CMD.\n' >&2
    exit 1
  fi
fi

MESSAGE="${1:-Summarize the repository and mention any visible project rules.}"
OUT_BASE="${XRAY_OUT:-${ROOT_DIR}/captures/codex-$(date -u +%Y%m%dT%H%M%SZ)}"

node "${ROOT_DIR}/tools/extract-codex-prompt.mjs" \
  --codex "${CODEX_CMD}" \
  --out "${OUT_BASE}/blank" \
  --prompt "${MESSAGE}"

node "${ROOT_DIR}/tools/extract-codex-prompt.mjs" \
  --codex "${CODEX_CMD}" \
  --fixture "${ROOT_DIR}/fixtures/rules-heavy" \
  --out "${OUT_BASE}/rules-heavy" \
  --prompt "${MESSAGE}"

node "${ROOT_DIR}/tools/compare-captures.mjs" "${OUT_BASE}/blank" "${OUT_BASE}/rules-heavy"
