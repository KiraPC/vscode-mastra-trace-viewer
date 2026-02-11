---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
status: 'complete'
completedAt: '2026-02-10'
---

# mastra-trace-viewer - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for mastra-trace-viewer, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1: Mastra API Integration**
- Configurable endpoint connection to Mastra instances (local dev + deployed)
- HTTP client for fetching trace lists via Mastra Telemetry/Observability APIs
- Refresh mechanism for pulling latest traces on-demand
- Connection state management and error handling

**FR2: Trace List Sidebar**
- VSCode TreeView displaying available traces from connected instance
- Basic trace metadata display (traceId, timestamp, status)
- Click-to-open interaction opening trace in document tab
- Refresh button for sync with Mastra API

**FR3: Trace Detail Viewer**
- Hierarchical tree visualization of span structure
- Expandable/collapsible span nodes showing input/output data
- Visual hierarchy: agent_run → processor_run → tool_streaming → LLM calls
- Color-coded span types for quick visual scanning
- Search functionality within trace tree

**FR4: Navigation & Multi-Tab Support**
- Multiple traces open simultaneously in separate tabs
- Standard VSCode tab management (close, reorder, split)
- Tab navigation via keyboard shortcuts
- Preservation of expand/collapse state per trace

### Non-Functional Requirements

**NFR1: Performance**
- Responsive rendering for traces with 50-200 spans
- Handle up to 500 spans gracefully
- Search operations must be fast and responsive

**NFR2: Reliability**
- Graceful degradation on network failures
- Handle malformed trace data without crashing
- API unavailability should not break the extension
- No data loss during normal operations

**NFR3: VSCode Native Integration**
- Follow VSCode extension best practices
- Proper lifecycle management (activate/deactivate)
- Resource cleanup on deactivation
- Standard VSCode UI patterns

**NFR4: Zero External Dependencies**
- No cloud services required
- No external infrastructure beyond Mastra instance
- Self-contained extension

**NFR5: Developer Workflow**
- No context switching from VSCode
- Seamless integration with existing workflows
- Time from "run agent" to "understand behavior" is minimized

### Additional Requirements

**Technology Stack Requirements:**
- **Starter Template**: Official VSCode Extension Generator with TypeScript
- TypeScript in strict mode for type safety
- Svelte 5 for webview UI components
- Vite for webview build pipeline + esbuild for extension build
- Vitest for unit tests + @vscode/test-electron for integration tests
- **Mastra official client** for API integration (replaces custom axios implementation)
- svelte-virtual-list for virtual scrolling performance

**Architecture Requirements:**
- In-memory cache with LRU eviction for trace data
- PostMessage protocol for extension ↔ webview communication
- Lazy activation on view open (onView:mastraTraceList)
- Dual build system (extension: esbuild, webview: Vite)
- Type-safe message protocol using discriminated unions
- Tree pre-building and caching for performance
- 300ms debouncing for search operations
- Mastra client handles connection, authentication, and retry logic

**Code Organization Requirements:**
- Modular architecture with clear boundaries
- Separation of concerns: api/, providers/, utils/, webview/, models/
- Dependency direction: Extension → Providers → Utils → Models
- No circular dependencies
- Test files co-located with implementation

**Security Requirements:**
- Webview content security policy (CSP)
- Safe rendering of user-provided input/output data
- Prevention of XSS in trace data display

### FR Coverage Map

**FR1 (Mastra API Integration):** Epic 1 - Connection & Extension Foundation
- Configurable endpoint connection
- HTTP client with Mastra official client
- Refresh mechanism
- Error handling

**FR2 (Trace List Sidebar):** Epic 2 - Trace List Discovery
- VSCode TreeView display
- Metadata display (traceId, timestamp, status)
- Click-to-open interaction
- Refresh button

**FR3 (Trace Detail Viewer):** Epic 3 - Single Trace Visualization + Epic 4 - Performance & Multi-Tab Support + Epic 5 - Trace Search & Navigation
- Hierarchical tree visualization (Epic 3)
- Expandable/collapsible spans (Epic 3)
- Visual hierarchy and color-coding (Epic 3)
- Performance for large traces (Epic 4)
- Search functionality (Epic 5)

**FR4 (Navigation & Multi-Tab Support):** Epic 4 - Performance & Multi-Tab Support
- Multiple traces in separate tabs
- Standard VSCode tab management
- Keyboard shortcuts
- State preservation

## Epic List

### Epic 1: Mastra Connection & Extension Foundation
Developers can install and configure the extension to connect to their Mastra instance, enabling trace data access from within VSCode.

**User Outcome:** Extension is installed, configured, and successfully connected to Mastra instance

**FRs covered:** FR1 (Mastra API Integration)

**NFRs covered:** NFR3 (VSCode Native Integration), NFR4 (Zero External Dependencies)

**Implementation Notes:**
- Uses official VSCode Extension Generator as starter template
- TypeScript strict mode, dual build system (esbuild + Vite)
- Uses official Mastra client for API integration (handles connection, auth, retry logic)
- Lazy activation on view open
- Workspace-level configuration for Mastra endpoint

---

### Epic 2: Trace List Discovery
Developers can view and refresh the list of available traces from their connected Mastra instance in the VSCode sidebar.

