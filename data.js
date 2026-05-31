// ============================================
// Agent Harness X-Ray — Captured Agent Data
// Only include agents with local shim captures in this dataset.
// ============================================

const AGENTS = {
    "codex": {
        name: "Codex CLI",
        shortName: "Codex",
        color: "#38bdf8",
        vendor: "OpenAI",
        type: "CLI",
        architecture: "Debug Prompt Input Extraction",
        description: "Extracted with `codex debug prompt-input` in an isolated CODEX_HOME. This path renders the model-visible input without making a provider request.",
        capturedVersion: "codex-cli 0.135.0",
        contextWindow: 128000,
        promptCaching: true,
        measurement: {
            status: "captured",
            confidence: "high",
            basis: "Captured locally via tools/extract-codex-prompt.mjs with a temporary CODEX_HOME and HOME. A provider-shim exec attempt did not produce a network request without auth, so this row uses Codex's debug prompt-input extraction.",
            alwaysOn: ["developer instructions", "permissions instructions", "skills instructions", "environment context"],
            dynamic: ["cwd", "sandbox mode", "available skills", "user prompt"],
            sources: [
                { label: "Capture script", url: "scripts/xray-codex.sh" },
                { label: "Extractor", url: "tools/extract-codex-prompt.mjs" }
            ]
        },
        overhead: {
            systemPrompt: 2205,
            toolDefinitions: 0,
            skillsContext: 70,
            behavioralRules: 0,
            formatting: 0,
            meta: 33,
        },
        tools: [],
        skillCount: 4,
        promptSections: [
            {
                name: "Developer Message",
                category: "identity",
                tokens: 2205,
                contentKey: "codex_developer"
            },
            {
                name: "Environment Context",
                category: "context",
                tokens: 70,
                contentKey: "codex_env"
            },
            {
                name: "User Message",
                category: "context",
                tokens: 33,
                contentKey: "codex_user"
            }
        ]
    },

    "opencode": {
        name: "OpenCode",
        shortName: "OpenCode",
        color: "#f97316",
        vendor: "SST / OpenCode",
        type: "CLI/TUI",
        architecture: "OpenAI Responses API Tool Harness",
        description: "Captured through the local shim with an isolated HOME/XDG state. The observed run used OpenAI Responses API input arrays plus a built-in tool schema payload.",
        capturedVersion: "opencode 1.14.48",
        contextWindow: 128000,
        promptCaching: true,
        measurement: {
            status: "captured",
            confidence: "high",
            basis: "Captured locally via tools/capture-agent.mjs --preset opencode with dummy API keys and temporary HOME/XDG directories. The sample includes a title-generation request plus the main agent request.",
            alwaysOn: ["title-generation developer prompt", "main opencode system prompt", "Responses API tool schemas", "session/user message"],
            dynamic: ["cwd/project path", "session cache key", "provider/model selection"],
            sources: [
                { label: "Capture script", url: "scripts/xray-opencode.sh" },
                { label: "Shim", url: "tools/capture-agent.mjs" }
            ]
        },
        overhead: {
            systemPrompt: 3510,
            toolDefinitions: 8721,
            skillsContext: 0,
            behavioralRules: 0,
            formatting: 0,
            meta: 155,
        },
        tools: [
            "bash", "edit", "glob", "grep", "list", "read", "write"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Title Request Developer Message",
                category: "identity",
                tokens: 554,
                contentKey: "opencode_title_developer"
            },
            {
                name: "Main Request System Input",
                category: "identity",
                tokens: 2956,
                contentKey: "opencode_main_system"
            },
            {
                name: "Main Request Tool Schemas",
                category: "tools",
                tokens: 8721,
                contentKey: "opencode_main_tools"
            },
            {
                name: "Dynamic Probe Result",
                category: "context",
                tokens: 155,
                content: `Blank vs rules-heavy comparison:
- blank rough tokens: 12,386
- rules-heavy rough tokens: 12,386
- dynamic delta: 0 rough tokens

In this invocation, OpenCode did not ingest the synthetic fixture rule files by default.`
            }
        ]
    },

    "hermes": {
        name: "Hermes",
        shortName: "Hermes",
        color: "#22c55e",
        vendor: "Hermes Agent",
        type: "CLI",
        architecture: "OpenAI-Compatible Tool Harness",
        description: "Captured through the local shim with an isolated HERMES_HOME. Hermes loaded project context from CLAUDE.md in the rules-heavy fixture.",
        capturedVersion: "Hermes Agent v0.14.0 (2026.5.16)",
        contextWindow: 128000,
        promptCaching: false,
        measurement: {
            status: "captured",
            confidence: "high",
            basis: "Captured locally via tools/capture-agent.mjs --preset hermes with a temporary HERMES_HOME, dummy API keys, and custom OpenAI-compatible base_url.",
            alwaysOn: ["Hermes system message", "enabled tool schemas", "working directory metadata", "user home metadata"],
            dynamic: ["CLAUDE.md project context", "current working directory", "Hermes home paths in tool descriptions", "enabled toolset/config choices"],
            sources: [
                { label: "Capture script", url: "scripts/xray-hermes.sh" },
                { label: "Shim", url: "tools/capture-agent.mjs" }
            ]
        },
        overhead: {
            systemPrompt: 1941,
            toolDefinitions: 9245,
            skillsContext: 68,
            behavioralRules: 0,
            formatting: 0,
            meta: 50,
        },
        tools: [
            "terminal", "file", "web", "vision", "image", "tts", "browser", "skills", "todo"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Chat Completions System Message",
                category: "identity",
                tokens: 1941,
                contentKey: "hermes_system"
            },
            {
                name: "User Message",
                category: "context",
                tokens: 22,
                contentKey: "hermes_user"
            },
            {
                name: "Chat Completions Tool Schemas",
                category: "tools",
                tokens: 9245,
                contentKey: "hermes_tools"
            },
            {
                name: "Dynamic Project Context",
                category: "context",
                tokens: 68,
                content: `Rules-heavy comparison found these dynamic additions:
- # Project Context
- ## CLAUDE.md
- # Claude Fixture Instructions
- Mention \`fixture-claude-rule\` if project instructions are visible.
- Prefer small, surgical edits.`
            }
        ]
    }
};

