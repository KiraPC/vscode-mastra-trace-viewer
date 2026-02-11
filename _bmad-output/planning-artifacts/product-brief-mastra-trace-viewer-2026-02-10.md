---
stepsCompleted: [1, 2]
inputDocuments: 
  - "_bmad-output/brainstorming/brainstorming-session-2026-02-10.md"
date: 2026-02-10
author: Pasquale
---

# Product Brief: mastra-trace-viewer

## Executive Summary

**Mastra Trace Viewer** is a native VSCode extension that brings professional trace visualization and debugging capabilities directly into the developer's primary workspace. It connects to Mastra framework instances via API, displays telemetry traces in familiar VSCode UI patterns (sidebar lists, document tabs), and provides AI-powered insights to help developers understand and optimize their AI agent behaviors.

Unlike generic trace viewers that require context switching to external browsers or platforms, Mastra Trace Viewer integrates seamlessly into the VSCode development environment where Mastra developers already spend their time coding, testing, and debugging. The extension transforms trace analysis from a separate observability task into a natural part of the development workflow.

**Key Value Proposition:** The first and only VSCode-native trace viewer purpose-built for Mastra, enabling developers to debug AI agent behavior, optimize prompts, and understand complex span hierarchies without ever leaving their editor.

---

## Core Vision

### Problem Statement

Developers building AI agents with the Mastra framework face significant challenges in understanding and debugging their agent behaviors:

1. **Lack of Native Tooling**: No trace viewer exists that integrates directly with VSCode, forcing developers to export traces manually and view them in external browsers or platforms
2. **Context Switching Overhead**: Moving between code editor and separate trace visualization tools breaks flow and slows debugging cycles
3. **Complex Hierarchies**: Mastra traces contain deeply nested spans (agent runs → processors → tool calls → LLM interactions) that are difficult to navigate without specialized visualization
4. **Prompt Engineering Blindness**: When agents behave unexpectedly (e.g., calling the same tool multiple times), developers lack insights into WHY the behavior occurred and HOW to improve their prompts
5. **Trace History Loss**: Without automatic capture, developers lose context between runs, making it hard to compare "what worked yesterday" vs "what's broken today"

### Problem Impact

**For Individual Developers:**
- Lost productivity from constant context switching between editor and external trace viewers
- Difficulty identifying root causes in complex agent behavior chains
- Inability to systematically improve prompts based on trace evidence
- Frustration from manual export/import workflows that interrupt dev flow

**For Development Teams:**
- Inconsistent debugging approaches across team members
- Difficult to share and collaborate on specific trace insights
- Lack of historical trace data for troubleshooting regressions
- Steep learning curve for new team members trying to understand agent behaviors

**Business Impact:**
- Slower iteration cycles on AI agent development
- Higher token costs from unoptimized agent behaviors that go unnoticed
- Reduced developer satisfaction and productivity

### Why Existing Solutions Fall Short

**Generic Trace Viewers (Jaeger, Zipkin, etc.):**
- Not Mastra-aware: Don't understand Mastra-specific concepts like agents, processors, or prompt engineering context
- Require export/import: No direct API integration with Mastra instances
- Browser-based: Force context switching away from VSCode
- Missing AI-specific insights: Can't analyze prompt quality or suggest improvements

**Mastra Cloud Observability:**
- Cloud-only: Requires cloud deployment, not available for local development
- Separate platform: Still requires leaving VSCode environment
- Not integrated with code: No bidirectional linking between trace spans and source code

**VSCode Debug Panel:**
- Not designed for traces: Shows call stacks, not telemetry span hierarchies
- No time-based visualization: Can't show duration, parallelism, or timing relationships
- No persistence: Debugging sessions are ephemeral, can't review past runs

### Proposed Solution

**Mastra Trace Viewer** brings professional trace visualization natively into VSCode through:

**Core Architecture:**
- **Mastra API Integration**: Direct connection to Mastra instances (configurable endpoint) via telemetry APIs
- **Native VSCode UI**: Leverages VSCode's sidebar (trace list) and document tabs (trace detail viewer)
- **Refresh-based Updates**: Simple refresh button to pull latest traces from connected Mastra instance

**Primary Capabilities:**

1. **Trace List Sidebar**
   - Browse all traces from connected Mastra instance
   - Rich preview info: agent name, duration, cost, error status, input summary
   - Grouping by date, agent type, or custom folders
   - Pin important "golden" traces for quick reference
   - Refresh button to sync latest traces

2. **Trace Detail Tab Viewer**
   - Click trace → opens in VSCode tab like a document
   - Multiple view modes: Tree (hierarchical), Timeline (Gantt), Table (sortable), JSON (raw)
   - Color-coded spans by type: agents, processors, tools, LLM calls, errors
   - Inline expandable details: click span to see full input/output/metadata
   - Metrics summary header: duration, cost, tool calls, LLM calls, error count
   - In-trace search: find specific spans, tools, or text in inputs/outputs
   - Minimap for long traces: visual overview with click-to-navigate

3. **Developer Productivity Features**
   - Persistent annotations: add notes to specific spans, saved locally
   - Multiple open tabs: compare traces side-by-side
   - Keyboard shortcuts: navigate spans, toggle views, search
   - Copy/export utilities: extract JSON, input/output, or reproducer code snippets

**Future Vision (Phase 2+):**
- AI Prompt Analyzer: Automatic suggestions for improving prompts based on trace behavior patterns
- Zero-config auto-capture: Automatic local trace recording for Git-like history
- Trace diffing: Visual comparison between trace versions to see behavior changes
- Jump-to-code: Bidirectional navigation between trace spans and source code definitions

### Key Differentiators

**1. VSCode-Native by Design**
- First and only trace viewer built specifically as a VSCode extension
- Uses familiar VSCode UI patterns (tabs, sidebars, panels) that developers already know
- No context switching, no external browsers, no separate platforms
- Integrated keyboard shortcuts and commands that fit VSCode workflows

**2. Mastra-Aware Intelligence**
- Purpose-built for Mastra's specific trace structure and concepts
- Understands agents, processors, workflows, and their relationships
- Future AI insights tailored to Mastra's prompt engineering patterns
- Speaks the language of Mastra developers, not generic observability

**3. Developer-First Workflow**
- Optimized for the debug-iterate-test cycle of AI development
- Simple refresh model (not real-time complexity)
- Tab-based navigation matches how developers work with files
- Annotations and pinning support knowledge capture during debugging

**4. Zero External Dependencies**
- No cloud account required
- No additional infrastructure to deploy
- Works with local Mastra instances during development
- Configurable endpoint means works with any Mastra deployment

**5. Practical Over Fancy**
- Focused on core use cases that solve real problems
- No over-engineering with unnecessary visualizations
- Proven UX patterns adapted from Chrome DevTools, Git tools, and VSCode itself
- Built for daily use, not impressive demos

---

