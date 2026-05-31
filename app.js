// ============================================
// Agent Harness X-Ray — App Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initOverview();
    initCompare();
    initPromptViewer();
    initTokenBudget();
    initAnatomy();
});

// ============================================
// Theme (Light/Dark Mode) Handler
// ============================================
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    // Retrieve saved theme preference, defaulting to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// ============================================
// Navigation Handler
// ============================================
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            
            // Toggle active buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle active views
            views.forEach(v => v.classList.remove('active'));
            const targetView = document.getElementById(`view-${viewId}`);
            if (targetView) targetView.classList.add('active');

            // Re-render view-specific dynamic logic on enter
            if (viewId === 'compare') {
                updateCompare();
            } else if (viewId === 'token-budget') {
                updateBudget();
            } else if (viewId === 'anatomy') {
                updateAnatomy();
            }
        });
    });
}

// ============================================
// Overview View
// ============================================
function initOverview() {
    renderOverviewMetrics();
    renderOverviewChart();
    renderComparisonTable();
}

function renderOverviewMetrics() {
    const container = document.getElementById('overview-metrics');
    if (!container) return;

    // Calculate highlighting metrics
    let largestAgent = null;
    let largestTokens = 0;
    
    let leanestAgent = null;
    let leanestTokens = Infinity;

    let toolHeavyAgent = null;
    let maxTools = 0;

    let skillHeavyAgent = null;
    let maxSkills = 0;

    Object.keys(AGENTS).forEach(key => {
        const agent = AGENTS[key];
        const total = getTotalOverhead(agent);
        
        if (total > largestTokens) {
            largestTokens = total;
            largestAgent = agent;
        }
        if (total < leanestTokens) {
            leanestTokens = total;
            leanestAgent = agent;
        }
        if (agent.tools.length > maxTools) {
            maxTools = agent.tools.length;
            toolHeavyAgent = agent;
        }
        if (agent.skillCount > maxSkills) {
            maxSkills = agent.skillCount;
            skillHeavyAgent = agent;
        }
    });

    const metrics = [
        {
            label: "Largest Harness",
            value: `${(largestTokens / 1000).toFixed(1)}k`,
            detail: "Tokens sent on turn 1",
            agent: largestAgent.name,
            color: largestAgent.color
        },
        {
            label: "Leanest Harness",
            value: `${(leanestTokens / 1000).toFixed(1)}k`,
            detail: "High-efficiency diff engine",
            agent: leanestAgent.name,
            color: leanestAgent.color
        },
        {
            label: "Most Tool-Heavy",
            value: toolHeavyAgent.tools.length,
            detail: "Pre-defined schemas & constraints",
            agent: toolHeavyAgent.name,
            color: toolHeavyAgent.color
        },
        {
            label: "Most Extensible",
            value: skillHeavyAgent.skillCount,
            detail: "On-demand discovered skills",
            agent: skillHeavyAgent.name,
            color: skillHeavyAgent.color
        }
    ];

    container.innerHTML = metrics.map(m => `
        <div class="metric-card" style="--card-accent: ${m.color}">
            <div class="metric-label">${m.label}</div>
            <div class="metric-value" style="color: ${m.color}">${m.value}</div>
            <div class="metric-detail">${m.detail}</div>
            <div class="metric-agent">Featured: <strong>${m.agent}</strong></div>
        </div>
    `).join('');
}