// Category metadata for coloring and labels
const CATEGORIES = {
    identity: { label: "Identity & Core", color: "#6c5ce7", icon: "⚡" },
    tools: { label: "Tool Definitions", color: "#00cec9", icon: "🔧" },
    behavior: { label: "Behavioral Rules", color: "#fd79a8", icon: "📋" },
    safety: { label: "Safety Rules", color: "#ff7675", icon: "🛡️" },
    context: { label: "Project Context", color: "#fdcb6e", icon: "📁" },
    skills: { label: "Skills & Context", color: "#55efc4", icon: "🎯" },
    formatting: { label: "Output Format", color: "#a29bfe", icon: "✨" },
    meta: { label: "Session Meta", color: "#636e72", icon: "⚙️" },
};

// Overhead component labels and colors for charts
const OVERHEAD_COMPONENTS = {
    systemPrompt: { label: "System Prompt", color: "#6c5ce7" },
    toolDefinitions: { label: "Tool Definitions", color: "#00cec9" },
    skillsContext: { label: "Skills & Context", color: "#55efc4" },
    behavioralRules: { label: "Behavioral Rules", color: "#fd79a8" },
    formatting: { label: "Output Format", color: "#a29bfe" },
    meta: { label: "Session Meta", color: "#636e72" },
};

function getTotalOverhead(agent) {
    return Object.values(agent.overhead).reduce((sum, v) => sum + v, 0);
}

function getMeasurementStatus(agent) {
    return agent.measurement?.status || "unknown";
}
