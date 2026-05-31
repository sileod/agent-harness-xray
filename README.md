# Agent Harness X-Ray

Agent Harness X-Ray captures the provider-visible request payloads produced by coding agents. It focuses on what a harness sends to a model endpoint: system/developer/user messages, tool schemas, project rules, retrieved context, and session metadata.

The project intentionally keeps the dataset small. Agents are included only when they have a local capture path or an auditable extraction path in this repository.

## What The Shim Captures

`tools/capture-agent.mjs` runs an agent command against local dummy API endpoints:

```bash
node tools/capture-agent.mjs -- <agent-command> [args...]
```

By default it:

- creates a temporary `HOME`
- creates temporary `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, and `XDG_DATA_HOME`
- creates isolated `CODEX_HOME`, `HERMES_HOME`, and `OPENCODE_HOME`
- injects dummy API keys
- points OpenAI-, Anthropic-, and Google-style base URL environment variables at a local HTTP server
- logs request bodies to `captures/<timestamp>/requests.jsonl`
- writes `summary.json`, `stdout.txt`, and `stderr.txt`
- extracts provider-visible `system`, `developer`, `user`, `messages`, `input`, and `tools` sections where the request format is recognized

Use `--allow-real-home` only when you explicitly want a run to see your real local agent configuration.

## Fresh Sandbox Runs

Install sandbox-local wrappers:

```bash
scripts/install-sandbox.sh
```

This installs fresh OpenCode and Codex packages under `.sandbox/` and links an existing `hermes` binary into `.sandbox/bin` if one is available. It does not edit your real `~/.opencode`, `~/.codex`, `~/.hermes`, `~/.config`, or shell profile.

Run reproducible blank-vs-rules captures:

```bash
scripts/xray-opencode.sh
scripts/xray-hermes.sh
scripts/xray-codex.sh
```

The scripts run two captures or prompt extractions:

- a blank synthetic project
- `fixtures/rules-heavy`, which contains `CLAUDE.md`, `.cursor/rules`, and `.github/copilot-instructions.md`

The scripts write `comparison-against-blank.json` into the rules-heavy capture directory.

You can override binaries without touching global installs:

```bash
OPENCODE_CMD=/path/to/opencode scripts/xray-opencode.sh
HERMES_CMD=/path/to/hermes scripts/xray-hermes.sh
CODEX_CMD=/path/to/codex scripts/xray-codex.sh
```

Codex uses `codex debug prompt-input`, which renders model-visible prompt input without making a provider request. OpenCode and Hermes use the local HTTP shim.

Raw captured prompts and request bodies are local-only outputs under `captures/`. The website embeds redacted examples so readers can inspect prompt shape without publishing machine-specific paths, enabled local configuration, credentials, or user identifiers.

## Reading Results

Use blank and rules-heavy captures to separate request components:

- present in both: likely always-on harness payload
- present only in the rules-heavy run: likely project-dynamic context
- different across repeated runs: likely session-dynamic context

The shim gives ground truth for the request body the agent attempted to send to the configured provider endpoint. It is not exact model tokenization. The `rough_tokens` field is `chars / 4`; re-tokenize captured payloads with the target model tokenizer for publication-quality counts.

## Limits

Some agents do not honor base URL environment variables, require interactive login, or use provider SDK paths this shim cannot intercept. Leave those agents out of the dataset until there is a reproducible capture or auditable extraction path.