**User Outcome:** Developers see all available traces in sidebar and can refresh to get latest

**FRs covered:** FR2 (Trace List Sidebar)

**NFRs covered:** NFR2 (Reliability - graceful error handling), NFR5 (Developer Workflow)

**Implementation Notes:**
- VSCode TreeView with TreeDataProvider
- In-memory LRU cache for trace metadata
- Refresh command (Mastra client handles retry logic)
- Error notifications for connection failures

---

### Epic 3: Single Trace Visualization
Developers can open a trace in a tab and explore the hierarchical span structure with expand/collapse and detailed input/output data.

**User Outcome:** Developers view detailed span hierarchies, expand/collapse nodes, see input/output data for single traces

**FRs covered:** FR3 (Trace Detail Viewer - hierarchical tree, expand/collapse, color-coding, input/output display)

**NFRs covered:** NFR2 (Reliability), NFR5 (Developer Workflow)

**Implementation Notes:**
- Svelte 5 webview with PostMessage protocol
- Color-coded span types for visual hierarchy
- Expandable/collapsible tree nodes
- Input/output panel for span details

---

### Epic 4: Performance & Multi-Tab Support
Developers can handle large traces (500+ spans) with smooth performance and open multiple traces simultaneously for comparison.

**User Outcome:** Smooth performance with large traces and ability to work with multiple traces at once

**FRs covered:** FR3 (Performance for large traces), FR4 (Navigation & Multi-Tab Support)

**NFRs covered:** NFR1 (Performance), NFR5 (Developer Workflow)

**Implementation Notes:**
- Virtual scrolling for large traces (50-500 spans)
- Multiple webview panels for multi-tab support
- State preservation per trace
- Tab management and navigation

---

### Epic 5: Trace Search & Navigation
Developers can search within traces to quickly find specific spans, data, or patterns in their agent execution.

**User Outcome:** Developers quickly locate relevant information within large traces

**FRs covered:** FR3 (Search functionality within trace tree)

**NFRs covered:** NFR1 (Performance - search must be fast)

**Implementation Notes:**
- Client-side full-text search across all span properties
- 300ms debouncing for responsive typing
- Highlight matching spans
- Prev/Next navigation through results

---

## Epic 1: Mastra Connection & Extension Foundation

Developers can install and configure the extension to connect to their Mastra instance, enabling trace data access from within VSCode.

### Story 1.1: Initialize VSCode Extension Project

As a developer setting up the project,
I want to initialize the VSCode extension with the official generator and configure the build system,
So that I have a working foundation for development.

**Acceptance Criteria:**

**Given** I have Node.js and npm installed
**When** I run the official VSCode extension generator with TypeScript option
**Then** The project is created with standard extension structure
**And** package.json contains required VSCode engine version
**And** Extension activation event is configured for lazy loading (onView:mastraTraceList)

**Given** The base extension project is initialized
**When** I configure the dual build system (esbuild for extension, Vite for webview)
**Then** build/ directory contains vite.config.ts and esbuild configuration
**And** package.json scripts include separate build commands for extension and webview
**And** TypeScript is configured with strict mode enabled

**Given** The build system is configured
**When** I run npm install
**Then** All dependencies are installed successfully
**And** Development dependencies include: vite, @sveltejs/vite-plugin-svelte, svelte, vitest, @vscode/test-electron
**And** The project builds without errors

**Given** The extension builds successfully
**When** I press F5 in VSCode to launch Extension Development Host
**Then** A new VSCode window opens with the extension loaded
**And** The extension activates without errors
**And** Extension contributes the Mastra Traces view to the sidebar

---

### Story 1.2: Configure Mastra Client Integration

As a developer,
I want to integrate the official Mastra client into the extension,
So that I can connect to Mastra instances programmatically.

**Acceptance Criteria:**

**Given** The extension project is initialized
**When** I install the official Mastra client package
**Then** The Mastra client is added to package.json dependencies
**And** TypeScript types are available for the Mastra client

**Given** The Mastra client is installed
**When** I create a MastraClientWrapper class in src/api/MastraClientWrapper.ts
**Then** The wrapper initializes the Mastra client with configurable endpoint
**And** The wrapper provides methods: fetchTraces(), fetchTraceById(id)
**And** The wrapper handles client errors and transforms them to typed errors

**Given** The MastraClientWrapper is implemented
**When** I create unit tests for the wrapper in src/api/MastraClientWrapper.test.ts
**Then** Tests verify successful connection initialization
**And** Tests verify fetchTraces() returns expected data structure
**And** Tests verify fetchTraceById() returns trace details
**And** Tests verify error handling for network failures

**Given** The wrapper and tests are complete
**When** I run npm test
**Then** All Mastra client wrapper tests pass
**And** The wrapper is ready for integration with VSCode providers

---

### Story 1.3: Workspace Configuration Settings

As a developer using the extension,
I want to configure my Mastra endpoint in VSCode settings,
So that the extension knows which Mastra instance to connect to.

**Acceptance Criteria:**

**Given** The extension is installed
**When** I open VSCode settings (UI or settings.json)
**Then** I see "Mastra Trace Viewer" section in the extensions category
**And** There is a "mastraTraceViewer.endpoint" setting with description
**And** The default value is "http://localhost:4111"

