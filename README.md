# Agent Harness X-Ray

Static visualization and capture tooling for comparing what coding-agent harnesses add to a model request: system instructions, tool schemas, project rules, retrieved context, and session metadata.

## What Changed Methodologically

The app distinguishes between:

- `source-auditable`: prompt construction can be inspected in open-source code.
- `captured`: request bodies were observed in a controlled sandbox run.
- `estimated`: proprietary or opaque behavior inferred from docs, visible behavior, package inspection, or community research.

Prompt text shown in the app is representative unless a source explicitly makes it auditable. Treat token counts as component-level estimates, not canonical vendor prompt dumps.

## Safe Capture Workflow

Use `tools/capture-agent.mjs` to run an agent in a temporary home directory with local dummy API endpoints:

```bash
node tools/capture-agent.mjs -- <agent-command> [args...]
```

By default the script:

- creates a temporary `HOME`
- creates temporary `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, and `XDG_DATA_HOME`
- injects dummy API keys
- points OpenAI-, Anthropic-, Gemini-, and Google-style base URL environment variables at a local HTTP server
- logs request bodies to `captures/<timestamp>/requests.jsonl`
- writes `summary.json`, `stdout.txt`, and `stderr.txt`
- extracts provider-visible `system`, `messages`, and `tools` sections into each `requests.jsonl` record

This is intended to avoid reading your real Claude/Codex/Hermes/OpenCode/Cursor/Windsurf config. Use `--allow-real-home` only when you explicitly want that.

## Contained OpenCode And Hermes Runs

Install sandbox-local wrappers without changing your existing installs:

```bash
scripts/install-sandbox.sh
```

This installs OpenCode under `.sandbox/opencode` and links an existing `hermes` binary into `.sandbox/bin` if one is already available. It does not edit your real `~/.opencode`, `~/.hermes`, `~/.config`, or shell profile.

Run reproducible blank-vs-rules captures:

```bash
scripts/xray-opencode.sh
scripts/xray-hermes.sh
```

Both scripts run two captures through the local shim:

- a blank synthetic project
- `fixtures/rules-heavy`, which contains `CLAUDE.md`, `.cursor/rules`, `.windsurf/rules`, and `.github/copilot-instructions.md`

The scripts then write `comparison-against-blank.json` into the rules-heavy capture directory. That comparison is the practical way to separate:

- always-on request payload
- project-dynamic injected rules
- run-to-run/session-dynamic noise

You can override binaries without touching global installs:

```bash
OPENCODE_CMD=/path/to/opencode scripts/xray-opencode.sh
HERMES_CMD=/path/to/hermes scripts/xray-hermes.sh
```

## Separating Always-On From Dynamic Context

Run the same agent twice:

```bash
node tools/capture-agent.mjs --out captures/blank -- <agent-command> "summarize the repo"
node tools/capture-agent.mjs --fixture fixtures/rules-heavy --out captures/rules-heavy -- <agent-command> "summarize the repo"
```

Then compare captured request bodies:

- content present in both runs is likely always-on harness context
- content present only in the second run is likely project-dynamic context
- content that changes across repeated runs is session-dynamic context

For publication-quality counts, re-tokenize captured bodies with the tokenizer matching the model actually used. The script's `rough_tokens` field is only `chars / 4`.

## What Counts As Ground Truth

The shim gives ground truth for the request body the agent attempted to send to the provider endpoint. That includes system/developer/user messages, tool schemas, and other JSON fields visible on the wire.

It is not automatically ground truth for the model's exact token count. Providers can transform requests server-side, and exact tokenization depends on the model family. Use captured payloads as the audit artifact, then tokenize them with the matching model tokenizer when available.

## Limitations

Some agents do not honor base URL environment variables, require interactive login, or use provider SDK paths this script cannot intercept. In those cases, the capture will show zero requests and the agent should remain labeled as `estimated` unless another auditable method is used.
