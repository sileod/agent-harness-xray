#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function usage() {
    console.error(`Usage:
  node tools/capture-agent.mjs [options] -- <agent command> [args...]

Options:
  --fixture <dir>       Run the agent in this project directory.
  --out <dir>           Capture directory. Default: ./captures/<timestamp>
  --port <port>         Local capture server port. Default: random free port.
  --timeout-ms <ms>     Kill the agent after this timeout. Default: 60000.
  --preset <name>       Agent preset: generic, opencode, or hermes.
  --allow-real-home     Let the agent see your real HOME/XDG config.

Examples:
  node tools/capture-agent.mjs -- claude "print your active context summary"
  node tools/capture-agent.mjs --fixture fixtures/rules-heavy -- cursor-agent "inspect this repo"
`);
}

function parseArgs(argv) {
    const opts = {
        fixture: null,
        out: null,
        port: 0,
        timeoutMs: 60_000,
        preset: "generic",
        allowRealHome: false,
        command: [],
    };
    const sep = argv.indexOf("--");
    if (sep === -1) {
        usage();
        process.exit(2);
    }
    const flags = argv.slice(0, sep);
    opts.command = argv.slice(sep + 1);
    for (let i = 0; i < flags.length; i++) {
        const flag = flags[i];
        if (flag === "--fixture") opts.fixture = resolve(flags[++i]);
        else if (flag === "--out") opts.out = resolve(flags[++i]);
        else if (flag === "--port") opts.port = Number(flags[++i]);
        else if (flag === "--timeout-ms") opts.timeoutMs = Number(flags[++i]);
        else if (flag === "--preset") opts.preset = String(flags[++i] || "generic");
        else if (flag === "--allow-real-home") opts.allowRealHome = true;
        else {
            console.error(`Unknown option: ${flag}`);
            usage();
            process.exit(2);
        }
    }
    if (opts.command.length === 0) {
        usage();
        process.exit(2);
    }
    return opts;
}

function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

function redactHeaders(headers) {
    const redacted = { ...headers };
    for (const key of Object.keys(redacted)) {
        if (/authorization|api-key|x-api-key|cookie/i.test(key)) {
            redacted[key] = "[redacted]";
        }
    }
    return redacted;
}

function readBody(req) {
    return new Promise((resolveBody) => {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    });
}

function mockResponse(req, body) {
    if (req.url.includes("/messages")) {
        return {
            id: "msg_capture_dummy",
            type: "message",
            role: "assistant",
            model: "capture-dummy",
            content: [{ type: "text", text: "Captured request. This is a dummy local response." }],
            stop_reason: "end_turn",
            usage: { input_tokens: roughTokenCount(body), output_tokens: 12 },
        };
    }
    if (req.url.includes(":generateContent") || req.url.includes("/generateContent")) {
        return {
            candidates: [{ content: { role: "model", parts: [{ text: "Captured request. This is a dummy local response." }] } }],
            usageMetadata: { promptTokenCount: roughTokenCount(body), candidatesTokenCount: 12 },
        };
    }
    return {
        id: "chatcmpl_capture_dummy",
        object: "chat.completion",
        model: "capture-dummy",
        choices: [{ index: 0, message: { role: "assistant", content: "Captured request. This is a dummy local response." }, finish_reason: "stop" }],
        usage: { prompt_tokens: roughTokenCount(body), completion_tokens: 12, total_tokens: roughTokenCount(body) + 12 },
    };
}

