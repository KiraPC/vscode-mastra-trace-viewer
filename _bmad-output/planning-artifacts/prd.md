---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success']
inputDocuments: 
  - "_bmad-output/planning-artifacts/product-brief-mastra-trace-viewer-2026-02-10.md"
  - "_bmad-output/brainstorming/brainstorming-session-2026-02-10.md"
workflowType: 'prd'
projectName: 'mastra-trace-viewer'
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: 'developer_tool'
  domain: 'developer_tools_ai_observability'
  complexity: 'medium'
  projectContext: 'greenfield'
author: 'Pasquale'
date: '2026-02-10'
---

# Product Requirements Document - mastra-trace-viewer

**Author:** Pasquale
**Date:** 2026-02-10

## Success Criteria

### User Success

**Primary Success Moment:** Developers successfully debug and understand their Mastra agent behavior entirely within VSCode, without context-switching to external browsers or platforms.

**Measurable Outcomes:**
- **80% of debugging sessions** are resolvable entirely within VSCode (no need to export traces or use external tools)
- Developers can identify why agents behave unexpectedly (e.g., calling the same tool multiple times) by examining trace details
- Developers can navigate from "noticed weird behavior" → "understood root cause" within their VSCode workflow

**User Experience Success:**
- Tree view clearly shows hierarchical span structure (agent → processor → tool → LLM calls)
- Expanding spans reveals actionable information (input and output data)
- Trace list in sidebar provides easy access to recent traces via refresh mechanism
- Multiple traces can be opened in tabs for comparison

### Business Success

**Core Business Outcome:** Replace manual trace export/import workflows with native VSCode experience.

**Success Signal:** Mastra developers adopt the extension as their primary trace debugging tool, eliminating the need for manual trace extraction and external viewer workflows.

**Adoption Indicators:**
- Active usage by Mastra community developers
- Extension becomes the recommended debugging tool in Mastra documentation
- Positive community feedback and engagement
- Developers report improved debugging productivity

### Technical Success

**Performance Requirements:**
- Trace viewer performs responsively for typical Mastra traces (50-200 spans)
- API connection to Mastra instance is reliable and configurable
- Extension integrates seamlessly with VSCode UI patterns (sidebar, tabs, commands)

**Reliability Requirements:**
- Stable connection to local Mastra instances
- Graceful handling of large traces
- No crashes or data loss during normal operations

### Measurable Outcomes

**User Productivity:**
- Time from "run agent" to "understand behavior" is reduced compared to manual export workflows
- Developers can debug without leaving their primary development environment
- Context switching between code and traces is eliminated

**Adoption Success:**
- Extension is actively used (not just installed)
- Developers view traces through extension rather than manual methods
- Positive user feedback indicates workflow improvement

## Product Scope

### MVP - Minimum Viable Product

**Core experience that proves the concept:**

1. **Mastra API Integration**
   - Configurable endpoint connection to Mastra instance
   - Fetch trace list via API
   - Refresh button to pull latest traces

2. **Trace List Sidebar**
   - Display traces in VSCode sidebar TreeView
   - Show basic trace info (traceId, timestamp, basic metadata)
   - Click to open trace in tab

3. **Trace Detail Tab Viewer**
   - Tree view showing hierarchical span structure
   - Expandable spans with input/output display
   - Clear visual hierarchy (agent → processor → tool → LLM)
   - Color-coding for different span types

4. **Basic Navigation**
   - Multiple traces open in separate tabs
   - Standard VSCode tab navigation
   - Search within trace tree

**What's NOT in MVP:**
- No timeline/Gantt view (tree only)
- No AI analysis or prompt suggestions
- No auto-capture or local storage
- No annotations or notes
- No trace diffing or comparison tools
- No jump-to-code integration

### Growth Features (Post-MVP)

**Make it competitive after proving core value:**

1. **Multiple View Modes**
   - Timeline view (Gantt chart visualization)
   - Table view (sortable, filterable spans)
   - JSON view (raw trace data)

2. **Enhanced Trace List**
   - Rich preview (agent name, duration, cost, status)
   - Grouping and organization (by date, agent, status)
   - Pin important traces
   - Search and filter capabilities

3. **Developer Productivity**
   - Persistent annotations on spans
   - Keyboard shortcuts for navigation
   - Trace minimap for long traces
   - Copy/export utilities

4. **Metrics and Insights**
   - Summary header (duration, cost, tool calls, errors)
   - Performance highlights
   - Pattern detection (repeated calls, slow operations)

### Vision (Future)

**Dream version of the product:**

1. **AI-Powered Insights**
   - Prompt Analyzer: suggests prompt improvements based on trace behavior
   - Pattern detection: automatically identifies issues like repeated tool calls
   - Learning feedback: "Your prompt is ambiguous about X, try specifying Y"

2. **Automatic Trace Capture**
   - Zero-config auto-capture of local Mastra runs
   - Git-like trace history (`.mastra-traces/` storage)
   - Time-machine navigation through past runs

3. **Advanced Comparison**
   - Trace diffing: visual comparison between trace versions
   - "What changed?" analysis between working and broken traces
   - Regression detection

4. **Code Integration**
   - Jump-to-code: bidirectional navigation between spans and source
   - Inline trace references in code
   - Stack trace integration