**Given** The settings contribution is defined in package.json
**When** I create ConfigurationManager in src/utils/configManager.ts
**Then** ConfigurationManager provides getEndpoint() method
**And** getEndpoint() checks workspace settings first, then user settings
**And** getEndpoint() returns a validated URL or throws descriptive error

**Given** ConfigurationManager is implemented
**When** I modify mastraTraceViewer.endpoint in workspace settings
**Then** ConfigurationManager.getEndpoint() returns the updated value
**And** Invalid URLs (missing protocol, malformed) are rejected with clear error message

**Given** Configuration changes occur
**When** I implement onDidChangeConfiguration listener in extension.ts
**Then** The listener detects changes to mastraTraceViewer.endpoint
**And** The MastraClientWrapper reinitializes with new endpoint
**And** A notification informs the user that reconnection is in progress

**Given** ConfigurationManager is complete
**When** I create unit tests in src/utils/configManager.test.ts
**Then** Tests verify workspace settings override user settings
**And** Tests verify URL validation rejects invalid endpoints
**And** All configuration tests pass

---

### Story 1.4: Connection State Management & Error Handling

As a developer using the extension,
I want to see clear feedback when connection succeeds or fails,
So that I can troubleshoot connection issues quickly.

**Acceptance Criteria:**

**Given** The extension activates
**When** The Mastra client attempts to connect to the configured endpoint
**Then** A status bar item shows "Mastra: Connecting..."
**And** The connection attempt times out after 10 seconds if no response

**Given** Connection succeeds
**When** The Mastra client successfully connects to the instance
**Then** Status bar updates to "Mastra: Connected" with green indicator
**And** No error notification is shown
**And** Trace list view becomes available in the sidebar

**Given** Connection fails due to network error
**When** The Mastra client cannot reach the endpoint
**Then** Status bar shows "Mastra: Disconnected" with red indicator
**And** Error notification displays: "Cannot connect to Mastra at [endpoint]. Check your network and endpoint configuration."
**And** User can click notification action "Open Settings" to adjust endpoint

**Given** Connection fails due to invalid endpoint configuration
**When** The configured endpoint URL is malformed or invalid
**Then** Error notification displays: "Invalid Mastra endpoint: [endpoint]. Please check your settings."
**And** Status bar shows "Mastra: Configuration Error"
**And** User can click "Open Settings" to correct the endpoint

**Given** Connection state is implemented
**When** I create ConnectionStateManager in src/utils/connectionStateManager.ts
**Then** ConnectionStateManager tracks state: Connecting, Connected, Disconnected, Error
**And** ConnectionStateManager updates status bar item based on state
**And** ConnectionStateManager provides methods: connect(), disconnect(), getState()

**Given** Error handling is implemented
**When** I create custom error types in src/models/errors.types.ts
**Then** MastraConnectionError includes: code (NETWORK, TIMEOUT, INVALID_CONFIG), message, endpoint
**And** Error messages are user-friendly and actionable
**And** Errors are logged to VSCode output channel "Mastra Trace Viewer"

**Given** Connection state management is complete
**When** I test the extension in Development Host
**Then** Connecting to valid endpoint shows success state
**And** Connecting to invalid endpoint shows appropriate error
**And** Changing settings triggers reconnection with status updates
**And** All error scenarios are handled gracefully without crashes

---

## Epic 2: Trace List Discovery

Developers can view and refresh the list of available traces from their connected Mastra instance in the VSCode sidebar.

### Story 2.1: Trace List TreeView Provider

As a developer,
I want to see a "Mastra Traces" view in the VSCode sidebar,
So that I have a dedicated place to view my traces.

**Acceptance Criteria:**

**Given** The extension is installed and activated
**When** I open the VSCode sidebar
**Then** I see a "Mastra Traces" view container in the activity bar
**And** The view is registered in package.json contributions
**And** The view icon is appropriate for trace/telemetry visualization

**Given** The view container exists
**When** I create TraceListProvider in src/providers/TraceListProvider.ts
**Then** TraceListProvider implements vscode.TreeDataProvider<TraceTreeItem>
**And** TraceListProvider has _onDidChangeTreeData EventEmitter for refresh capability
**And** TraceListProvider provides getTreeItem() and getChildren() methods

**Given** TraceListProvider is implemented
**When** I register the provider in extension.ts activate() function
**Then** vscode.window.registerTreeDataProvider('mastraTraceList', provider) is called
**And** The provider is added to context.subscriptions for proper cleanup
**And** The view appears empty initially with message "Click refresh to load traces"

**Given** The TreeView is registered
**When** I click on the Mastra Traces view in the sidebar
**Then** The view expands and shows the empty state
**And** A refresh button appears in the view title toolbar
**And** No errors occur during view activation

---

### Story 2.2: Fetch and Display Trace List

As a developer,
I want to see the list of available traces from my Mastra instance,
So that I know what traces are available to analyze.

**Acceptance Criteria:**

**Given** The Mastra Traces view is visible
**When** I click the refresh button in the view toolbar
**Then** The extension calls MastraClientWrapper.fetchTraces()
**And** A loading indicator appears while fetching

**Given** The Mastra client is connected
**When** fetchTraces() successfully retrieves trace data
**Then** Each trace is transformed into a TraceTreeItem
**And** TraceTreeItem contains: id, label (traceId), timestamp, iconPath
**And** The tree view displays all traces in reverse chronological order (newest first)