function roughTokenCount(text) {
    return Math.ceil(String(text || "").length / 4);
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    const captureDir = opts.out || resolve("captures", timestamp());
    mkdirSync(captureDir, { recursive: true });

    const requestLog = createWriteStream(join(captureDir, "requests.jsonl"), { flags: "a" });
    const requests = [];

    const server = createServer(async (req, res) => {
        const body = await readBody(req);
        const record = {
            at: new Date().toISOString(),
            method: req.method,
            url: req.url,
            headers: redactHeaders(req.headers),
            rough_tokens: roughTokenCount(body),
            body: safeJson(body),
        };
        record.extracted = extractRequestParts(record.body);
        requests.push(record);
        requestLog.write(`${JSON.stringify(record)}\n`);
        const responseBody = JSON.stringify(mockResponse(req, body));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(responseBody);
    });

    await new Promise(resolveServer => server.listen(opts.port, "127.0.0.1", resolveServer));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const tempRoot = mkdtempSync(join(tmpdir(), "agent-xray-"));
    const isolatedHome = join(tempRoot, "home");
    const xdgConfig = join(tempRoot, "xdg-config");
    const xdgCache = join(tempRoot, "xdg-cache");
    const xdgData = join(tempRoot, "xdg-data");
    const codexHome = join(tempRoot, "codex-home");
    const claudeConfig = join(tempRoot, "claude-config");
    const hermesHome = join(tempRoot, "hermes-home");
    const opencodeHome = join(tempRoot, "opencode-home");
    const fixtureDir = opts.fixture || join(tempRoot, "fixture");
    for (const dir of [isolatedHome, xdgConfig, xdgCache, xdgData, codexHome, claudeConfig, hermesHome, opencodeHome, fixtureDir]) {
        mkdirSync(dir, { recursive: true });
    }
    if (!opts.fixture) {
        writeFileSync(join(fixtureDir, "README.md"), "# Agent X-Ray blank fixture\n\nNo project rules are present.\n");
    }

    const env = {
        ...process.env,
        OPENAI_API_KEY: "agent-xray-dummy-openai-key",
        ANTHROPIC_API_KEY: "agent-xray-dummy-anthropic-key",
        GOOGLE_API_KEY: "agent-xray-dummy-google-key",
        GEMINI_API_KEY: "agent-xray-dummy-gemini-key",
        OPENAI_BASE_URL: `${baseUrl}/v1`,
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_API_URL: baseUrl,
        GOOGLE_GENERATIVE_AI_BASE_URL: baseUrl,
        GEMINI_API_BASE_URL: baseUrl,
        NO_PROXY: "127.0.0.1,localhost",
        no_proxy: "127.0.0.1,localhost",
    };
    if (opts.preset === "hermes") {
        env.HERMES_INFERENCE_PROVIDER = "custom";
        env.HERMES_INFERENCE_MODEL = "gpt-4o-mini";
    }
    if (!opts.allowRealHome) {
        env.HOME = isolatedHome;
        env.XDG_CONFIG_HOME = xdgConfig;
        env.XDG_CACHE_HOME = xdgCache;
        env.XDG_DATA_HOME = xdgData;
        env.CODEX_HOME = codexHome;
        env.CLAUDE_CONFIG_DIR = claudeConfig;
        env.HERMES_HOME = hermesHome;
        env.OPENCODE_HOME = opencodeHome;
        env.OPENCODE_CONFIG_DIR = opencodeHome;
    }

    if (!opts.allowRealHome && opts.preset === "hermes") {
        writeFileSync(join(hermesHome, ".env"), [
            "OPENAI_API_KEY=agent-xray-dummy-openai-key",
            "OPENROUTER_API_KEY=agent-xray-dummy-openrouter-key",
            "",
        ].join("\n"));
        writeFileSync(join(hermesHome, "config.yaml"), [
            "model:",
            "  default: \"gpt-4o-mini\"",
            "  provider: \"custom\"",
            `  base_url: "${baseUrl}/v1"`,
            "  api_key: \"agent-xray-dummy-openai-key\"",
            "tools:",
            "  enabled: []",
            "",
        ].join("\n"));
    }

    if (!opts.allowRealHome && opts.preset === "opencode") {
        mkdirSync(join(xdgConfig, "opencode"), { recursive: true });
        writeFileSync(join(xdgConfig, "opencode", "opencode.json"), JSON.stringify({
            provider: {
                openai: {
                    options: {
                        baseURL: `${baseUrl}/v1`,
                        apiKey: "agent-xray-dummy-openai-key",
                    },
                },
            },
        }, null, 2));
    }

    const [cmd, ...args] = opts.command;
    const stdout = createWriteStream(join(captureDir, "stdout.txt"));
    const stderr = createWriteStream(join(captureDir, "stderr.txt"));
    const startedAt = new Date().toISOString();
    const child = spawn(cmd, args, {
        cwd: fixtureDir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.pipe(stdout);
    child.stderr.pipe(stderr);

    const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, opts.timeoutMs);

    const exit = await new Promise(resolveExit => {
        child.on("error", error => resolveExit({ code: null, signal: null, error: error.message }));
        child.on("exit", (code, signal) => resolveExit({ code, signal, error: null }));
    });
    clearTimeout(timeout);
    await new Promise(resolveClose => requestLog.end(resolveClose));
    await new Promise(resolveClose => stdout.end(resolveClose));
    await new Promise(resolveClose => stderr.end(resolveClose));
    await new Promise(resolveClose => server.close(resolveClose));

    const summary = {
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        command: opts.command,
        fixture_dir: fixtureDir,
        capture_dir: captureDir,
        isolated_home: opts.allowRealHome ? false : isolatedHome,
        api_base_url: baseUrl,
        exit,
        request_count: requests.length,
        total_rough_prompt_tokens: requests.reduce((sum, req) => sum + req.rough_tokens, 0),
        extracted_counts: summarizeExtractions(requests),
        notes: [
            "Rough token count is chars/4. Re-tokenize captured bodies with the target model tokenizer for publication.",
            "If request_count is 0, the agent may not support base-url overrides, may require login, or may have exited before making a model request.",
            "Compare blank and rules-heavy fixtures to separate always-on baseline from dynamic project context.",
        ],
    };
    writeFileSync(join(captureDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
}

function safeJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function extractRequestParts(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { kind: "unknown", sections: [] };
    }
    const sections = [];
    if (body.system || (Array.isArray(body.messages) && body.max_tokens !== undefined)) {
        if (body.system) {
            sections.push({
                kind: "system",
                rough_tokens: roughTokenCount(JSON.stringify(body.system)),
                text_preview: preview(body.system),
            });
        }
        if (Array.isArray(body.messages)) {
            for (const [index, message] of body.messages.entries()) {
                sections.push({
                    kind: "message",
                    index,
                    role: message.role || "unknown",
                    rough_tokens: roughTokenCount(JSON.stringify(message)),
                    text_preview: preview(message.content),
                });
            }
        }
        if (Array.isArray(body.tools)) {
            sections.push({
                kind: "tools",
                count: body.tools.length,
                rough_tokens: roughTokenCount(JSON.stringify(body.tools)),
                text_preview: preview(body.tools),
            });
        }
        return { kind: "anthropic-messages", sections };
    }
    if (Array.isArray(body.input)) {
        for (const [index, item] of body.input.entries()) {
            sections.push({
                kind: "input",
                index,
                role: item.role || "unknown",
                rough_tokens: roughTokenCount(JSON.stringify(item)),
                text_preview: preview(item.content ?? item),
            });
        }
        if (Array.isArray(body.tools)) {
            sections.push({
                kind: "tools",
                count: body.tools.length,
                rough_tokens: roughTokenCount(JSON.stringify(body.tools)),
                text_preview: preview(body.tools),
            });
        }
        return { kind: "openai-responses", sections };
    }
    if (Array.isArray(body.messages)) {
        for (const [index, message] of body.messages.entries()) {
            sections.push({
                kind: "message",
                index,
                role: message.role || "unknown",
                rough_tokens: roughTokenCount(JSON.stringify(message)),
                text_preview: preview(message.content),
            });
        }
        if (Array.isArray(body.tools)) {
            sections.push({
                kind: "tools",
                count: body.tools.length,
                rough_tokens: roughTokenCount(JSON.stringify(body.tools)),
                text_preview: preview(body.tools),
            });
        }
        return { kind: "openai-chat", sections };
    }
    if (body.systemInstruction || Array.isArray(body.contents)) {
        if (body.systemInstruction) {
            sections.push({
                kind: "system",
                rough_tokens: roughTokenCount(JSON.stringify(body.systemInstruction)),
                text_preview: preview(body.systemInstruction),
            });
        }
        if (Array.isArray(body.contents)) {
            for (const [index, content] of body.contents.entries()) {
                sections.push({
                    kind: "content",
                    index,
                    role: content.role || "unknown",
                    rough_tokens: roughTokenCount(JSON.stringify(content)),
                    text_preview: preview(content),
                });
            }
        }
        if (body.tools) {
            sections.push({
                kind: "tools",
                rough_tokens: roughTokenCount(JSON.stringify(body.tools)),
                text_preview: preview(body.tools),
            });
        }
        return { kind: "gemini-generate-content", sections };
    }
    return { kind: "json", sections: [{ kind: "body", rough_tokens: roughTokenCount(JSON.stringify(body)), text_preview: preview(body) }] };
}

function preview(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.replace(/\s+/g, " ").slice(0, 500);
}

function summarizeExtractions(requests) {
    const summary = {};
    for (const request of requests) {
        const kind = request.extracted?.kind || "unknown";
        summary[kind] ||= { requests: 0, rough_tokens: 0, sections: {} };
        summary[kind].requests += 1;
        summary[kind].rough_tokens += request.rough_tokens || 0;
        for (const section of request.extracted?.sections || []) {
            const sectionKey = section.role ? `${section.kind}:${section.role}` : section.kind;
            summary[kind].sections[sectionKey] ||= { count: 0, rough_tokens: 0 };
            summary[kind].sections[sectionKey].count += 1;
            summary[kind].sections[sectionKey].rough_tokens += section.rough_tokens || 0;
        }
    }
    return summary;
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
