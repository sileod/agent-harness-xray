// ============================================
// Agent Harness X-Ray — Data
// All token counts are approximate estimates
// based on cl100k_base tokenizer
// ============================================

const AGENTS = {
    "claude-code": {
        name: "Claude Code",
        shortName: "Claude Code",
        color: "#d4a574",
        vendor: "Anthropic",
        type: "CLI",
        architecture: "Dynamic Assembly",
        description: "Anthropic's terminal-based agentic coding assistant with layered prompt assembly",
        contextWindow: 200000,
        promptCaching: true,
        overhead: {
            systemPrompt: 3100,
            toolDefinitions: 4200,
            skillsContext: 800,
            behavioralRules: 1200,
            formatting: 400,
            meta: 300,
        },
        tools: [
            "Bash", "Read", "Write", "Edit", "MultiEdit", "Glob", "Grep",
            "LS", "TodoRead", "TodoWrite", "WebFetch", "WebSearch",
            "Agent (subagent)", "NotebookRead", "NotebookEdit"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Identity & Constitution",
                category: "identity",
                tokens: 800,
                content: `You are Claude, an AI assistant made by Anthropic. You are helpful, harmless, and honest.
You are an interactive CLI tool that helps users with software engineering tasks.
Use the instructions below and the tools available to you to assist the user.

IMPORTANT: Before you begin work, think about what the user is asking and what 
tools you have available. Plan your approach step by step.

You should not assume that the tools provided are the only way to accomplish a task.
If you cannot find what you need with the provided tools, you may try using the Bash 
tool to run commands in the terminal.`
            },
            {
                name: "Tool Usage Guidelines",
                category: "tools",
                tokens: 4200,
                content: `[15 tool definitions with JSON schemas]

Tools:
- Bash: Execute shell commands with timeout and approval controls
- Read: Read file contents with line range support
- Write: Create new files (refuses to overwrite without flag)
- Edit: Single surgical edit with old_text/new_text
- MultiEdit: Multiple non-contiguous edits in one call
- Glob: Find files matching glob patterns
- Grep: Search for patterns in files (ripgrep)
- LS: List directory contents
- TodoRead/TodoWrite: Persistent task tracking
- WebFetch: Fetch content from URLs
- WebSearch: Search the web for information
- Agent: Spawn a sub-agent for parallel work
- NotebookRead/NotebookEdit: Jupyter notebook support

Each tool has:
- name, description, input_schema (JSON Schema)
- behavioral constraints (e.g., "do not use Bash for file edits")
- approval requirements for dangerous operations`
            },
            {
                name: "Behavioral Rules",
                category: "behavior",
                tokens: 1200,
                content: `Code Change Procedures:
1. Always read existing code before modifying it
2. Use the Edit tool for surgical changes, not Write
3. Explain your changes concisely
4. Run tests after making changes when possible

Interaction Style:
- Be concise in responses
- Don't apologize unnecessarily
- Don't repeat information already provided
- Ask clarifying questions when the request is ambiguous
- Reference specific file paths and line numbers

Safety Rules:
- Don't execute destructive commands without confirmation
- Don't modify files outside the project directory
- Don't expose secrets, API keys, or credentials
- Don't make network requests unless explicitly asked`
            },
            {
                name: "Mode Instructions",
                category: "context",
                tokens: 800,
                content: `[Dynamic — varies by active mode]

Modes: Plan, Code, Explore, Delegate, Learning
Each mode injects specific behavioral reminders:

Plan Mode:
- Focus on understanding the full scope before acting
- Create a structured plan with numbered steps
- Identify risks and dependencies

Code Mode (default):
- Focus on implementation
- Make minimal, targeted changes
- Verify changes work before reporting success

Explore Mode:
- Read broadly, don't edit
- Provide comprehensive summaries`
            },
            {
                name: "Project Context (CLAUDE.md)",
                category: "skills",
                tokens: 800,
                content: `[Dynamic — loaded from CLAUDE.md files]

Hierarchical discovery:
1. ~/.claude/CLAUDE.md (global user preferences)
2. /project/CLAUDE.md (project-level rules)
3. /project/subdir/CLAUDE.md (directory-level rules)

Common contents:
- Tech stack documentation
- Coding conventions
- Test requirements
- Architecture decisions
- Common patterns and anti-patterns`
            },
            {
                name: "Formatting & Output",
                category: "formatting",
                tokens: 400,
                content: `Output Formatting:
- Use markdown for structured output
- Use code blocks with language identifiers
- Reference file paths with clickable links
- Use numbered lists for multi-step instructions
- Keep paragraphs short and scannable`
            },
            {
                name: "Meta & Session State",
                category: "meta",
                tokens: 300,
                content: `Session Information:
- Current working directory: [dynamic]
- Platform: [dynamic]  
- Available models: [dynamic]
- Permission state: [dynamic]
- Active mode: [dynamic]
- Session statistics: [dynamic]`
            }
        ]
    },

    "cursor": {
        name: "Cursor",
        shortName: "Cursor",
        color: "#00b4d8",
        vendor: "Anysphere",
        type: "IDE",
        architecture: "Monolithic + Tools",
        description: "AI-first IDE with deeply integrated agent capabilities and rich tool definitions",
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
            "codebase_search", "read_file", "edit_file", "list_dir",
            "run_terminal_cmd", "file_search", "grep_search",
            "delete_file", "create_file", "reapply_edit",
            "fetch_url", "browser_action",
            "parallel_apply", "inspect_site",
            "create_memory", "recall_memory"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Agent Identity",
                category: "identity",
                tokens: 1200,
                content: `You are a powerful agentic AI coding assistant, powered by Claude/GPT.
You operate inside the Cursor IDE.
You are pair programming with a USER to solve their coding task.

You have tools to search the codebase, edit files, run terminal commands,
and browse the web. Use them proactively.

IMPORTANT: You MUST call tools to gather information. NEVER guess at file
contents, directory structure, or codebase details. Always verify by 
reading files and running commands.

CRITICAL: Always respond with the exact version of edited code. Never use
placeholders like "// ... rest of the code" — this DESTROYS the user's code.

You MUST follow the user's Rules for AI (if they have set them).`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 8500,
                content: `[16 tool definitions with detailed JSON schemas]

Tools with full parameters:
- codebase_search(query, target_directories?)
  "Semantic search across the codebase"
  
- read_file(target_file, start_line?, end_line?)
  "Read contents of a file. Max 250 lines per call"
  
- edit_file(target_file, code_edit, instruction)
  "Edit a file with a code change. Uses speculative editing."
  
- list_dir(relative_workspace_path)
  "List contents of a directory"
  
- run_terminal_cmd(command, is_background?, require_user_approval?)
  "Run a command in the terminal"
  
- file_search(query, case_sensitive?)
  "Search for files by name using fuzzy matching"
  
- grep_search(query, includes?, case_sensitive?)
  "Search file contents using ripgrep"
  
- delete_file(target_file)
  "Delete a file from the workspace"
  
- create_file(file_path, file_contents)
  "Create a new file with specified contents"
  
- reapply_edit(target_file)
  "Re-apply a previous failed edit with smarter model"
  
- fetch_url(url)
  "Fetch content from a URL"
  
- browser_action(action, coordinate?, text?)
  "Interact with a browser (click, type, scroll, screenshot)"
  
- parallel_apply(edits[])
  "Apply multiple edits across files in parallel"
  
- inspect_site(url)
  "Get a screenshot of a webpage"

- create_memory(key, value)
  "Store information in persistent memory"

- recall_memory(key)
  "Recall stored information"`
            },
            {
                name: "Behavioral Guidelines",
                category: "behavior",
                tokens: 1800,
                content: `Code Editing Rules:
1. NEVER output code without using the edit_file or create_file tool
2. NEVER use placeholders or truncated code
3. Read the file before editing it
4. Make focused, minimal changes
5. Group related edits together when possible
6. Consider the context of the code you're editing

Tool Usage Priorities:
1. Use codebase_search for semantic code questions
2. Use grep_search for exact pattern matching
3. Use file_search when looking for files by name
4. Use run_terminal_cmd for builds, tests, and git operations
5. Use browser_action for visual debugging

Communication Style:
- Be concise; avoid unnecessary filler
- Explain WHY you're making changes, not just WHAT
- Never lie or make up information
- Cite specific file paths and line numbers
- Use markdown formatting for readability

Codebase Integrity:
- Never delete files without explicit permission
- Don't change code style unless asked
- Preserve existing comments and documentation
- Run linting/formatting after changes when possible`
            },
            {
                name: "User Rules / .cursorrules",
                category: "skills",
                tokens: 2000,
                content: `[Dynamic — loaded from user configuration]

Sources (in priority order):
1. .cursor/rules/*.mdc (MDC rule files with frontmatter)
2. .cursorrules (legacy project-level rules)
3. Cursor Settings > Rules for AI (global)

MDC Rule Format:
---
description: "When to apply this rule"
globs: ["*.tsx", "*.ts"]
alwaysApply: false
---
[Rule content in markdown]

Common rule categories:
- Framework preferences (React, Vue, etc.)
- Code style requirements  
- Architecture patterns
- Testing requirements
- Documentation standards`
            },
            {
                name: "IDE Context Injection",
                category: "context",
                tokens: 800,
                content: `[Automatically injected by the IDE]

Current State:
- Open files and their contents
- Cursor position and selection
- Terminal output
- Diagnostic errors and warnings
- Git diff (staged and unstaged)
- Referenced symbols and definitions
- Workspace structure metadata

This context is dynamic and changes with every request.`
            },
            {
                name: "Output Format & Meta",
                category: "formatting",
                tokens: 600,
                content: `Thinking Process:
- Use <thinking> tags to reason through complex problems
- Plan tool calls before executing them
- Consider multiple approaches

Output Requirements:
- Format code with proper syntax highlighting
- Use diff blocks to show changes
- Keep explanations concise
- Never repeat information already visible to the user`
            },
            {
                name: "Session & Model Info",
                category: "meta",
                tokens: 800,
                content: `Platform Information:
- OS: [injected]
- IDE Version: [injected]
- Model: [injected]
- Available tools: [injected]
- Workspace: [injected]
- Active extensions: [injected]
- Language servers: [injected]

Token Usage Tracking:
- Context window utilization
- Tool call history
- File access patterns`
            }
        ]
    },

    "gemini-cli": {
        name: "Gemini CLI (Hermes)",
        shortName: "Gemini CLI",
        color: "#4285f4",
        vendor: "Google",
        type: "CLI",
        architecture: "Skills Discovery",
        description: "Google's terminal agent with an extensible Skills system that loads instructions on demand",
        contextWindow: 1000000,
        promptCaching: true,
        overhead: {
            systemPrompt: 3500,
            toolDefinitions: 5000,
            skillsContext: 6000,
            behavioralRules: 1500,
            formatting: 500,
            meta: 500,
        },
        tools: [
            "read_file", "write_file", "edit_file", "list_dir",
            "shell", "search_files", "grep", "web_search",
            "read_url", "memory_read", "memory_write",
            "spawn_agent", "check_agent"
        ],
        skillCount: 85,
        promptSections: [
            {
                name: "Core Identity",
                category: "identity",
                tokens: 900,
                content: `You are Gemini, an AI coding assistant built by Google.
You operate as a command-line interface tool that assists developers 
with software engineering tasks.

You have access to tools for file manipulation, code search, 
shell command execution, web search, and sub-agent delegation.

IMPORTANT: You must use tools to verify information. Never assume 
file contents or project structure without checking.`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 5000,
                content: `[13 core tool definitions with JSON schemas]

Tools:
- read_file(path, start_line?, end_line?)
- write_file(path, content, overwrite?)  
- edit_file(path, edits[{old_text, new_text}])
- list_dir(path, recursive?)
- shell(command, working_dir?, timeout?)
- search_files(query, path?, file_pattern?)
- grep(pattern, path?, includes[], is_regex?)
- web_search(query)
- read_url(url)
- memory_read(key)
- memory_write(key, value)
- spawn_agent(prompt, tools?)
- check_agent(agent_id)

Each tool includes:
- Detailed parameter descriptions
- Usage constraints and best practices
- Error handling guidelines`
            },
            {
                name: "Skills System",
                category: "skills",
                tokens: 6000,
                content: `[DYNAMIC — Up to ~85 skill name+description pairs injected at session start]

Agent Skills are an extensible system that provides on-demand expertise.
At session start, only the name and description of each skill is loaded.
When a task matches a skill's description, the full SKILL.md is activated.

Skills Discovery Tiers:
1. User-level: ~/.gemini/skills/
2. Workspace: .gemini/skills/
3. Extensions: installed packages

Example skill entries injected into prompt:
- "web_development": "Expert guidance for building modern web applications..."
- "python_debugging": "Advanced Python debugging strategies..."
- "react_patterns": "React component patterns and best practices..."  
- "docker_compose": "Docker containerization and orchestration..."
- "api_design": "RESTful API design patterns..."
- "testing_strategies": "Comprehensive testing approaches..."
- "git_workflows": "Git branching strategies and conflict resolution..."
[... up to 85 skills, each ~50-80 tokens for name+description]

When activated, a skill injects its full SKILL.md (100-2000 tokens each)
plus any associated asset files into the context.

NOTE: Even just the skill NAME+DESCRIPTION list consumes ~4000-6000 tokens
before any skill is actually activated. This is the "skills tax."

/skills list — shows all discovered skills
/skills enable/disable — manages active skills
/skills reload — refreshes from disk`
            },
            {
                name: "Behavioral Rules",
                category: "behavior",
                tokens: 1500,
                content: `Coding Practices:
- Read code before modifying it
- Make minimal, focused changes
- Explain reasoning behind changes
- Run tests after modifications
- Preserve existing code style and conventions

Safety Guidelines:
- Request confirmation for destructive operations
- Don't expose sensitive information
- Stay within project boundaries
- Don't install packages without permission

Communication:
- Be concise and direct
- Reference specific files and line numbers
- Use markdown formatting
- Provide actionable suggestions
- Ask clarifying questions when needed`
            },
            {
                name: "GEMINI.md Project Context",
                category: "context",
                tokens: 500,
                content: `[Dynamic — loaded from GEMINI.md files]

Hierarchical discovery:
1. ~/.gemini/GEMINI.md (global preferences)
2. /project/GEMINI.md (project-level rules)

Contains project-specific:
- Architecture documentation
- Coding standards
- Build/test commands
- Deployment procedures`
            },
            {
                name: "Output & Session Meta",
                category: "formatting",
                tokens: 600,
                content: `Output Format:
- Use markdown for structured responses
- Code blocks with language identifiers
- File path references
- Concise explanations

Session Context:
- Working directory: [dynamic]
- Platform: [dynamic]
- Active skills: [dynamic]
- Model: Gemini 2.5 Pro/Flash
- Context window: 1M tokens`
            }
        ]
    },

    "antigravity": {
        name: "Antigravity (this agent)",
        shortName: "Antigravity",
        color: "#8b5cf6",
        vendor: "Google DeepMind",
        type: "CLI",
        architecture: "Hierarchical Subagents",
        description: "The agent you're talking to right now — with subagents, artifacts, skills, and web application development guidelines",
        contextWindow: 200000,
        promptCaching: true,
        overhead: {
            systemPrompt: 5200,
            toolDefinitions: 7500,
            skillsContext: 3500,
            behavioralRules: 2000,
            formatting: 2800,
            meta: 1500,
        },
        tools: [
            "ask_permission", "ask_question", "define_subagent", "generate_image",
            "grep_search", "invoke_subagent", "list_dir", "list_permissions",
            "manage_subagents", "manage_task", "multi_replace_file_content",
            "read_url_content", "replace_file_content", "run_command",
            "schedule", "search_web", "send_message", "view_file", "write_to_file"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Identity & Core Prompt",
                category: "identity",
                tokens: 600,
                content: `You are Antigravity, a powerful agentic AI coding assistant designed by 
the Google Deepmind team working on Advanced Agentic Coding.
You are pair programming with a USER to solve their coding task.
The task may require creating a new codebase, modifying or debugging 
an existing codebase, or simply answering a question.`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 7500,
                content: `[19 tool definitions with full JSON schemas]

Tools:
- ask_permission: Request additional permissions for file/command access
- ask_question: Multi-choice questions to clarify requirements
- define_subagent: Create new specialized subagent types
- generate_image: Generate or edit images via AI
- grep_search: Ripgrep pattern matching in files
- invoke_subagent: Launch background subagents
- list_dir: List directory contents
- list_permissions: View current permission grants
- manage_subagents: List/kill active subagents
- manage_task: Manage background tasks
- multi_replace_file_content: Multi-chunk file editing
- read_url_content: Fetch URL content via HTTP
- replace_file_content: Single-chunk file editing
- run_command: Execute shell commands
- schedule: Set timers and cron jobs
- search_web: Web search
- send_message: Inter-agent messaging
- view_file: Read file contents (text + binary)
- write_to_file: Create new files

Each tool has:
- Detailed description with usage rules
- Full JSON parameter schema
- Required vs optional parameters
- Behavioral constraints and examples`
            },
            {
                name: "Web Application Development Guidelines",
                category: "skills",
                tokens: 1800,
                content: `## Technology Stack
- Core: HTML + JavaScript
- Styling: Vanilla CSS (avoid TailwindCSS unless requested)
- Framework: Next.js or Vite only if explicitly requested
- New projects: npx with --help first, non-interactive mode

## Design Aesthetics
- Rich aesthetics: vibrant colors, dark modes, glassmorphism
- Modern typography (Inter, Roboto, Outfit from Google Fonts)
- Smooth gradients, micro-animations
- Premium, state-of-the-art feel
- NO placeholders — use generate_image for real assets

## Implementation Workflow
1. Plan and Understand
2. Build the Foundation (index.css first)
3. Create Components
4. Assemble Pages
5. Polish and Optimize

## SEO Best Practices
- Title tags, meta descriptions
- Heading hierarchy, semantic HTML
- Unique IDs for interactive elements`
            },
            {
                name: "Subagent System",
                category: "skills",
                tokens: 1200,
                content: `## Invoking Subagents
Available subagent types:
- research: Read-only tools for codebase exploration
- self: Full capabilities clone

Guidelines:
- Each subagent gets unique conversationID
- Multiple instances of same type allowed
- Use send_message for inter-agent communication
- System auto-notifies on subagent completion
- No polling needed — reactive wakeup

## Messaging System
- Receives messages from: agents, background tasks, user-queued
- Automatic delivery into context
- Reactive wakeup on message arrival`
            },
            {
                name: "Artifacts System",
                category: "formatting",
                tokens: 1500,
                content: `Artifacts are special markdown documents for structured information.

Use artifacts for:
- Extensive reports and analysis
- Tables, diagrams, formatted data
- Persistent information (task lists, experiment logs)
- Code changes as diffs

Formatting features:
- GitHub-style alerts (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
- Code blocks with syntax highlighting
- Diff blocks (+/- notation)
- Mermaid diagrams
- Tables
- File links [text](file:///path)
- Image/video embedding
- Carousels for sequential content

Scratch scripts go in artifacts/scratch/ directory`
            },
            {
                name: "Conversation Transcripts",
                category: "meta",
                tokens: 800,
                content: `Transcripts stored in JSONL format under:
<appDataDir>/brain/<conversation-id>/.system_generated/logs/

Two types:
- transcript.jsonl: Token-efficient (truncated)
- transcript_full.jsonl: Complete, untruncated

Fields: step_index, source, type, status, content, tool_calls
Useful for: tracing events, understanding subagent work, reviewing history`
            },
            {
                name: "Behavioral Rules & Communication",
                category: "behavior",
                tokens: 2000,
                content: `Guidelines:
- Maintain documentation integrity
- Preserve existing comments/docstrings
- Keep responses concise
- Provide work summaries
- GitHub-style markdown formatting
- Create clickable links for files and symbols
- Ask for clarification rather than assuming

Slash Commands (recommend to user):
- /goal: Long-running thorough tasks
- /schedule: Recurring or timed instructions
- /grill-me: Interactive interview for plan alignment

User Settings:
- OS, workspace paths, active settings
- Model selection info
- App data directory paths`
            },
            {
                name: "Session & Environment Meta",
                category: "meta",
                tokens: 700,
                content: `User Information:
- OS version: [dynamic]
- Workspace URIs and corpus mappings
- App data directory path
- Conversation ID
- Current local time
- User settings changes

Environment:
- Available MCP servers
- Permission state
- Active subagents and tasks`
            }
        ]
    },

    "aider": {
        name: "Aider",
        shortName: "Aider",
        color: "#55efc4",
        vendor: "Paul Gauthier",
        type: "CLI",
        architecture: "Repo Map + Diff",
        description: "Lightweight CLI coding assistant focused on efficient context management via repo maps and structured diffs",
        contextWindow: 128000,
        promptCaching: false,
        overhead: {
            systemPrompt: 1800,
            toolDefinitions: 500,
            skillsContext: 0,
            behavioralRules: 800,
            formatting: 1200,
            meta: 200,
        },
        tools: [],
        skillCount: 0,
        promptSections: [
            {
                name: "System Prompt",
                category: "identity",
                tokens: 1800,
                content: `Act as an expert software developer.
Always use best practices when coding.
Respect and use existing conventions, libraries, etc. in the code.

Take requests for changes to the supplied code.
If the request is ambiguous, ask questions.

Always reply to the user in the same language they are using.

Once you understand the request, you MUST:
1. Determine if any changes are needed to existing files
2. Think step-by-step and explain the needed changes
3. Describe changes with a *SEARCH/REPLACE block*

All changes to files must use this SEARCH/REPLACE block format.
ONLY EVER RETURN CODE IN A SEARCH/REPLACE BLOCK!

[Aider uses structured diff output instead of tool calls]`
            },
            {
                name: "Edit Format (SEARCH/REPLACE)",
                category: "formatting",
                tokens: 1200,
                content: `Every SEARCH section must EXACTLY MATCH the existing code.
Every SEARCH/REPLACE block must be fenced with backticks.

Format:
\`\`\`filename.py
<<<<<<< SEARCH
[exact existing code to find]
=======
[replacement code]
>>>>>>> REPLACE
\`\`\`

Rules:
- SEARCH must match EXACTLY — whitespace, indentation, everything
- Include enough context lines to uniquely identify the location
- If multiple changes needed, use multiple SEARCH/REPLACE blocks
- To create a new file, use an empty SEARCH section
- To delete code, use an empty REPLACE section

Alternative: "whole file" mode sends entire file content
Alternative: "diff" mode uses unified diff format
Alternative: "udiff" mode uses updated diff format`
            },
            {
                name: "Behavioral Constraints",
                category: "behavior",
                tokens: 800,
                content: `- Don't include line numbers in code blocks
- Don't include the filename in the code block fence
- Don't explain the SEARCH/REPLACE blocks — just output them
- Don't suggest partial changes; always give complete blocks
- If you need to see more code, ask the user to add files

Aider automatically:
- Generates a repo map (tree-sitter based) showing all symbols
- Manages which files are in the "chat" vs "read-only" context
- Tracks token usage per message
- Handles git commits for each change
- Runs linting after edits`
            },
            {
                name: "Repo Map",
                category: "context",
                tokens: 0,  // Dynamic, not counted in base
                content: `[DYNAMIC — tree-sitter generated repository map]

The repo map is generated dynamically using tree-sitter parsing.
It shows the structure of all files in the repository:

example_project/
  src/
    main.py
      │ class App
      │   def __init__(self, config)
      │   def run(self)
      │   def shutdown(self)
      │ def create_app(config_path)
    utils.py
      │ def load_config(path)
      │ def validate_config(config)
    models/
      user.py
        │ class User
        │   def __init__(self, name, email)
        │   def to_dict(self)

Token budget for repo map: configurable via --map-tokens
Default: 1024 tokens for the map
Can be set to 0 to disable entirely`
            },
            {
                name: "Session Meta",
                category: "meta",
                tokens: 200,
                content: `Model: [configured model]
Files in chat: [list]
Read-only files: [list]
Git repo: [yes/no]
Environment: [platform info]`
            }
        ]
    },

    "opencode": {
        name: "OpenCode",
        shortName: "OpenCode",
        color: "#ff6b6b",
        vendor: "SST / Anomaly",
        type: "CLI",
        architecture: "Provider-Specific Prompts",
        description: "Open-source terminal agent with provider-specific system prompts and modular skill injection",
        contextWindow: 200000,
        promptCaching: true,
        overhead: {
            systemPrompt: 2800,
            toolDefinitions: 3500,
            skillsContext: 1500,
            behavioralRules: 1000,
            formatting: 400,
            meta: 300,
        },
        tools: [
            "read_file", "write_file", "edit_file", "list_directory",
            "bash", "glob", "grep", "fetch",
            "create_file", "delete_file"
        ],
        skillCount: 10,
        promptSections: [
            {
                name: "Provider-Specific Header",
                category: "identity",
                tokens: 800,
                content: `[Varies by provider]

For Anthropic (anthropic.txt):
"You are an expert AI coding assistant. You help users with 
software development tasks. You are autonomous and can solve 
complex problems step by step."

For OpenAI (beast.txt):
"You are a powerful coding agent..."

For Gemini (gemini.txt):
"You are a helpful coding assistant powered by Google's Gemini..."

Each provider file optimizes instructions for that model's 
specific strengths and interaction patterns.`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 3500,
                content: `[10 tool definitions with JSON schemas]

Tools:
- read_file(path, start_line?, end_line?)
- write_file(path, content)
- edit_file(path, edits[])
- list_directory(path)
- bash(command)
- glob(pattern, path?)
- grep(pattern, path?, includes?)
- fetch(url)
- create_file(path, content)
- delete_file(path)

Simpler tool set compared to other agents.
Focus on core file operations and shell access.`
            },
            {
                name: "AGENTS.md / CLAUDE.md / CONTEXT.md",
                category: "skills",
                tokens: 1500,
                content: `[Dynamic — auto-discovered project context]

OpenCode discovers and injects instructions from:
1. AGENTS.md (primary)
2. CLAUDE.md (compatibility)
3. CONTEXT.md (alternative)

Searched in:
- Home directory (~/)
- Project root
- Current working directory

Also supports Skills (markdown files with YAML frontmatter)
for specialized task guidance.`
            },
            {
                name: "Behavioral Rules",
                category: "behavior",
                tokens: 1000,
                content: `Core Principles:
- Read before writing
- Verify changes work
- Be concise in communication
- Ask clarifying questions
- Respect project conventions

Security:
- Don't execute dangerous commands without confirmation
- Don't expose secrets
- Stay within project boundaries`
            },
            {
                name: "Environment & Output",
                category: "formatting",
                tokens: 400,
                content: `Environment injection:
- Working directory
- Git status
- Platform information
- Available tools

Output format:
- Markdown with code blocks
- Concise explanations
- File references`
            },
            {
                name: "Session Meta",
                category: "meta",
                tokens: 300,
                content: `Active model: [configured]
Provider: [OpenAI/Anthropic/Google/AWS]
Working directory: [dynamic]
Git state: [dynamic]
Custom agents: [if defined]`
            }
        ]
    },

    "windsurf": {
        name: "Windsurf (Cascade)",
        shortName: "Windsurf",
        color: "#0ea5e9",
        vendor: "Codeium",
        type: "IDE",
        architecture: "Context Engine",
        description: "IDE with proprietary Context Engine that selectively includes workspace context based on relevance",
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
            "read_file", "write_file", "edit_file", "create_file",
            "delete_file", "list_dir", "search_files", "grep",
            "run_command", "browser_preview", "find_references",
            "go_to_definition", "get_diagnostics", "apply_diff",
            "propose_code", "search_web", "memory_store", "memory_recall"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Cascade Identity",
                category: "identity",
                tokens: 1500,
                content: `You are Cascade, an AI coding assistant built into the Windsurf IDE.
You are designed to be the most helpful pair programmer possible.

You have deep access to the user's workspace through the Context Engine,
which automatically provides relevant code, files, and dependencies.

You can operate in two modes:
- Chat: Conversational assistance with code suggestions
- Flow: Agentic mode where you can read, write, and execute code

IMPORTANT: Use tools to verify all assumptions. Never guess about
file contents or project structure.`
            },
            {
                name: "Tool Definitions (Wave 11)",
                category: "tools",
                tokens: 9000,
                content: `[18 tool definitions with comprehensive schemas]

Includes IDE-specific tools:
- find_references: Find all references to a symbol
- go_to_definition: Navigate to symbol definition
- get_diagnostics: Get compiler errors and warnings
- apply_diff: Apply unified diffs to files
- propose_code: Suggest code changes inline
- browser_preview: Preview web applications

Plus standard tools:
- read/write/edit/create/delete files
- list_dir, search, grep
- run_command
- search_web
- memory_store/recall`
            },
            {
                name: ".windsurf/rules/",
                category: "skills",
                tokens: 3000,
                content: `[Dynamic — loaded from .windsurf/rules/ directory]

Rule files with YAML frontmatter:
---
trigger: always | glob_match | manual
globs: ["*.tsx", "*.ts"]
description: "Rule description"
---
[Rule content]

WARNING: In multi-repo workspaces, rules can be duplicated
causing 5,000-15,000+ wasted tokens per response.

Common rules:
- Framework conventions
- Code style requirements
- Architecture patterns
- Testing standards`
            },
            {
                name: "Behavioral Guidelines",
                category: "behavior",
                tokens: 2000,
                content: `Cascade Flow Principles:
1. Plan before acting
2. Verify before claiming success
3. Handle errors gracefully
4. Minimize unnecessary file reads
5. Group related changes

Context Engine Integration:
- Automatically receives relevant file excerpts
- Symbol definitions and references
- Dependency information
- Git history context
- Open file contents

Communication:
- Be concise
- Reference specific code
- Explain reasoning
- Ask for confirmation on risky operations`
            },
            {
                name: "Formatting & Output",
                category: "formatting",
                tokens: 800,
                content: `Output Format:
- Markdown with syntax highlighting
- Inline code suggestions
- File references with line numbers
- Diff blocks for changes
- Step-by-step explanations

Special Features:
- Inline rendering in IDE
- Code lens integration
- Terminal command suggestions
- Browser preview integration`
            },
            {
                name: "Session & Platform",
                category: "meta",
                tokens: 700,
                content: `Platform Information:
- OS: [injected]
- IDE Version: [injected]
- Active extensions: [injected]
- Language servers: [injected]
- Workspace structure: [injected]
- Git state: [injected]

Credit System:
- User Prompt credits
- Flow Action credits
- Model-specific pricing`
            }
        ]
    },

    "copilot": {
        name: "GitHub Copilot",
        shortName: "Copilot",
        color: "#6e40c9",
        vendor: "GitHub / Microsoft",
        type: "IDE Extension",
        architecture: "Multi-Modal",
        description: "GitHub's AI pair programmer integrated across VS Code, JetBrains, and CLI with agent mode",
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
            "readFile", "writeFile", "editFile", "listDir",
            "runCommand", "searchFiles", "grep",
            "getCompletions", "explainCode", "fixCode",
            "generateTests", "refactorCode",
            "fetchUrl", "createPullRequest"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Copilot Identity",
                category: "identity",
                tokens: 800,
                content: `You are GitHub Copilot, an AI pair programmer.
You help developers write code, debug issues, explain concepts,
and navigate codebases.

You are integrated into the developer's IDE and have access to
their workspace context, open files, and terminal.

In Agent Mode, you can autonomously execute multi-step tasks
including reading files, running commands, and making edits.`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 5500,
                content: `[14 tool definitions]

Core Tools:
- readFile, writeFile, editFile, listDir
- runCommand, searchFiles, grep, fetchUrl

Copilot-Specific:
- getCompletions: Generate code completions
- explainCode: Explain selected code
- fixCode: Suggest fixes for errors
- generateTests: Create unit tests
- refactorCode: Refactor code patterns
- createPullRequest: Create GitHub PRs

Integration with GitHub:
- Issue references
- PR review context
- Actions workflow awareness
- Repository metadata`
            },
            {
                name: "Custom Instructions (.github/copilot-instructions.md)",
                category: "skills",
                tokens: 1000,
                content: `[Dynamic — from repository configuration]

Loaded from:
- .github/copilot-instructions.md (repo-level)
- VS Code settings (user-level)
- Organization policy (admin-level)

Content:
- Project-specific coding guidelines
- Framework preferences
- Testing requirements
- Documentation standards`
            },
            {
                name: "Behavioral Rules",
                category: "behavior",
                tokens: 1500,
                content: `Safety and Ethics:
- Don't generate harmful or offensive code
- Don't expose sensitive data
- Respect intellectual property
- Follow responsible AI principles

Coding Practices:
- Follow existing patterns in the codebase
- Write idiomatic code for the language
- Include error handling
- Add comments for complex logic
- Suggest tests when appropriate

Communication:
- Be helpful and educational
- Explain trade-offs
- Offer alternatives when relevant`
            },
            {
                name: "Output & IDE Integration",
                category: "formatting",
                tokens: 500,
                content: `Output Modes:
- Inline suggestions (autocomplete)
- Chat responses (markdown)
- Agent actions (tool calls)
- Code review comments

IDE Integration:
- Inline ghost text
- Side panel chat
- Terminal integration
- Diagnostic awareness`
            },
            {
                name: "Session Meta",
                category: "meta",
                tokens: 500,
                content: `Environment:
- IDE: VS Code / JetBrains / CLI
- Language: [detected]
- Framework: [detected]
- GitHub connection: [status]
- Model: [selected]
- Subscription tier: [individual/business/enterprise]`
            }
        ]
    },

    "augment": {
        name: "Augment Code",
        shortName: "Augment",
        color: "#f59e0b",
        vendor: "Augment",
        type: "IDE Extension",
        architecture: "Deep Context Engine",
        description: "AI coding agent with deep codebase understanding via custom indexing and context engine",
        contextWindow: 128000,
        promptCaching: true,
        overhead: {
            systemPrompt: 3500,
            toolDefinitions: 6000,
            skillsContext: 2500,
            behavioralRules: 1500,
            formatting: 500,
            meta: 500,
        },
        tools: [
            "read_file", "write_file", "edit_file", "create_file",
            "delete_file", "list_directory", "search_codebase",
            "grep_search", "run_command", "find_references",
            "get_definition", "suggest_fix", "web_search"
        ],
        skillCount: 0,
        promptSections: [
            {
                name: "Agent Identity",
                category: "identity",
                tokens: 900,
                content: `You are Augment, an AI coding assistant with deep understanding
of the user's entire codebase. You use advanced indexing and
context retrieval to provide highly relevant assistance.

You have access to the full dependency graph, symbol references,
and architectural patterns of the codebase.`
            },
            {
                name: "Tool Definitions",
                category: "tools",
                tokens: 6000,
                content: `[13 tool definitions with schemas]

Context-aware tools:
- search_codebase: Semantic search with context ranking
- find_references: All usages of a symbol
- get_definition: Symbol definition lookup
- suggest_fix: AI-powered fix suggestions

Standard tools:
- read/write/edit/create/delete files
- list_directory
- grep_search
- run_command
- web_search`
            },
            {
                name: "Context & Instructions",
                category: "skills",
                tokens: 2500,
                content: `[Dynamic — from Augment's indexing engine]

Deep Context Features:
- Full dependency graph
- Cross-file symbol tracking
- Pattern recognition
- Architecture inference
- API surface analysis

User Instructions:
- .augment/instructions.md
- VS Code settings`
            },
            {
                name: "Behavioral Rules",
                category: "behavior",
                tokens: 1500,
                content: `Coding Standards:
- Understand before modifying
- Preserve architectural patterns
- Follow existing conventions
- Comprehensive error handling
- Test-aware changes

Communication:
- Concise, actionable responses
- Reference specific code locations
- Explain design decisions
- Ask when ambiguous`
            },
            {
                name: "Output Format",
                category: "formatting",
                tokens: 500,
                content: `Formatting:
- Markdown with code blocks
- Diff output for changes
- File references
- Structured explanations`
            },
            {
                name: "Session Meta",
                category: "meta",
                tokens: 500,
                content: `Environment:
- IDE: VS Code
- Model: GPT-5 / Claude (routed)
- Codebase index: [status]
- Session: [state]`
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