**Given** Traces are displayed
**When** I look at the trace list
**Then** Each trace item shows the traceId as the label
**And** The timestamp is formatted in a human-readable way (e.g., "2 hours ago", "Jan 10, 3:45 PM")
**And** Each trace has an appropriate icon indicating its status

**Given** The fetch request fails
**When** MastraClientWrapper.fetchTraces() throws a connection error
**Then** An error notification displays: "Failed to fetch traces: [error message]"
**And** The tree view shows an empty state with "Failed to load. Click refresh to retry."
**And** The error is logged to the output channel

**Given** No traces exist
**When** fetchTraces() returns an empty array
**Then** The tree view displays message "No traces found. Run your Mastra agents to generate traces."
**And** No error is shown (this is a valid state)

---

### Story 2.3: Refresh Trace List

As a developer,
I want to refresh the trace list on demand,
So that I can see newly created traces without restarting VSCode.

**Acceptance Criteria:**

**Given** The Mastra Traces view is open
**When** I click the refresh button in the view toolbar
**Then** The mastra-trace-viewer.refresh-traces command is executed
**And** TraceListProvider.refresh() method is called
**And** _onDidChangeTreeData.fire(undefined) triggers tree reload

**Given** Refresh is triggered
**When** The tree view reloads
**Then** MastraClientWrapper.fetchTraces() is called again
**And** The tree view updates with the latest trace list
**And** Previously displayed traces are replaced with fresh data

**Given** I have traces cached
**When** I refresh and new traces are available
**Then** New traces appear at the top of the list
**And** The list automatically scrolls to show the newest traces
**And** A status bar notification briefly shows "Traces refreshed" (auto-dismisses after 2s)

**Given** Refresh is in progress
**When** I click the refresh button again before the first refresh completes
**Then** The second request is ignored (debounced)
**And** A notification says "Refresh already in progress"
**And** No duplicate requests are sent to the Mastra API

**Given** The refresh command is registered
**When** I open the command palette (Cmd/Ctrl+Shift+P)
**Then** I can find and execute "Mastra: Refresh Traces" command
**And** The command triggers the same refresh behavior as the button

---

### Story 2.4: Trace Metadata Display & Caching

As a developer,
I want to see useful metadata for each trace (ID, timestamp, status),
So that I can identify which trace I want to open.

**Acceptance Criteria:**

**Given** Traces are fetched from Mastra
**When** I create TraceCache in src/utils/traceCache.ts
**Then** TraceCache implements LRU (Least Recently Used) cache with max 100 entries
**And** TraceCache provides methods: set(id, trace), get(id), has(id), clear()
**And** TraceCache evicts oldest entries when capacity is exceeded

**Given** TraceCache is implemented
**When** Traces are fetched successfully
**Then** Each trace is stored in TraceCache with traceId as key
**And** Full trace data is cached for future retrieval
**And** Cache prevents redundant API calls for recently viewed traces

**Given** Traces are displayed in the tree view
**When** I look at each trace item
**Then** The label shows the traceId (truncated if longer than 40 characters)
**And** The description shows relative timestamp (e.g., "5 minutes ago")
**And** The tooltip shows full trace information: full traceId, exact timestamp, status

**Given** Trace metadata includes status information
**When** A trace has status "success"
**Then** The trace icon is green checkmark
**When** A trace has status "error"
**Then** The trace icon is red X
**When** A trace has status "running" or "pending"
**Then** The trace icon is yellow spinner/hourglass
**When** Status is unknown or missing
**Then** The trace icon is default blue document icon

**Given** Multiple traces exist
**When** Traces are sorted in the tree view
**Then** Traces are ordered by timestamp descending (newest first)
**And** Traces from today show relative time (e.g., "2 hours ago")
**And** Traces older than today show absolute date (e.g., "Feb 9, 2:30 PM")

**Given** TraceCache is implemented
**When** I create unit tests in src/utils/traceCache.test.ts
**Then** Tests verify LRU eviction when capacity exceeded
**And** Tests verify set/get/has operations
**And** Tests verify clear()

---

## Epic 3: Single Trace Visualization

Developers can open a trace in a tab and explore the hierarchical span structure with expand/collapse and detailed input/output data.

### Story 3.1: Open Trace in Webview Tab

As a developer,
I want to click on a trace in the sidebar to open it in a new tab,
So that I can view the trace details.

**Acceptance Criteria:**

**Given** Traces are displayed in the sidebar
**When** I click on a trace item
**Then** The mastra-trace-viewer.open-trace command is executed with traceId parameter
**And** A new webview panel opens with title "Trace: [traceId]"

**Given** The open-trace command is triggered
**When** The trace is already in TraceCache
**Then** The cached trace data is used immediately
**And** No API call is made

**Given** The trace is not in cache
**When** The open-trace command is triggered
**Then** MastraClientWrapper.fetchTraceById(traceId) is called
**And** A loading indicator shows "Loading trace..." in the webview
**And** Once loaded, the trace is stored in TraceCache

**Given** The trace data is fetched
**When** I create TraceViewerPanel in src/providers/TraceViewerPanel.ts
**Then** TraceViewerPanel manages webview panel lifecycle
**And** TraceViewerPanel creates webview with HTML content
**And** TraceViewerPanel sends trace data to webview via postMessage

