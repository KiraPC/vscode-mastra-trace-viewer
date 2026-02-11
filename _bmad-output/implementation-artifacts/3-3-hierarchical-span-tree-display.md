# Story 3.3: Hierarchical Span Tree Display

Status: done

## Story

As a developer,
I want to see spans organized in a hierarchical tree structure,
So that I can understand the execution flow of my agent.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Create tree types (AC: 2)
  - [x] Create src/models/tree.types.ts
  - [x] Define SpanTreeNode interface with all span properties plus children array
  - [x] Include: spanId, name, spanType, startedAt, endedAt, input, output, attributes, status
  - [x] children: SpanTreeNode[]
  - [x] Add depth property for indentation level

- [x] Create span tree builder utility (AC: 1)
  - [x] Create src/utils/spanTreeBuilder.ts
  - [x] Implement buildTree(spans: Span[]): SpanTreeNode[]
  - [x] Create spanMap: Map<spanId, SpanTreeNode> for O(1) lookups
  - [x] First pass: convert all spans to SpanTreeNode
  - [x] Second pass: link children to parents via parentSpanId
  - [x] Return array of root nodes (parentSpanId is null)

- [x] Handle edge cases in tree builder (AC: 1)
  - [x] Handle orphaned spans (parentSpanId not found) - add to roots
  - [x] Handle empty spans array - return empty array
  - [x] Handle circular references - detect and break cycle
  - [x] Sort children by startedAt timestamp

- [x] Create unit tests for tree builder (AC: 6)
  - [x] Create src/utils/spanTreeBuilder.test.ts
  - [x] Test: single root span with no children
  - [x] Test: root with nested children (2-3 levels)
  - [x] Test: multiple root spans
  - [x] Test: orphaned span handling
  - [x] Test: empty array input
  - [x] Test: children sorted by startedAt
  - [x] Run with `npm run test:unit`

- [x] Create SpanTree component (AC: 3)
  - [x] Create src/webview/components/SpanTree.svelte
  - [x] Accept props: tree: SpanTreeNode[]
  - [x] Render list of SpanNode components for each root
  - [x] Apply container styling (scrollable, full height)

- [x] Create SpanNode component (AC: 4)
  - [x] Create src/webview/components/SpanNode.svelte
  - [x] Accept props: node: SpanTreeNode, depth: number
  - [x] Display span icon based on type (placeholder, colored in Story 3.6)
  - [x] Display span name
  - [x] Display duration: (endedAt - startedAt) formatted as "123ms" or "1.2s"
  - [x] Apply left padding based on depth: `padding-left: ${depth * 16}px`

- [x] Implement recursive rendering (AC: 3, 4)
  - [x] SpanNode renders children recursively
  - [x] Pass depth + 1 to child SpanNode
  - [x] Each level adds visual indentation
  - [x] Tree lines/connectors for visual hierarchy (optional enhancement)

- [x] Add basic span type icons (AC: 5)
  - [x] Add icon mapping function: getSpanIcon(spanType: string)
  - [x] Use codicons from VSCode webview toolkit or SVG icons
  - [x] agent_run: person icon
  - [x] processor_run: gear icon
  - [x] tool_streaming: wrench icon
  - [x] llm_call: sparkle icon
  - [x] default: box icon

- [x] Calculate and display duration (AC: 4)
  - [x] Create formatDuration(startedAt, endedAt) utility
  - [x] Handle null/undefined endedAt (show "running" or dash)
  - [x] Format: < 1s → "123ms", >= 1s → "1.23s", >= 60s → "1m 23s"
  - [x] Display next to span name

- [x] Integrate SpanTree into App.svelte (AC: 3)
  - [x] Import SpanTree component
  - [x] Build tree from trace.spans using spanTreeBuilder
  - [x] Cache built tree to avoid rebuilding on re-render
  - [x] Pass tree to SpanTree component

- [x] Add basic styling (AC: 5)
  - [x] Style span rows with hover effect
  - [x] Use VSCode theme colors
  - [x] Ensure readable in light and dark themes
  - [x] Add subtle borders or background for hierarchy levels

## Dev Notes

### Critical Architecture Requirements

**Tree Construction:**
- Per architecture.md: "Pre-build tree on trace load, cache result"
- Tree construction is O(n), cache to avoid repeated computation
- SpanTreeBuilder utility class with buildTree() method