function renderOverviewChart() {
    const chartContainer = document.getElementById('overview-chart');
    const legendContainer = document.getElementById('overview-legend');
    if (!chartContainer || !legendContainer) return;

    // Render legend
    legendContainer.innerHTML = Object.keys(OVERHEAD_COMPONENTS).map(key => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${OVERHEAD_COMPONENTS[key].color}"></span>
            <span>${OVERHEAD_COMPONENTS[key].label}</span>
        </div>
    `).join('');

    // Find maximum total overhead to normalize bar widths
    const maxOverhead = Math.max(...Object.values(AGENTS).map(getTotalOverhead));

    // Render stacked bars
    chartContainer.innerHTML = Object.keys(AGENTS).map(key => {
        const agent = AGENTS[key];
        const total = getTotalOverhead(agent);
        
        let segmentsHTML = '';
        Object.keys(OVERHEAD_COMPONENTS).forEach(compKey => {
            const val = agent.overhead[compKey] || 0;
            if (val === 0) return;
            
            const pct = (val / total) * 100;
            const barPct = (val / maxOverhead) * 100;
            
            segmentsHTML += `
                <div class="chart-bar-segment" style="width: ${barPct}%; background: ${OVERHEAD_COMPONENTS[compKey].color}">
                    <div class="tooltip">
                        <strong>${OVERHEAD_COMPONENTS[compKey].label}</strong><br>
                        ${val.toLocaleString()} tokens (${pct.toFixed(1)}%)
                    </div>
                </div>
            `;
        });

        return `
            <div class="chart-row">
                <div class="chart-agent-name">
                    <span class="agent-dot" style="background: ${agent.color}"></span>
                    <span>${agent.name}</span>
                </div>
                <div class="chart-bar-container">
                    ${segmentsHTML}
                </div>
                <div class="chart-total">${total.toLocaleString()} t</div>
            </div>
        `;
    }).join('');
}

function renderComparisonTable() {
    const tbody = document.getElementById('comparison-table-body');
    if (!tbody) return;

    tbody.innerHTML = Object.keys(AGENTS).map(key => {
        const agent = AGENTS[key];
        const total = getTotalOverhead(agent);

        return `
            <tr>
                <td class="td-agent">
                    <span class="agent-dot" style="background: ${agent.color}"></span>
                    <strong>${agent.name}</strong>
                </td>
                <td class="td-tokens">${(agent.overhead.systemPrompt || 0).toLocaleString()}</td>
                <td class="td-tokens">${(agent.overhead.toolDefinitions || 0).toLocaleString()}</td>
                <td class="td-tokens">${(agent.overhead.skillsContext || 0).toLocaleString()}</td>
                <td class="td-tokens td-highlight">${total.toLocaleString()}</td>
                <td>${agent.tools.length}</td>
                <td>${agent.skillCount || '—'}</td>
                <td><span class="td-arch">${agent.architecture}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// Compare View
// ============================================
function initCompare() {
    const selectA = document.getElementById('compare-agent-a');
    const selectB = document.getElementById('compare-agent-b');
    if (!selectA || !selectB) return;

    // Populate select boxes
    const optionsHTML = Object.keys(AGENTS).map(key => `
        <option value="${key}">${AGENTS[key].name}</option>
    `).join('');

    selectA.innerHTML = optionsHTML;
    selectB.innerHTML = optionsHTML;

    // Set default selections
    selectA.value = 'claude-code';
    selectB.value = 'aider';

    selectA.addEventListener('change', updateCompare);
    selectB.addEventListener('change', updateCompare);

    updateCompare();
}

function updateCompare() {
    const valA = document.getElementById('compare-agent-a').value;
    const valB = document.getElementById('compare-agent-b').value;
    
    renderComparePanel('compare-panel-a', valA);
    renderComparePanel('compare-panel-b', valB);
}

function renderComparePanel(containerId, agentKey) {
    const container = document.getElementById(containerId);
    const agent = AGENTS[agentKey];
    if (!container || !agent) return;

    const total = getTotalOverhead(agent);

    // Render Stats and Categories list
    let listHTML = '';
    let accumulatedAngle = 0;
    let svgPaths = '';

    const sortedComponents = Object.keys(OVERHEAD_COMPONENTS).map(key => ({
        key,
        label: OVERHEAD_COMPONENTS[key].label,
        color: OVERHEAD_COMPONENTS[key].color,
        val: agent.overhead[key] || 0
    })).sort((a, b) => b.val - a.val);

    sortedComponents.forEach(c => {
        if (c.val === 0) return;
        const pct = (c.val / total) * 100;
        
        listHTML += `
            <li class="compare-section-item">
                <span class="compare-section-dot" style="background: ${c.color}"></span>
                <span>${c.label}</span>
                <span class="compare-section-tokens">${c.val.toLocaleString()} t (${pct.toFixed(0)}%)</span>
            </li>
        `;

        // SVG donut calculations
        const angle = (c.val / total) * 360;
        const x1 = 90 + 70 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
        const y1 = 90 + 70 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
        accumulatedAngle += angle;
        const x2 = 90 + 70 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
        const y2 = 90 + 70 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
        const largeArc = angle > 180 ? 1 : 0;

        svgPaths += `
            <path d="M ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2}" 
                  fill="none" 
                  stroke="${c.color}" 
                  stroke-width="18" />
        `;
    });

    container.innerHTML = `
        <div class="compare-panel-header">
            <span class="agent-dot" style="background: ${agent.color}"></span>
            <h4>${agent.name}</h4>
        </div>
        
        <div class="compare-stat-grid">
            <div class="compare-stat">
                <div class="compare-stat-label">Architecture</div>
                <div class="compare-stat-value" style="font-size: 0.95rem; color: ${agent.color}">${agent.architecture}</div>
            </div>
            <div class="compare-stat">
                <div class="compare-stat-label">Total Tools</div>
                <div class="compare-stat-value" style="color: var(--accent-secondary)">${agent.tools.length}</div>
            </div>
        </div>

        <div class="compare-donut">
            <svg viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="18" />
                ${svgPaths}
            </svg>
            <div class="compare-donut-center">
                <div class="total">${(total / 1000).toFixed(1)}k</div>
                <div class="label">Overhead</div>
            </div>
        </div>

        <ul class="compare-section-list">
            ${listHTML}
        </ul>

        <div style="margin-top: var(--space-lg); font-size: 0.82rem; color: var(--text-secondary)">
            <strong>Harness details:</strong> ${agent.description}
        </div>
    `;
}

// ============================================
// Prompt Viewer View
// ============================================
let activeSectionIndex = 0;

function initPromptViewer() {
    const select = document.getElementById('prompt-agent-select');
    if (!select) return;

    // Populate select
    select.innerHTML = Object.keys(AGENTS).map(key => `
        <option value="${key}">${AGENTS[key].name}</option>
    `).join('');

    select.value = 'claude-code';

    select.addEventListener('change', () => {
        activeSectionIndex = 0;
        updatePromptViewer();
    });

    updatePromptViewer();
}

function updatePromptViewer() {
    const select = document.getElementById('prompt-agent-select');
    const agentKey = select.value;
    const agent = AGENTS[agentKey];
    if (!agent) return;

    const total = getTotalOverhead(agent);

    // Update Stats panel
    const statsContainer = document.getElementById('prompt-stats');
    statsContainer.innerHTML = `
        <div class="prompt-stat">Harness Overhead: <strong>${total.toLocaleString()} tokens</strong></div>
        <div class="prompt-stat">Tool Schemas: <strong>${(agent.overhead.toolDefinitions || 0).toLocaleString()} tokens</strong></div>
        <div class="prompt-stat">Architecture: <strong style="color: ${agent.color}">${agent.architecture}</strong></div>
    `;

    // Render TOC
    const toc = document.getElementById('prompt-toc');
    toc.innerHTML = `
        <h4>Prompt Sections</h4>
        ${agent.promptSections.map((sec, idx) => {
            const cat = CATEGORIES[sec.category] || CATEGORIES.meta;
            const activeClass = idx === activeSectionIndex ? 'active' : '';
            return `
                <button class="toc-item ${activeClass}" onclick="setActivePromptSection(${idx})">
                    <span class="toc-dot" style="background: ${cat.color}"></span>
                    <span>${sec.name}</span>
                    <span class="toc-tokens">${sec.tokens.toLocaleString()} t</span>
                </button>
            `;
        }).join('')}
    `;

    // Render Content Panel
    const content = document.getElementById('prompt-content');
    const sec = agent.promptSections[activeSectionIndex];
    if (!sec) {
        content.innerHTML = '<div style="padding: var(--space-xl); color: var(--text-tertiary)">No prompt section found.</div>';
        return;
    }

    const cat = CATEGORIES[sec.category] || CATEGORIES.meta;

    content.innerHTML = `
        <div class="prompt-section" style="--section-color: ${cat.color}">
            <div class="prompt-section-header">
                <div class="prompt-section-title">
                    <span class="legend-dot" style="background: ${cat.color}"></span>
                    <strong>${sec.name}</strong>
                </div>
                <div class="prompt-section-badge" style="color: ${cat.color}; background: rgba(${hexToRgb(cat.color)}, 0.1)">
                    ${cat.label}
                </div>
            </div>
            
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md)">
                Estimated Token Weight: <strong style="font-family: var(--font-mono); color: var(--text-primary)">${sec.tokens.toLocaleString()} tokens</strong> 
                (${((sec.tokens / total) * 100).toFixed(1)}% of total harness)
            </p>

            <pre class="prompt-text"><code>${escapeHTML(sec.content)}</code></pre>
        </div>
    `;
}

// Global hook for section changes
window.setActivePromptSection = function(idx) {
    activeSectionIndex = idx;
    updatePromptViewer();
};

// ============================================
// Token Budget View
// ============================================
function initTokenBudget() {
    const budgetAgentSelect = document.getElementById('budget-agent-select');
    const contextSelect = document.getElementById('context-window-select');
    const turnsSlider = document.getElementById('turns-slider');
    const turnsValue = document.getElementById('turns-value');

    if (!budgetAgentSelect || !contextSelect || !turnsSlider) return;

    // Populate agent select
    budgetAgentSelect.innerHTML = Object.keys(AGENTS).map(key => `
        <option value="${key}">${AGENTS[key].name}</option>
    `).join('');

    budgetAgentSelect.value = 'claude-code';

    // Hook listeners
    budgetAgentSelect.addEventListener('change', updateBudget);
    contextSelect.addEventListener('change', updateBudget);
    turnsSlider.addEventListener('input', () => {
        turnsValue.textContent = turnsSlider.value;
        updateBudget();
    });

    updateBudget();
}

function updateBudget() {
    const agentKey = document.getElementById('budget-agent-select').value;
    const agent = AGENTS[agentKey];
    const totalContext = parseInt(document.getElementById('context-window-select').value);
    const turns = parseInt(document.getElementById('turns-slider').value);

    if (!agent) return;

    const baseOverhead = getTotalOverhead(agent);

    // Approximate cost parameters per turn
    const userPromptSize = 150;      // 150 tokens per user request
    const agentResponseSize = 600;   // 600 tokens per agent response
    const loopTraceCost = 80;       // 80 tokens per turn for agent loop/reasoning trace

    // Compute turns tokens
    // Turn 1: baseOverhead + User Prompt (150) + Response (600) + loopTrace (80)
    // Dynamic context grows. In non-cached mode, everything is re-sent.
    // In cached mode (enabled for most in 2026), baseOverhead is cached.
    const turnCost = userPromptSize + agentResponseSize + loopTraceCost;
    
    // Total tokens in prompt context at current turn:
    // Every turn adds the user request and response history to the context.
    const historyTokens = turnCost * turns;
    const currentContextUsage = baseOverhead + historyTokens;

    // Calculations for Caching discount:
    // Caching saves input tokens. Assume cache hit on baseOverhead.
    const totalAccumulatedInputTokens = (baseOverhead * turns) + (turnCost * (turns * (turns + 1)) / 2);
    const cachedAccumulatedInputTokens = baseOverhead + (turnCost * (turns * (turns + 1)) / 2);

    const contextPct = (currentContextUsage / totalContext) * 100;
    const remainingContext = Math.max(0, totalContext - currentContextUsage);

    // Render bar chart
    const viz = document.getElementById('budget-viz');
    
    const basePct = Math.min(100, (baseOverhead / totalContext) * 100);
    const historyPct = Math.min(100 - basePct, (historyTokens / totalContext) * 100);
    const freePct = Math.max(0, 100 - basePct - historyPct);

    viz.innerHTML = `
        <div class="budget-context-bar">
            <div class="budget-segment" style="width: ${basePct}%; background: var(--accent-primary)">
                <span>Overhead (${(baseOverhead/1000).toFixed(1)}k)</span>
            </div>
            <div class="budget-segment" style="width: ${historyPct}%; background: var(--accent-secondary)">
                <span>History (${(historyTokens/1000).toFixed(1)}k)</span>
            </div>
            <div class="budget-segment" style="width: ${freePct}%; background: rgba(255,255,255,0.03); color: var(--text-tertiary)">
                <span>Free (${(remainingContext/1000).toFixed(0)}k)</span>
            </div>
        </div>
        <div class="budget-labels">
            <div class="budget-label">
                <span class="budget-label-dot" style="background: var(--accent-primary)"></span>
                <span>Base Overhead:</span>
                <span class="budget-label-tokens">${baseOverhead.toLocaleString()} t</span>
                <span class="budget-label-pct">(${((baseOverhead/totalContext)*100).toFixed(1)}%)</span>
            </div>
            <div class="budget-label">
                <span class="budget-label-dot" style="background: var(--accent-secondary)"></span>
                <span>Conversation History:</span>
                <span class="budget-label-tokens">${historyTokens.toLocaleString()} t</span>
                <span class="budget-label-pct">(${((historyTokens/totalContext)*100).toFixed(1)}%)</span>
            </div>
            <div class="budget-label">
                <span class="budget-label-dot" style="background: var(--text-muted)"></span>
                <span>Total Context Utilized:</span>
                <span class="budget-label-tokens" style="color: ${contextPct > 90 ? 'var(--accent-danger)' : 'var(--text-primary)'}">${currentContextUsage.toLocaleString()} / ${totalContext.toLocaleString()} t</span>
                <span class="budget-label-pct">(${contextPct.toFixed(1)}%)</span>
            </div>
        </div>
    `;

    // Render detailed stats
    const details = document.getElementById('budget-details');
    
    // Cost calculation (using 2026 pricing: $3/M input, $15/M output approx, or cached input $0.30/M)
    const costStandard = (totalAccumulatedInputTokens / 1000000) * 3 + ((agentResponseSize * turns) / 1000000) * 15;
    const costCached = (cachedAccumulatedInputTokens / 1000000) * 0.3 + ((baseOverhead * (turns - 1)) / 1000000) * 3 + ((agentResponseSize * turns) / 1000000) * 15;
    
    details.innerHTML = `
        <div class="budget-detail-grid">
            <div class="budget-detail-item">
                <div class="budget-detail-label">Active Context Space</div>
                <div class="budget-detail-value">${contextPct.toFixed(1)}%</div>
                <div class="budget-detail-sub">${remainingContext.toLocaleString()} free tokens remaining</div>
            </div>
            <div class="budget-detail-item">
                <div class="budget-detail-label">Standard Conversation Cost</div>
                <div class="budget-detail-value" style="color: var(--accent-danger)">$${costStandard.toFixed(3)}</div>
                <div class="budget-detail-sub">Without Prompt Caching enabled</div>
            </div>
            <div class="budget-detail-item" style="border: 1px solid rgba(85, 239, 196, 0.2)">
                <div class="budget-detail-label">Cached Conversation Cost</div>
                <div class="budget-detail-value" style="color: var(--accent-success)">$${costCached.toFixed(3)}</div>
                <div class="budget-detail-sub">With 2026 Prompt Caching (90% off)</div>
            </div>
            <div class="budget-detail-item">
                <div class="budget-detail-label">Overhead Tax</div>
                <div class="budget-detail-value" style="color: ${agent.color}">${((baseOverhead / currentContextUsage) * 100).toFixed(0)}%</div>
                <div class="budget-detail-sub">Ratio of base prompt in active window</div>
            </div>
        </div>
        <div class="budget-warning" id="budget-warning-banner"></div>
    `;

    // Warning Banner if window overflows
    const warningBanner = document.getElementById('budget-warning-banner');
    if (currentContextUsage > totalContext) {
        warningBanner.className = "budget-warning visible";
        warningBanner.innerHTML = `⚠️ <strong>CONTEXT WINDOW EXCEEDED!</strong> The conversation has overflowed the active model's context window. System prompt details will start getting truncated, leading to hallucinated tool structures and broken agent loops.`;
    } else if (contextPct > 80) {
        warningBanner.className = "budget-warning visible";
        warningBanner.style.color = "var(--accent-warning)";
        warningBanner.style.background = "rgba(253, 203, 110, 0.1)";
        warningBanner.style.borderColor = "rgba(253, 203, 110, 0.2)";
        warningBanner.innerHTML = `⚠️ <strong>CRITICAL CONTEXT LEVEL!</strong> Utilizing ${contextPct.toFixed(1)}% of your context window. Consider closing open tabs, removing large files from active context, or dropping chat history.`;
    } else {
        warningBanner.className = "budget-warning";
    }
}

// ============================================
// Anatomy View
// ============================================
function initAnatomy() {
    const select = document.getElementById('anatomy-agent-select');
    if (!select) return;

    select.innerHTML = Object.keys(AGENTS).map(key => `
        <option value="${key}">${AGENTS[key].name}</option>
    `).join('');

    select.value = 'claude-code';
    select.addEventListener('change', updateAnatomy);

    updateAnatomy();
}

function updateAnatomy() {
    const agentKey = document.getElementById('anatomy-agent-select').value;
    const agent = AGENTS[agentKey];
    const container = document.getElementById('anatomy-container');

    if (!agent || !container) return;

    const total = getTotalOverhead(agent);

    // Dynamic additions for turn 1 context
    const layers = [
        {
            name: "Layer 1: Identity & Persona Setup",
            desc: "Sets the master instructions, agent role description, vendor policies, and self-characterization.",
            key: "systemPrompt",
            color: "var(--cat-identity)",
            tokens: agent.overhead.systemPrompt || 0,
            text: agent.promptSections.find(s => s.category === 'identity')?.content || "Standard agent identity prompt..."
        },
        {
            name: "Layer 2: Tool & Action Schemas",
            desc: "The explicit JSON parameters and behavioral restrictions for file systems, command execution, and network queries.",
            key: "toolDefinitions",
            color: "var(--cat-tools)",
            tokens: agent.overhead.toolDefinitions || 0,
            text: agent.promptSections.find(s => s.category === 'tools')?.content || "List of tools and formatting templates..."
        },
        {
            name: "Layer 3: Project Rules & Skills Context",
            desc: "Project constraints loaded dynamically from CLAUDE.md, .cursorrules, or discovered extension files.",
            key: "skillsContext",
            color: "var(--cat-skills)",
            tokens: agent.overhead.skillsContext || 0,
            text: agent.promptSections.find(s => s.category === 'skills')?.content || "Skills discovery schemas..."
        },
        {
            name: "Layer 4: Behavioral Constraints & Guidelines",
            desc: "Self-reasoning loops, read-before-write, edit-first procedures, and explanation guidelines.",
            key: "behavioralRules",
            color: "var(--cat-behavior)",
            tokens: agent.overhead.behavioralRules || 0,
            text: agent.promptSections.find(s => s.category === 'behavior')?.content || "Surgical editing and validation guidelines..."
        },
        {
            name: "Layer 5: Output & Formatting Directives",
            desc: "Instruction on how to format search/replace blocks, markdown diff syntax, and thinking tag requirements.",
            key: "formatting",
            color: "var(--cat-formatting)",
            tokens: agent.overhead.formatting || 0,
            text: agent.promptSections.find(s => s.category === 'formatting')?.content || "Instructions on outputting markdown structures..."
        },
        {
            name: "Layer 6: Active Session & Environment Metadata",
            desc: "Dynamic context containing current working directory, git diff, shell type, and active platform parameters.",
            key: "meta",
            color: "var(--cat-meta)",
            tokens: agent.overhead.meta || 0,
            text: agent.promptSections.find(s => s.category === 'meta')?.content || "Active user session metadata..."
        }
    ];

    container.innerHTML = layers.map((layer, idx) => {
        const pct = (layer.tokens / total) * 100;
        return `
            <div class="anatomy-layer" id="anatomy-layer-${idx}">
                <div class="anatomy-layer-header" onclick="toggleAnatomyLayer(${idx})">
                    <span class="anatomy-layer-indicator" style="background: ${layer.color}"></span>
                    <div class="anatomy-layer-info">
                        <div class="anatomy-layer-name">${layer.name}</div>
                        <div class="anatomy-layer-desc">${layer.desc}</div>
                    </div>
                    <div class="anatomy-layer-tokens">${layer.tokens.toLocaleString()} tokens</div>
                    <div class="anatomy-layer-pct">${pct.toFixed(0)}%</div>
                </div>
                <div class="anatomy-layer-content">
                    <pre class="anatomy-layer-text"><code>${escapeHTML(layer.text)}</code></pre>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleAnatomyLayer = function(idx) {
    const layer = document.getElementById(`anatomy-layer-${idx}`);
    if (layer) {
        layer.classList.toggle('expanded');
    }
};

// ============================================
// Utilities
// ============================================
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}