**Given** Trace fetch fails
**When** MastraClientWrapper.fetchTraceById() throws an error
**Then** Error notification displays: "Failed to load trace: [error message]"
**And** The webview shows error state with retry button
**And** The error is logged to output channel

---

### Story 3.2: Webview Foundation with Svelte

As a developer,
I want a rich UI for viewing trace details,
So that I can interact with the trace data effectively.

**Acceptance Criteria:**

**Given** The project has Vite configured for webview build
**When** I create src/webview/main.ts as the entry point
**Then** main.ts initializes the Svelte app
**And** main.ts sets up message handler for extension communication
**And** Vite bundles the webview to out/webview/

**Given** Webview entry point exists
**When** I create src/webview/App.svelte as root component
**Then** App.svelte receives trace data from extension via window.addEventListener('message')
**And** App.svelte displays loading state initially
**And** App.svelte handles error states with user-friendly messages

**Given** Message protocol is defined in src/models/messages.types.ts
**When** Extension sends { type: 'loadTrace', payload: Trace }
**Then** Webview updates its state with the trace data
**And** TypeScript types ensure type safety across the boundary

**Given** Webview needs to communicate with extension
**When** I create src/webview/utils/messageHandler.ts
**Then** messageHandler provides sendMessage() function
**And** sendMessage uses vscode.postMessage() (VSCode webview API)
**And** All messages follow the discriminated union protocol

**Given** Webview HTML is required
**When** TraceViewerPanel creates webview content
**Then** HTML includes proper Content Security Policy (CSP)
**And** HTML loads the Vite-built webview bundle (main.js)
**And** HTML uses VSCode webview API script for communication
**And** HTML includes meta tags for proper viewport and charset

**Given** Svelte stores are needed for state management
**When** I create src/webview/stores/traceStore.ts
**Then** traceStore is a writable store holding current Trace | null
**And** Setting the trace triggers reactive updates in components

---

### Story 3.3: Hierarchical Span Tree Display

As a developer,
I want to see spans organized in a hierarchical tree structure,
So that I can understand the execution flow of my agent.

**Acceptance Criteria:**

**Given** Trace data is available
**When** I create src/utils/spanTreeBuilder.ts
**Then** spanTreeBuilder.buildTree(spans[]) converts flat span array to tree structure
**And** buildTree uses parentSpanId to construct parent-child relationships
**And** Root spans (no parentSpanId) are top-level nodes
**And** Tree structure is SpanTreeNode[] with children arrays

**Given** SpanTreeNode is defined in src/models/tree.types.ts
**When** I examine the interface
**Then** SpanTreeNode includes: spanId, name, type, startTime, endTime, children: SpanTreeNode[]
**And** SpanTreeNode includes: input, output, attributes, status
**And** Type definitions match Mastra span structure

**Given** Tree is built
**When** I create src/webview/components/SpanTree.svelte
**Then** SpanTree receives the tree structure as a prop
**And** SpanTree renders each node recursively
**And** SpanTree displays span name and type for each node

**Given** SpanTree component exists
**When** I create src/webview/components/SpanNode.svelte
**Then** SpanNode renders individual span information
**And** SpanNode displays: span icon, span name, duration
**And** SpanNode is styled with proper indentation for hierarchy level

**Given** Spans have different types (agent_run, processor_run, tool_streaming, llm_call)
**When** The tree is rendered
**Then** Each span type has a distinct icon
**And** Visual hierarchy is clear through indentation and styling
**And** Parent-child relationships are visually obvious

**Given** Tree builder is implemented
**When** I create unit tests in src/utils/spanTreeBuilder.test.ts
**Then** Tests verify correct tree construction from flat spans
**And** Tests handle orphaned spans (parentSpanId not found)
**And** Tests verify multiple root spans scenario
**And** All tree builder tests pass

---

### Story 3.4: Expand/Collapse Span Nodes

As a developer,
I want to expand and collapse span nodes,
So that I can focus on relevant parts of the trace.

**Acceptance Criteria:**

**Given** The span tree is rendered
**When** A span has children
**Then** An expand/collapse icon appears next to the span
**And** The icon indicates current state (▶ collapsed, ▼ expanded)

**Given** A span is collapsed by default
**When** I click on the expand icon
**Then** The span's children become visible
**And** The icon changes to indicate expanded state
**And** Animation smoothly reveals the children

**Given** A span is expanded
**When** I click on the collapse icon
**Then** The span's children are hidden
**And** The icon changes to indicate collapsed state
**And** Animation smoothly hides the children

**Given** UI state needs to be tracked
**When** I create src/webview/stores/uiStore.ts
**Then** uiStore includes expandedSpans: writable<Set<string>>
**And** expandedSpans stores spanIds of currently expanded nodes
**And** SpanNode component reads from and updates expandedSpans

**Given** Nested spans exist (grandchildren, great-grandchildren)
**When** I collapse a parent span
**Then** All descendant spans are hidden
**And** Their expanded state is preserved (when parent re-expands, children state is maintained)

**Given** A large tree exists
**When** I want to expand all nodes
**Then** A "Expand All" button is available in the toolbar
**And** Clicking it expands all spans in the tree