**Span Hierarchy:**
- Per PRD: "Visual hierarchy: agent_run → processor_run → tool_streaming → LLM calls"
- parentSpanId links child to parent
- Root spans have null parentSpanId

**Performance:**
- Per architecture.md: "Tree pre-building and caching for performance"
- Build tree once when trace loads
- Store in component state or separate store

### Implementation Pattern

**SpanTreeNode Interface:**
```typescript
// src/models/tree.types.ts
import type { Span } from './trace.types';

export interface SpanTreeNode {
  spanId: string;
  parentSpanId: string | null;
  name: string;
  spanType: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
  input?: unknown;
  output?: unknown;
  attributes?: Record<string, unknown>;
  status?: string;
  children: SpanTreeNode[];
  depth: number;
  
  // Original span reference for full data access
  originalSpan: Span;
}
```

**Tree Builder Algorithm:**
```typescript
// src/utils/spanTreeBuilder.ts
import type { Span } from '../models/trace.types';
import type { SpanTreeNode } from '../models/tree.types';

export function buildTree(spans: Span[]): SpanTreeNode[] {
  if (!spans || spans.length === 0) {
    return [];
  }

  // Create nodes map
  const nodeMap = new Map<string, SpanTreeNode>();
  const roots: SpanTreeNode[] = [];

  // First pass: create all nodes
  for (const span of spans) {
    nodeMap.set(span.spanId, {
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      spanType: span.spanType,
      startedAt: span.startedAt,
      endedAt: span.endedAt,
      input: span.input,
      output: span.output,
      attributes: span.attributes,
      status: span.status,
      children: [],
      depth: 0,
      originalSpan: span,
    });
  }

  // Second pass: link children and find roots
  for (const node of nodeMap.values()) {
    if (node.parentSpanId && nodeMap.has(node.parentSpanId)) {
      const parent = nodeMap.get(node.parentSpanId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      // Root or orphaned span
      roots.push(node);
    }
  }

  // Sort children by startedAt
  const sortChildren = (nodes: SpanTreeNode[]) => {
    nodes.sort((a, b) => {
      const startA = new Date(a.startedAt).getTime();
      const startB = new Date(b.startedAt).getTime();
      return startA - startB;
    });
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    }
  };

  sortChildren(roots);
  return roots;
}
```

**Duration Formatting:**
```typescript
export function formatDuration(startedAt: string | Date, endedAt?: string | Date | null): string {
  if (!endedAt) {
    return 'running';
  }
  
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const durationMs = end - start;
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}
```

### Testing Notes

- Test tree construction with various span hierarchies
- Test orphaned span handling
- Test duration calculation edge cases
- Visual testing in webview for styling

### Project Structure Notes

- New file: src/models/tree.types.ts
- New file: src/utils/spanTreeBuilder.ts
- New file: src/utils/spanTreeBuilder.test.ts
- New file: src/webview/components/SpanTree.svelte
- New file: src/webview/components/SpanNode.svelte
- Update: src/webview/App.svelte to use SpanTree

### References

- [Architecture: Span Tree Construction](../_bmad-output/planning-artifacts/architecture.md#decision-1-3-span-tree-construction)
- [Existing Trace Types](../src/models/trace.types.ts)
- [Story 3.2: Webview Foundation](./3-2-webview-foundation-with-svelte.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Tree building logged for performance monitoring
- Orphaned spans logged for debugging

### Completion Notes List

1. Created SpanTreeNode interface in src/models/tree.types.ts with all span properties plus children array
2. Implemented buildTree() in spanTreeBuilder.ts with O(n) two-pass algorithm for tree construction
3. Added formatDuration() utility for displaying span durations in human-readable format
4. Added getSpanTypeIcon() for mapping span types to icons
5. Created SpanNode.svelte with recursive rendering, indentation, icons, and duration display
6. Created SpanTree.svelte container component with scrollable tree view
7. Integrated SpanTree into App.svelte with $derived for cached tree building
8. Added 23 unit tests for spanTreeBuilder covering all edge cases
9. All 169 tests passing, compilation successful

### File List

- src/models/tree.types.ts (new)
- src/utils/spanTreeBuilder.ts (new)
- src/utils/spanTreeBuilder.test.ts (new)
- src/webview/components/SpanTree.svelte (new)
- src/webview/components/SpanNode.svelte (new)
- src/webview/App.svelte (modified)
