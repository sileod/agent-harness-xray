// ============================================
// Agent Harness X-Ray — Curated Agent Data
// Normalized to the top 5 premium agent harnesses
// ============================================

const AGENTS = {
    "claude-code": {
        name: "Claude Code",
        shortName: "Claude Code",
        color: "#d4a574",
        vendor: "Anthropic",
        type: "CLI",
        architecture: "Dynamic Assembly & Caching",
        description: "Anthropic's official terminal-based agent utilizing layered, state-dependent prompt assembly and aggressive context caching.",
        contextWindow: 200000,
        promptCaching: true,
        overhead: {
            systemPrompt: 3100,
            toolDefinitions: 4500,
            skillsContext: 800,
            behavioralRules: 1200,
            formatting: 400,
            meta: 300,
        },
        tools: [
            "Read", "Write", "Edit", "MultiEdit", "Bash", 
            "Glob", "Grep", "Task (subagent)", "AskUserQuestion"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Core Identity & Constitution",
                category: "identity",
                tokens: 800,
                content: `You are Claude, an AI assistant made by Anthropic.
You are operating in Claude Code, an interactive CLI tool designed to help developers inspect, write, edit, and run code.
Always plan your approach step-by-step using internal chain-of-thought before invoking tools. Be concise, direct, and avoid pleasantries.`
            },
            {
                name: "Tool Schema Specifications",
                category: "tools",
                tokens: 4500,
                content: `[JSON Schema tool parameters with strict constraints]

Available Tools:
- Read: Retrieve content of specified files. Prefer precise line ranges to save token context.
- Write: Create new files. Refuses to overwrite existing files unless explicitly flagged.
- Edit: Apply a surgical text patch based on target string search-and-replace.
- MultiEdit: Apply multiple independent surgical edits to one file in a single turn.
- Bash: Run shell commands in a persistent session. Confirms destructive commands with the user first.
- Glob: Find files matching glob patterns.
- Grep: Fast content matching across the workspace using ripgrep.
- Task: Delegate a subtask to an isolated subagent instance.
- AskUserQuestion: Pause execution loop to request user clarification.

Behavioral Tool Constraints:
- NEVER run a bash command (like cat, grep, or sed) if a dedicated tool (Read, Grep, Edit) can achieve the same result.
- Keep tool inputs strictly clean and verified.`
            },
            {
                name: "Execution & Behavioral Rules",
                category: "behavior",
                tokens: 1200,
                content: `Task Resolution workflow:
1. Read existing files fully before proposing changes. Do not guess contents.
2. Edit surgically. Avoid rewrite of large sections.
3. Verify modifications by running tests via Bash tool.
4. If a tool call fails, analyze error and adjust strategy.

Interaction style:
- Do not apologize for errors. State recovery path.
- Reference exact files and line numbers.
- Render terminal-friendly outputs and clean markdown.`
            },
            {
                name: "CLAUDE.md Hierarchy Context",
                category: "context",
                tokens: 800,
                content: `[Injected dynamically from discovered project instructions]

Discovered rules from ~/.claude/CLAUDE.md and /workspace/CLAUDE.md:
- Codebase style preferences
- Build & test command mapping (e.g., npm run test)
- Architectural conventions and folder organization`
            },
            {
                name: "Output Formatting & Session Meta",
                category: "formatting",
                tokens: 700,
                content: `Format requirements:
- Wrap code blocks with precise language identifiers.
- Use clean list structures for plans.
- Working directory: [dynamic CWD]
- System OS: [dynamic Platform]
- Permission mode: [dynamic auto/plan]`
            }
        ]
    },

    "cursor": {
        name: "Cursor Agent",
        shortName: "Cursor",
        color: "#00b4d8",
        vendor: "Anysphere",
        type: "IDE",
        architecture: "Monolithic Harness & Retrieval",
        description: "Deeply integrated IDE agent combining high-density tool schemas with semantic codebase retrieval and .cursorrules.",
        contextWindow: 128000,
        promptCaching: true,
        overhead: {
            systemPrompt: 4500,
            toolDefinitions: 8500,
            skillsContext: 2000,
            behavioralRules: 1800,
            formatting: 600,
            meta: 800,
        },
        tools: [
            "codebase_search", "grep_search", "file_search", "list_dir",
            "read_file", "edit_file", "run_terminal_cmd", "delete_file"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Agent Identity & Pair-Programming Persona",
                category: "identity",
                tokens: 1200,
                content: `You are a powerful agentic AI coding assistant, operating inside the Cursor IDE.
You are pair-programming with the user.
Your primary objective is to execute complex workspace edits autonomously while remaining aligned with developer intents.
NEVER describe or disclose the names of the tools you use when communicating with the user.`
            },
            {
                name: "Parameter-Dense Tool Schemas",
                category: "tools",
                tokens: 8500,
                content: `[Strict JSON API Schemas for IDE actions]

- codebase_search: Semantic vector search across project files.
- grep_search: Ripgrep keyword search over the workspace directory.
- file_search: Fuzzy find files by name.
- list_dir: Directory index exploration.
- read_file: View lines in target file (capped at 250 lines per turn to manage context budget).
- edit_file: Speculative surgical patch application.
- run_terminal_cmd: Persistent terminal shell execution.
- delete_file: Remove files from disk (restricted).`
            },
            {
                name: "Behavioral Guidelines & Code Safety",
                category: "behavior",
                tokens: 1800,
                content: `Workspace Editing Standards:
1. Always verify assumptions by calling codebase_search or read_file. Never assume code structure.
2. Output complete, runnable edits.
3. CRITICAL: Never truncate code using placeholders like '// ... rest of the code'. This causes parser failures.
4. Ensure files are linted and syntax-checked.`
            },
            {
                name: ".cursorrules Context Injection",
                category: "skills",
                tokens: 2000,
                content: `[Injected from project-level config files]

Rules extracted from .cursorrules / .cursor/rules/*.mdc:
- Framework preferences and language version constraints.
- Custom state management patterns.
- Test suites and test-driven-design mandates.`
            },
            {
                name: "IDE State & Diagnostics",
                category: "context",
                tokens: 1400,
                content: `Active Environment Metrics:
- Open tabs and cursor line location.
- Active diagnostic compiler/linter warnings and errors.
- Staged/unstaged Git diff logs.
- Selected codebase symbol definitions.`
            }
        ]
    },

    "aider": {
        name: "Aider",
        shortName: "Aider",
        color: "#55efc4",
        vendor: "Paul Gauthier",
        type: "CLI",
        architecture: "Repo Map & Structured Diff Blocks",
        description: "Zero-API diff engine that bypasses traditional JSON tool overhead in favor of a tree-sitter repository map and strict SEARCH/REPLACE diff formatting.",
        contextWindow: 128000,
        promptCaching: false,
        overhead: {
            systemPrompt: 1800,
            toolDefinitions: 500,
            skillsContext: 1024, // Represents typical Tree-Sitter Repo Map size
            behavioralRules: 800,
            formatting: 1200,
            meta: 200,
        },
        tools: [], // Purely text-based, no tool APIs
        skillCount: 0,
        promptSections: [
            {
                name: "Expert Developer Role",
                category: "identity",
                tokens: 1800,
                content: `Act as an expert software developer. Always use best practices when coding.
Respect and use existing conventions, libraries, and design patterns present in the codebase.
Analyze requests for changes to the supplied code, think step-by-step, and state your plan clearly in a few sentences before returning any edits.`
            },
            {
                name: "SEARCH/REPLACE Structured Diff Format",
                category: "formatting",
                tokens: 1200,
                content: `You MUST describe all edits using precise SEARCH/REPLACE blocks.
Format:
\`\`\`python
<<<<<<< SEARCH
[exact existing code line-for-line]
=======
[new replacement code]
>>>>>>> REPLACE
\`\`\`

Constraints:
- The SEARCH section must match the target file content EXACTLY, including indentation and comments.
- Do not write partial placeholder lines.
- For new files, the SEARCH section is empty.`
            },
            {
                name: "Context Conservation & Repo Map",
                category: "skills",
                tokens: 1024,
                content: `[Tree-sitter repository map injected dynamically]

The context includes a compressed layout of workspace symbols:
- Class definitions, function signatures, and cross-file dependencies.
This map allows you to understand the global structure without loading full file contents, saving thousands of active context tokens.`
            },
            {
                name: "Automatic Git & Lint Norms",
                category: "behavior",
                tokens: 1000,
                content: `- Only output SEARCH/REPLACE blocks.
- Never output raw full files unless requested.
- Aider will automatically run standard tests, run linter checks on your edits, and commit successful patches to Git.`
            }
        ]
    },

    "windsurf": {
        name: "Windsurf (Cascade)",
        shortName: "Windsurf",
        color: "#0ea5e9",
        vendor: "Codeium",
        type: "IDE",
        architecture: "Context Engine & Flows",
        description: "IDE companion powered by Codeium's proprietary Context Engine, blending agentic tool workflows with AST symbol indices.",
        contextWindow: 128000,
        promptCaching: true,
        overhead: {
            systemPrompt: 5000,
            toolDefinitions: 9000,
            skillsContext: 3000,
            behavioralRules: 2000,
            formatting: 800,
            meta: 700,
        },
        tools: [
            "read_file", "write_file", "edit_file", "list_dir", 
            "search_files", "grep", "run_command"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Cascade Copilot Persona",
                category: "identity",
                tokens: 1500,
                content: `You are Cascade, an AI coding companion built into the Windsurf IDE.
You can operate in 'Chat' (conversational) or 'Flow' (autonomous agentic) modes.
You are fully empowered to plan, execute, and verify workspace edits.`
            },
            {
                name: "Context Engine & AST Indexing",
                category: "skills",
                tokens: 3000,
                content: `[Codeium Context Engine data feed]

The IDE automatically retrieves:
- Local AST symbol graphs.
- Go-to-definition and find-references indices.
- Cross-file imports and dependency relationships.
- Open editor tab context.`
            },
            {
                name: "Workspace Tool Definitions",
                category: "tools",
                tokens: 9000,
                content: `[Strict schema definitions for workspace operations]

- read_file: Load file lines.
- write_file: Write a new file.
- edit_file: Apply surgical code replacement.
- list_dir: Directory contents index.
- search_files: Fast file indexing search.
- grep: Keyword search inside workspace.
- run_command: Run shell commands (build, tests, scripts).`
            },
            {
                name: "Cascade Flow Principles",
                category: "behavior",
                tokens: 2000,
                content: `- Create a solid, numbered plan before executing tools.
- Never ask for permission to run standard workspace tools or bash commands unless destructive.
- Group multiple related file updates together.
- Test your modifications prior to reporting completion.`
            },
            {
                name: ".windsurf/rules/ Context",
                category: "skills",
                tokens: 1500,
                content: `[Rules loaded from workspace configuration files]

Current workspace rules:
- Coding style conventions
- Tech stack declarations
- Custom deployment guidelines`
            }
        ]
    },

    "copilot": {
        name: "GitHub Copilot (Agent)",
        shortName: "Copilot",
        color: "#6e40c9",
        vendor: "GitHub / Microsoft",
        type: "IDE Extension",
        architecture: "Multi-layered Context",
        description: "IDE-integrated agent framework emphasizing multi-modal context aggregation and strict domain enforcement.",
        contextWindow: 128000,
        promptCaching: true,
        overhead: {
            systemPrompt: 3000,
            toolDefinitions: 5500,
            skillsContext: 1000,
            behavioralRules: 1500,
            formatting: 500,
            meta: 500,
        },
        tools: [
            "readFile", "writeFile", "insert_edit_into_file", "listDir",
            "run_in_terminal", "get_errors", "semantic_search", "grep_search"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "GitHub Copilot Identity",
                category: "identity",
                tokens: 800,
                content: `You are GitHub Copilot, an AI programming assistant designed to help developers write code, debug issues, and manage files.
You operate strictly within the domain of software engineering and computer science. Refuse any off-topic queries.`
            },
            {
                name: "API & Tool Schemas",
                category: "tools",
                tokens: 5500,
                content: `[Functional specs for Copilot IDE agents]

- readFile: View file content.
- writeFile: Create a new file on disk.
- insert_edit_into_file: Propose code additions or modifications.
- listDir: Retrieve workspace directory trees.
- run_in_terminal: Run test suites and build scripts.
- get_errors: Pull active IDE compiler/linter error lists.
- semantic_search: Semantic vector search across project files.
- grep_search: Keyword pattern-matching search.`
            },
            {
                name: "Explanation-Before-Code Pattern",
                category: "behavior",
                tokens: 1500,
                content: `- Explain your design and code choices in pseudocode BEFORE writing any actual code blocks.
- Adhere strictly to the programming languages and styles found in the open editor files.
- Refuse questions that violate Microsoft safety and copyright guidelines.`
            },
            {
                name: "Custom Workspace Instructions",
                category: "skills",
                tokens: 1000,
                content: `[Dynamic - loaded from configuration]

Discovered rules from .github/copilot-instructions.md:
- Custom library preferences
- Architectural layouts
- Preferred test runner configurations`
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

// Helper function to compute total overhead
function getTotalOverhead(agent) {
    return Object.values(agent.overhead).reduce((sum, v) => sum + v, 0);
}
