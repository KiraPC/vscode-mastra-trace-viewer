# Story 2.1: Trace List TreeView Provider

Status: done

## Story

As a developer,
I want to see a "Mastra Traces" view in the VSCode sidebar,
So that I have a dedicated place to view my traces.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Configure view container in package.json (AC: 1)
  - [x] Add viewsContainers.activitybar entry for Mastra Traces
  - [x] Add views.mastraTraceViewer entry for trace list view
  - [x] Configure view icon using built-in codicon (pulse)
  - [x] Set view title and welcome content

- [x] Create TraceTreeItem class (AC: 2)
  - [x] Extend vscode.TreeItem base class
  - [x] Add optional trace and span properties
  - [x] Configure contextValue for command targeting
  - [x] Add iconPath based on item type (trace vs span)
  - [x] Add tooltip with trace/span details
  - [x] Add description for metadata display

- [x] Implement TraceListProvider class (AC: 2)
  - [x] Implement vscode.TreeDataProvider<TraceTreeItem> interface
  - [x] Create _onDidChangeTreeData EventEmitter
  - [x] Expose onDidChangeTreeData event
  - [x] Implement getTreeItem(element) method
  - [x] Implement getChildren(element?) method
  - [x] Handle root level (traces) and child level (spans)
  - [x] Return empty state when no traces loaded

- [x] Register provider in extension.ts (AC: 3)
  - [x] Create TraceListProvider instance with API client
  - [x] Use vscode.window.createTreeView() for enhanced control
  - [x] Add showCollapseAll option for tree navigation
  - [x] Add provider to context.subscriptions for cleanup

- [x] Configure toolbar commands (AC: 4)
  - [x] Add refresh command contribution in package.json
  - [x] Configure command icon in view/title toolbar
  - [x] Wire command to TraceListProvider.refresh()

## Dev Notes

### Implementation Details

**TraceTreeItem Design:**
- Supports three item types: trace, span, and loadMore
- Each type has distinct contextValue for command targeting
- Icons use vscode.ThemeIcon for consistent styling:
  - Trace: `pulse` icon
  - Span: `hubot` (agent), `comment-discussion` (llm), `tools` (tool)
  - Load More: `ellipsis` icon

**TraceListProvider Architecture:**
- Maintains internal traces array for current data
- Pagination support with currentPage and perPage properties
- isLoading flag prevents duplicate refresh requests
- setApiClient() method allows client updates on endpoint change

**package.json Contributions:**
```json
{
  "viewsContainers": {
    "activitybar": [{
      "id": "mastraTraceViewer",
      "title": "Mastra Traces",
      "icon": "$(pulse)"
    }]
  },
  "views": {
    "mastraTraceViewer": [{
      "id": "mastraTraceList",
      "name": "Traces",
      "contextualTitle": "Mastra Traces"
    }]
  }
}
```

### Key Files Modified/Created

- `src/providers/TraceListProvider.ts` - TreeDataProvider implementation
- `src/extension.ts` - Provider registration and command wiring
- `package.json` - View container and command contributions

### Testing Notes

- Tree view displays correctly in Extension Development Host
- Empty state shows when no traces are loaded
- Refresh button visible in view toolbar
- No console errors during activation
