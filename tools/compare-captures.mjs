#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

if (process.argv.length !== 4) {
    console.error("Usage: node tools/compare-captures.mjs <blank-capture-dir> <dynamic-capture-dir>");
    process.exit(2);
}

const blankDir = resolve(process.argv[2]);
const dynamicDir = resolve(process.argv[3]);
const blank = loadCapture(blankDir);
const dynamic = loadCapture(dynamicDir);

const blankText = flattenRequests(blank.requests);
const dynamicText = flattenRequests(dynamic.requests);
const blankLines = stableLines(blankText);
const dynamicLines = stableLines(dynamicText);
const blankSet = new Set(blankLines);
const dynamicSet = new Set(dynamicLines);

const shared = dynamicLines.filter(line => blankSet.has(line));
const dynamicOnly = dynamicLines.filter(line => !blankSet.has(line));
const blankOnly = blankLines.filter(line => !dynamicSet.has(line));

const report = {
    blank_dir: blankDir,
    dynamic_dir: dynamicDir,
    blank_summary: blank.summary,
    dynamic_summary: dynamic.summary,
    shared_line_count: shared.length,
    dynamic_only_line_count: dynamicOnly.length,
    blank_only_line_count: blankOnly.length,
    interpretation: {
        shared: "Likely always-on harness/request structure, subject to run-to-run nondeterminism.",
        dynamic_only: "Likely project/session dynamic context injected because of the second fixture.",
        blank_only: "Likely nondeterministic or fixture-specific content from the blank run.",
    },
    dynamic_only_preview: dynamicOnly.slice(0, 80),
    blank_only_preview: blankOnly.slice(0, 40),
};

const out = join(dynamicDir, "comparison-against-blank.json");
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
    blank_requests: blank.requests.length,
    dynamic_requests: dynamic.requests.length,
    blank_rough_tokens: blank.summary.total_rough_prompt_tokens,
    dynamic_rough_tokens: dynamic.summary.total_rough_prompt_tokens,
    dynamic_minus_blank_rough_tokens: dynamic.summary.total_rough_prompt_tokens - blank.summary.total_rough_prompt_tokens,
    shared_line_count: shared.length,
    dynamic_only_line_count: dynamicOnly.length,
    report: out,
}, null, 2));

function loadCapture(dir) {
    const summary = JSON.parse(readFileSync(join(dir, "summary.json"), "utf8"));
    const jsonl = readFileSync(join(dir, "requests.jsonl"), "utf8").trim();
    const requests = jsonl ? jsonl.split("\n").map(line => JSON.parse(line)) : [];
    return { summary, requests };
}

function flattenRequests(requests) {
    const chunks = [];
    for (const request of requests) {
        chunks.push(`URL ${request.method || ""} ${request.url || ""}`);
        chunks.push(`REQUEST_KIND ${request.extracted?.kind || "unknown"}`);
        for (const section of request.extracted?.sections || []) {
            const label = section.role ? `${section.kind}:${section.role}` : section.kind;
            chunks.push(`SECTION ${label}`);
            chunks.push(section.text_preview || "");
        }
        chunks.push(JSON.stringify(request.body, null, 2));
    }
    return chunks.join("\n");
}

function stableLines(text) {
    return text
        .split(/\n|\\n/)
        .map(line => line.trim())
        .filter(line => line.length >= 8)
        .filter(line => !/^[{}[\],:"]+$/.test(line))
        .sort();
}