**Given** All nodes are expanded
**When** I want to collapse all nodes
**Then** A "Collapse All" button is available in the toolbar
**And** Clicking it collapses all spans to show only root level

**Given** Expand/collapse state is working
**When** I test keyboard navigation
**Then** Arrow keys navigate between spans
**And** Right arrow expands collapsed spans
**And** Left arrow collapses expanded spans
**And** Up/Down arrows move between visible spans

---

### Story 3.5: Span Details Panel (Input/Output)

As a developer,
I want to see the input and output data for each span,
So that I can understand what data was passed and returned.

**Acceptance Criteria:**

**Given** The span tree is rendered
**When** I click on a span node (not the expand icon)
**Then** The span is selected (highlighted)
**And** A details panel appears showing span information

**Given** I create src/webview/components/SpanDetails.svelte
**When** A span is selected
**Then** SpanDetails receives the selected span data as a prop
**And** SpanDetails displays: span name, type, status, duration
**And** SpanDetails shows formatted timestamps (start, end)

**Given** SpanDetails component is rendered
**When** The span has input data
**Then** An "Input" section displays the input data
**And** Input data is formatted as JSON with syntax highlighting
**And** Large input is truncated with "Show more" expansion

**Given** SpanDetails component is rendered
**When** The span has output data
**Then** An "Output" section displays the output data
**And** Output data is formatted as JSON with syntax highlighting
**And** Large output is truncated with "Show more" expansion

**Given** SpanDetails displays JSON data
**When** JSON is complex or deeply nested
**Then** JSON is pretty-printed with proper indentation
**And** JSON can be collapsed/expanded at each nesting level
**And** A "Copy" button allows copying the JSON to clipboard

**Given** SpanDetails is visible
**When** The span has attributes or metadata
**Then** An "Attributes" section shows key-value pairs
**And** Attributes include: entityType, entityId, custom attributes
**And** Each attribute is clearly labeled

**Given** SpanDetails layout is designed
**When** The panel is displayed
**Then** Panel appears on the right side or bottom (configurable)
**And** Panel is resizable via draggable divider
**And** Panel can be closed via X button, showing tree in full width

**Given** No span is selected
**When** SpanDetails would render
**Then** A placeholder message shows "Select a span to view details"
**And** The panel provides instructions for navigation

---

### Story 3.6: Color-Coded Span Types

As a developer,
I want different span types to have distinct colors,
So that I can quickly identify agent runs, tool calls, and LLM calls.

**Acceptance Criteria:**

**Given** Span types are defined (agent_run, processor_run, tool_streaming, llm_call, custom)
**When** I create color scheme in src/webview/styles/global.css
**Then** Each span type has a distinct color defined as CSS variable
**And** Colors follow VSCode theme guidelines (light/dark mode compatible)

