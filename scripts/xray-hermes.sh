#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_CMD="${HERMES_CMD:-${ROOT_DIR}/.sandbox/bin/hermes}"
if [[ ! -x "${HERMES_CMD}" ]]; then
  if command -v hermes >/dev/null 2>&1; then
    HERMES_CMD="$(command -v hermes)"
  else
    printf 'No hermes binary found. Run scripts/install-sandbox.sh or set HERMES_CMD.\n' >&2
    exit 1
  fi
fi

MESSAGE="${1:-Summarize the repository and mention any visible project rules.}"
OUT_BASE="${XRAY_OUT:-${ROOT_DIR}/captures/hermes-$(date -u +%Y%m%dT%H%M%SZ)}"

node "${ROOT_DIR}/tools/capture-agent.mjs" \
  --preset hermes \
  --out "${OUT_BASE}/blank" \
  --timeout-ms "${XRAY_TIMEOUT_MS:-60000}" \
  -- "${HERMES_CMD}" -z "${MESSAGE}" --ignore-user-config --provider custom --model gpt-4o-mini

node "${ROOT_DIR}/tools/capture-agent.mjs" \
  --preset hermes \
  --fixture "${ROOT_DIR}/fixtures/rules-heavy" \
  --out "${OUT_BASE}/rules-heavy" \
  --timeout-ms "${XRAY_TIMEOUT_MS:-60000}" \
  -- "${HERMES_CMD}" -z "${MESSAGE}" --ignore-user-config --provider custom --model gpt-4o-mini

node "${ROOT_DIR}/tools/compare-captures.mjs" "${OUT_BASE}/blank" "${OUT_BASE}/rules-heavy"
