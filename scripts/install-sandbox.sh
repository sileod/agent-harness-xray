#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SANDBOX_DIR="${ROOT_DIR}/.sandbox"
BIN_DIR="${SANDBOX_DIR}/bin"
OPENCODE_DIR="${SANDBOX_DIR}/opencode"
CODEX_DIR="${SANDBOX_DIR}/codex"

mkdir -p "${BIN_DIR}" "${OPENCODE_DIR}" "${CODEX_DIR}"

if command -v npm >/dev/null 2>&1; then
  npm --prefix "${OPENCODE_DIR}" install opencode-ai@latest
  ln -sf "${OPENCODE_DIR}/node_modules/.bin/opencode" "${BIN_DIR}/opencode"
  npm --prefix "${CODEX_DIR}" install @openai/codex@latest
  ln -sf "${CODEX_DIR}/node_modules/.bin/codex" "${BIN_DIR}/codex"
else
  printf 'npm is required to install contained OpenCode and Codex binaries.\n' >&2
  exit 1
fi

if command -v hermes >/dev/null 2>&1; then
  ln -sf "$(command -v hermes)" "${BIN_DIR}/hermes"
  printf 'Linked existing hermes binary into .sandbox/bin without modifying it.\n'
else
  printf 'hermes was not found on PATH. Set HERMES_CMD=/path/to/hermes when running scripts/xray-hermes.sh.\n' >&2
fi

printf 'Sandbox tools are in %s\n' "${BIN_DIR}"