**Given** Color scheme is defined
**When** agent_run spans are rendered
**Then** They display with blue accent color (#0078d4 or VSCode primary)
**And** Icon is a "person" or "robot" symbol

**Given** Color scheme is defined
**When** processor_run spans are rendered
**Then** They display with purple accent color (#8b5cf6)
**And** Icon is a "gear" or "cog" symbol

**Given** Color scheme is defined
**When** tool_streaming spans are rendered
**Then** They display with green accent color (#10b981)
**And** Icon is a "wrench" or "tool" symbol

**Given** Color scheme is defined
**When** llm_call spans are rendered
**Then** They display with orange accent color (#f59e0b)
**And** Icon is a "brain" or "sparkle" symbol

**Given** Color scheme is defined
**When** custom or unknown span types are rendered
**Then** They display with gray accent color (neutral)
**And** Icon is a generic "box" symbol

**Given** Spans are colored
**When** I look at the tree visualization
**Then** Color is applied to: span icon, left border, type badge
**And** Color intensity reduces for nested spans to maintain hierarchy clarity
**And** Selected span has highlighted background regardless of color

**Given** VSCode theme changes (light to dark or vice versa)
**When** The webview receives theme update
**Then** Colors adapt to maintain contrast and readability
**And** CSS variables use var(--vscode-*) for theme compatibility

**Given** Color coding is implemented
**When** A span has error status
**Then** Error indicator (red icon or badge) is shown regardless of type color
**And** Error takes visual precedence while maintaining type color

---

## Epic 4: Performance & Multi-Tab Support

Developers can handle large traces (500+ spans) with smooth performance and open multiple traces simultaneously for comparison.

### Story 4.1: Virtual Scrolling for Large Traces

As a developer,
I want smooth scrolling even with 500+ span traces,
So that the UI remains responsive with large traces.

**Acceptance Criteria:**

**Given** The project has svelte-virtual-list dependency
**When** I install svelte-virtual-list package
**Then** The package is added to package.json dependencies
**And** TypeScript types are available for the virtual list component

**Given** SpanTree component exists
**When** I integrate svelte-virtual-list into SpanTree.svelte
**Then** Only visible span nodes are rendered in the DOM
**And** Scroll position determines which nodes are visible
**And** Virtual list calculates item heights dynamically based on expansion state

**Given** A trace has 500+ spans
**When** The trace is loaded in the webview
**Then** Initial render completes in under 1 second
**And** Scrolling is smooth at 60fps
**And** Memory usage remains stable during scrolling

**Given** Virtual scrolling is active
**When** I expand or collapse nodes
**Then** Item heights recalculate correctly
**And** Scroll position adjusts to keep focused node in view
**And** No jumping or flickering occurs

**Given** Virtual scrolling handles item heights
**When** Span nodes have variable heights (due to multi-line names or badges)
**Then** Virtual list accurately measures each item height
**And** Padding and margins are accounted for correctly
**And** Scrollbar size reflects accurate total content height

**Given** A very large trace exists (1000+ spans)
**When** The trace loads
**Then** A warning notification suggests: "Large trace detected. Some features may be slower."
**And** Virtual scrolling handles the load gracefully
**And** User can still navigate and interact without crashes

**Given** Performance needs monitoring
**When** I add performance logging in development mode
**Then** Console logs render time for tree updates
**And** Console logs virtual scrolling metrics
**And** Performance data helps identify bottlenecks

---

### Story 4.2: Multiple Trace Tabs Management

As a developer,
I want to open multiple traces in separate tabs,
So that I can compare or reference multiple traces.

**Acceptance Criteria:**

**Given** TraceViewerPanel manages webview panels
**When** I implement panel tracking in TraceViewerPanel.ts
**Then** A static Map<traceId, WebviewPanel> stores active panels
**And** createOrShow(traceId) checks if panel exists before creating new one
**And** Existing panels are revealed and focused instead of creating duplicates

**Given** A trace is already open in a tab
**When** I click the same trace in the sidebar again
**Then** The existing tab is brought to focus
**And** No duplicate tab is created
**And** The trace data is refreshed in the existing panel

**Given** Multiple traces are open
**When** I look at VSCode tabs
**Then** Each trace tab shows "Trace: [traceId]" as the title
**And** TraceId is truncated if too long (e.g., "Trace: abc123...")
**And** Each tab has the Mastra Traces icon

**Given** Multiple webview panels exist
**When** A panel is closed by the user
**Then** The panel is removed from the tracking Map
**And** Panel.dispose() is called to clean up resources
**And** Closing one panel does not affect other open panels

**Given** Multiple traces are open
**When** Each webview initializes
**Then** Each webview maintains its own independent state
**And** Expanding nodes in one trace doesn't affect others
**And** Each webview has its own traceStore instance

**Given** Tab management is implemented
**When** I switch between trace tabs
**Then** Tab switching is instant (no loading delay)
**And** Each tab maintains its scroll position and expanded state
**And** Active tab is clearly indicated in VSCode UI

**Given** Many traces are open (10+)
**When** I check memory usage
**Then** Inactive webviews are not consuming excessive resources
**And** Switching tabs doesn't cause memory leaks
**And** Closing tabs properly releases memory

---

### Story 4.3: Tab State Preservation

As a developer,
I want my expanded nodes and scroll position preserved per trace,
So that switching between tabs maintains my context.

**Acceptance Criteria:**

**Given** A trace is open and I've expanded some nodes
**When** I switch to a different trace tab
**Then** The expanded state is preserved in memory
**And** Returning to the first tab shows the same expanded nodes

**Given** uiStore maintains expanded spans state
**When** I implement state preservation in the webview
**Then** expandedSpans Set is part of the webview's state
**And** State persists for the lifetime of the webview panel
**And** State is properly initialized when webview loads

**Given** I've scrolled to a specific position in a trace
**When** I switch to another trace tab
**Then** Scroll position is saved
**And** Returning to the first tab restores the scroll position
**And** Selected span (if any) remains selected

**Given** State needs to survive webview reload
**When** VSCode reloads the webview (e.g., window background/foreground)
**Then** Extension sends current state via postMessage on reload
**And** Webview restores: expandedSpans, scrollPosition, selectedSpanId
**And** User sees no difference after reload

**Given** State restoration is implemented
**When** I create a state persistence mechanism
**Then** TraceViewerPanel tracks state per traceId
**And** State includes: Set<spanId> expandedSpans, number scrollPosition, string selectedSpanId
**And** State is serializable for message passing

**Given** Webview receives state restoration message
**When** Message type is 'restoreState' with state payload
**Then** uiStore.expandedSpans is updated with provided Set
**And** Virtual scrolling component scrolls to saved position
**And** Selected span is re-highlighted

**Given** Multiple tabs exist with preserved state
**When** I close and reopen a trace
**Then** State is not preserved (fresh start for reopened trace)
**And** User starts with default collapsed state
**And** This is expected behavior (no persistent storage in MVP)

**Given** State preservation is working
**When** I expand many nodes then switch tabs multiple times
**Then** No memory leaks occur from state tracking
**And** State updates are efficient (no unnecessary re-renders)
**And** User experience is smooth and responsive

---

## Epic 5: Trace Search & Navigation

Developers can search within traces to quickly find specific spans, data, or patterns in their agent execution.

### Story 5.1: Client-Side Search Implementation

As a developer,
I want to search for text within a trace,
So that I can find specific spans or data quickly.

**Acceptance Criteria:**

**Given** A trace is open in the webview
**When** I create src/webview/components/TraceSearch.svelte
**Then** A search input box appears at the top of the trace viewer
**And** Search box has placeholder text "Search spans..."
**And** Search box is styled consistently with VSCode UI

**Given** Search component exists
**When** I create src/webview/utils/searchHelper.ts
**Then** searchHelper provides searchSpans(query, spans) function
**And** searchSpans performs case-insensitive full-text search
**And** Search examines: span name, type, input, output, attributes

**Given** Search helper is implemented
**When** I type in the search box
**Then** Search is debounced with 300ms delay
**And** Search doesn't execute on every keystroke
**And** Previous search requests are cancelled if new input arrives

**Given** I enter a search query
**When** searchSpans executes
**Then** Function returns array of matching spanIds
**And** Function completes in under 100ms for traces with 500 spans
**And** Empty query returns empty results (no matches)

**Given** Search results are found
**When** I create src/webview/stores/searchStore.ts
**Then** searchStore holds: query (string), results (spanId[]), currentIndex (number)
**And** searchStore is reactive and updates components automatically
**And** searchStore provides helper functions: hasResults(), getResultCount()

**Given** Search examines span data
**When** A span's name contains the query
**Then** The span is included in results
**When** A span's input JSON contains the query
**Then** The span is included in results
**When** A span's output JSON contains the query
**Then** The span is included in results
**When** A span's attributes contain the query
**Then** The span is included in results

**Given** Search query is complex
**When** Query includes special characters or spaces
**Then** Special characters are escaped properly
**And** Spaces are treated as part of the search term
**And** No regex errors occur

---

### Story 5.2: Search Results Highlighting

As a developer,
I want matching spans highlighted in the tree,
So that I can see where my search term appears.

**Acceptance Criteria:**

**Given** Search results exist
**When** SpanNode.svelte renders a span
**Then** SpanNode checks if span is in searchStore.results
**And** Matching spans have highlighted background (yellow/gold)
**And** Non-matching spans remain with default styling

**Given** A span matches the search
**When** The span is highlighted
**Then** Highlight color is visible in both light and dark themes
**And** Highlight uses CSS variable like var(--vscode-editor-findMatchBackground)
**And** Text remains readable on highlighted background

**Given** Search results exist
**When** Some matching spans are collapsed (hidden)
**Then** Parent spans of hidden matches show indicator badge
**And** Badge shows count of hidden matches (e.g., "3 matches")
**And** Badge is clickable to expand and reveal matches

**Given** Search results include nested spans
**When** A parent and child both match
**Then** Both spans are highlighted independently
**And** Hierarchy visualization remains clear
**And** User can distinguish individual matches

**Given** Search query changes
**When** Results update
**Then** Previous highlights are removed
**And** New highlights are applied immediately
**And** Transition is smooth without flicker

**Given** Search is cleared
**When** User deletes the search query
**Then** All highlights are removed
**And** Tree returns to normal styling
**And** searchStore is reset (empty results)

**Given** Many results exist (50+ matches)
**When** All matches are highlighted
**Then** Performance remains smooth
**And** Rendering highlights doesn't block UI
**And** Scrolling remains at 60fps

---

### Story 5.3: Navigate Through Search Results

As a developer,
I want to navigate between search matches with prev/next buttons,
So that I can review all matches systematically.

**Acceptance Criteria:**

**Given** Search results exist
**When** TraceSearch component renders
**Then** Result count is displayed (e.g., "5 of 42 matches")
**And** Previous button (↑) and Next button (↓) are visible
**And** Buttons are positioned next to the search input

**Given** Search results exist
**When** I click the Next button
**Then** searchStore.currentIndex increments
**And** The next matching span is focused and scrolled into view
**And** Current match has distinct styling (e.g., orange vs yellow for other matches)

**Given** I'm on the last search result
**When** I click the Next button
**Then** Navigation wraps to the first result
**And** searchStore.currentIndex resets to 0
**And** User feedback indicates wrap (e.g., brief message "Wrapped to first result")

**Given** Search results exist
**When** I click the Previous button
**Then** searchStore.currentIndex decrements
**And** The previous matching span is focused and scrolled into view
**And** Current match is highlighted distinctly

**Given** I'm on the first search result
**When** I click the Previous button
**Then** Navigation wraps to the last result
**And** searchStore.currentIndex sets to results.length - 1
**And** User feedback indicates wrap

**Given** Current match is in a collapsed section
**When** Navigation moves to that match
**Then** Parent spans are automatically expanded to reveal the match
**And** Match is scrolled into view
**And** Expanded spans remain expanded after navigation

**Given** Keyboard shortcuts are expected
**When** I press Enter in the search box
**Then** Navigation moves to next match (same as Next button)
**When** I press Shift+Enter
**Then** Navigation moves to previous match (same as Previous button)
**And** Focus remains in search box for continued typing

**Given** No search results exist
**When** TraceSearch component renders empty results
**Then** Result count shows "0 matches"
**And** Previous and Next buttons are disabled
**And** Message displays "No results found" below search box

**Given** Search query is active
**When** I press Escape key
**Then** Search query is cleared
**And** Focus returns to the trace tree
**And** All highlights are removed

**Given** Navigation is working
**When** I navigate through results multiple times
**Then** Performance remains smooth (no lag)
**And** Virtual scrolling handles scroll-to-match efficiently
**And** UI updates are instant and responsive removes all entries
**And** All cache tests pass
