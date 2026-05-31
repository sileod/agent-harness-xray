#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function usage() {
    console.error(`Usage:
  node tools/extract-codex-prompt.mjs [options]

Options:
  --fixture <dir>       Project directory to inspect.
  --out <dir>           Output directory. Default: ./captures/codex-debug/<timestamp>
  --codex <path>        Codex binary. Default: codex on PATH.
  --prompt <text>       Prompt appended to the model-visible input.
`);
}

function parseArgs(argv) {
    const opts = {
        fixture: null,
        out: null,
        codex: "codex",
        prompt: "Summarize the repository and mention visible project rules.",
    };
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (flag === "--fixture") opts.fixture = resolve(argv[++i]);
        else if (flag === "--out") opts.out = resolve(argv[++i]);
        else if (flag === "--codex") opts.codex = argv[++i];
        else if (flag === "--prompt") opts.prompt = argv[++i];
        else if (flag === "--help" || flag === "-h") {
            usage();
            process.exit(0);
        } else {
            console.error(`Unknown option: ${flag}`);
            usage();
            process.exit(2);
        }
    }
    return opts;
}

function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

function roughTokenCount(text) {
    return Math.ceil(String(text || "").length / 4);
}

function main() {
    const opts = parseArgs(process.argv.slice(2));
    const outDir = opts.out || resolve("captures", "codex-debug", timestamp());
    mkdirSync(outDir, { recursive: true });

    const tempRoot = mkdtempSync(join(tmpdir(), "agent-xray-codex-"));
    const codexHome = join(tempRoot, "codex-home");
    const home = join(tempRoot, "home");
    const xdgConfig = join(tempRoot, "xdg-config");
    const xdgCache = join(tempRoot, "xdg-cache");
    const xdgData = join(tempRoot, "xdg-data");
    const fixture = opts.fixture || join(tempRoot, "fixture");
    for (const dir of [codexHome, home, xdgConfig, xdgCache, xdgData, fixture]) {
        mkdirSync(dir, { recursive: true });
    }
    if (!opts.fixture) {
        writeFileSync(join(fixture, "README.md"), "# Agent X-Ray blank fixture\n\nNo project rules are present.\n");
    }

    const env = {
        ...process.env,
        CODEX_HOME: codexHome,
        HOME: home,
        XDG_CONFIG_HOME: xdgConfig,
        XDG_CACHE_HOME: xdgCache,
        XDG_DATA_HOME: xdgData,
    };
    const args = [
        "debug",
        "prompt-input",
        "--config",
        'model="gpt-5-codex"',
        opts.prompt,
    ];
    const result = spawnSync(opts.codex, args, {
        cwd: fixture,
        env,
        encoding: "utf8",
        timeout: 30_000,
    });
    writeFileSync(join(outDir, "stdout.json"), result.stdout || "");
    writeFileSync(join(outDir, "stderr.txt"), result.stderr || "");

    let input = null;
    try {
        input = JSON.parse(result.stdout);
    } catch {
        input = null;
    }
    const version = spawnSync(opts.codex, ["--version"], {
        encoding: "utf8",
        timeout: 5_000,
    });
    const sections = Array.isArray(input)
        ? input.map((item, index) => ({
            index,
            type: item.type,
            role: item.role,
            rough_tokens: roughTokenCount(JSON.stringify(item)),
        }))
        : [];
    const summary = {
        started_at: new Date().toISOString(),
        command: [opts.codex, ...args],
        agent_version: `${version.stdout || ""}${version.stderr || ""}`.trim(),
        fixture_dir: fixture,
        output_dir: outDir,
        isolated_home: home,
        codex_home: codexHome,
        exit: {
            code: result.status,
            signal: result.signal,
            error: result.error?.message || null,
        },
        input_items: Array.isArray(input) ? input.length : 0,
        total_rough_prompt_tokens: roughTokenCount(result.stdout || ""),
        sections,
        notes: [
            "Codex debug prompt-input renders model-visible prompt input without making a provider request.",
            "This is a CLI debug extraction, not a network shim capture.",
            "Rough token count is chars/4.",
        ],
    };
    const requestLikeRecord = {
        at: summary.started_at,
        method: "DEBUG",
        url: "codex debug prompt-input",
        headers: {},
        rough_tokens: summary.total_rough_prompt_tokens,
        body: input,
        extracted: {
            kind: "codex-debug-prompt-input",
            sections: sections.map(section => ({
                kind: "input",
                index: section.index,
                role: section.role || "unknown",
                rough_tokens: section.rough_tokens,
                text_preview: preview(input?.[section.index]),
            })),
        },
    };
    writeFileSync(join(outDir, "requests.jsonl"), `${JSON.stringify(requestLikeRecord)}\n`);
    writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
    process.exit(result.status || 0);
}

function preview(value) {
    return JSON.stringify(value || "").replace(/\s+/g, " ").slice(0, 500);
}

main();
