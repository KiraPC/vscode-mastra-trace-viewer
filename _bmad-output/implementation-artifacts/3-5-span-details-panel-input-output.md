# Story 3.5: Span Details Panel (Input/Output)

Status: done

## Story

As a developer,
I want to see the input and output data for each span,
So that I can understand what data was passed and returned.

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] Add selected span state to uiStore (AC: 1)
  - [ ] Update src/webview/stores/uiStore.ts
  - [ ] Add selectedSpanId: writable<string | null>(null)
  - [ ] Export setSelectedSpan(spanId) and clearSelection() functions
  - [ ] Add selectedSpan derived store that looks up full span data

- [ ] Handle span selection in SpanNode (AC: 1)
  - [ ] Update src/webview/components/SpanNode.svelte
  - [ ] Add click handler on span row (not just chevron)
  - [ ] On click, call setSelectedSpan(node.spanId)
  - [ ] Add selected styling when spanId matches selectedSpanId
  - [ ] Use --vscode-list-activeSelectionBackground for selected state

- [ ] Create SpanDetails component (AC: 2)
  - [ ] Create src/webview/components/SpanDetails.svelte
  - [ ] Accept prop: span: SpanTreeNode | null
  - [ ] Display header with span name and close button
  - [ ] Display span metadata: type, status, duration

- [ ] Display timestamps in SpanDetails (AC: 2)
  - [ ] Show "Started" with formatted startedAt
  - [ ] Show "Ended" with formatted endedAt (or "Running" if null)
  - [ ] Show "Duration" with calculated duration
  - [ ] Use readable format: "Feb 10, 2026 3:45:23 PM"

- [ ] Create JSON viewer component (AC: 3, 4, 5)
  - [ ] Create src/webview/components/JsonViewer.svelte
  - [ ] Accept prop: data: unknown, label: string
  - [ ] Pretty-print JSON with indentation
  - [ ] Add basic syntax highlighting (keys, strings, numbers, booleans)
  - [ ] Use monospace font

- [ ] Implement JSON truncation (AC: 3, 4)
  - [ ] If JSON string > 500 characters, truncate
  - [ ] Show "Show more" button to reveal full content
  - [ ] Track expanded state per section

- [ ] Implement collapsible JSON sections (AC: 5)
  - [ ] For objects/arrays, show toggle to collapse
  - [ ] Collapsed shows: { ... } or [ ... ] with item count
  - [ ] Expanded shows full content with indentation
  - [ ] Default: first level expanded, nested collapsed

- [ ] Add copy to clipboard (AC: 5)
  - [ ] Add "Copy" button next to Input and Output sections
  - [ ] Use navigator.clipboard.writeText()
  - [ ] Show confirmation feedback ("Copied!")
  - [ ] Handle copy failure gracefully

- [ ] Display Input section (AC: 3)
  - [ ] Check if span.input exists
  - [ ] Render JsonViewer with input data
  - [ ] Show "No input" if undefined/null

- [ ] Display Output section (AC: 4)
  - [ ] Check if span.output exists
  - [ ] Render JsonViewer with output data
  - [ ] Show "No output" if undefined/null

- [ ] Display Attributes section (AC: 6)
  - [ ] Check if span.attributes or relevant metadata exists
  - [ ] Display as key-value list
  - [ ] Include: entityType, entityId, entityName from span
  - [ ] Format values appropriately (strings, numbers, etc.)

- [ ] Implement panel layout (AC: 7)
  - [ ] Update App.svelte to include SpanDetails panel
  - [ ] Create split layout: tree on left, details on right
  - [ ] Default panel width: 400px
  - [ ] Panel takes remaining height

- [ ] Add resizable divider (AC: 7)
  - [ ] Create draggable divider between tree and details
  - [ ] Track panel width in uiStore
  - [ ] Minimum width: 200px, maximum: 60% of container
  - [ ] Persist width in webview state (optional)

- [ ] Implement close button (AC: 7)
  - [ ] Add X button in SpanDetails header
  - [ ] On click, call clearSelection()
  - [ ] Tree expands to full width when panel closed

- [ ] Display placeholder when no selection (AC: 8)
  - [ ] When selectedSpan is null, show placeholder
  - [ ] Message: "Select a span to view details"
  - [ ] Add brief instructions or keyboard hints

- [ ] Style SpanDetails for themes (AC: 2-8)
  - [ ] Use VSCode CSS variables throughout
  - [ ] Ensure readability in light and dark themes
  - [ ] Use appropriate spacing and borders

## Dev Notes

### Critical Architecture Requirements

**Input/Output Display:**
- Per PRD: "Expandable/collapsible span nodes showing input/output data"
- Input and output can be large JSON objects
- Need truncation and expansion for usability

**Security:**
- Per architecture.md: "Safe rendering of user-provided input/output data"
- Escape HTML in JSON strings to prevent XSS
- Use textContent or safe rendering approach

**Performance:**
- Large JSON objects may slow rendering
- Consider virtualization for very large data
- Lazy render collapsed sections

### Implementation Pattern

**UI Store Selection State:**
```typescript
// Add to src/webview/stores/uiStore.ts
import type { SpanTreeNode } from '../../models/tree.types';

export const selectedSpanId = writable<string | null>(null);

// Derived store to get full span data
export const selectedSpan = derived(
  [selectedSpanId, traceStore],
  ([$selectedSpanId, $trace]) => {
    if (!$selectedSpanId || !$trace) return null;
    // Find span in tree or flat list
    return findSpanById($trace.spans, $selectedSpanId);
  }
);

export function setSelectedSpan(spanId: string): void {
  selectedSpanId.set(spanId);
}

export function clearSelection(): void {
  selectedSpanId.set(null);
}
```

**SpanDetails Component:**
```svelte
<script lang="ts">
  import { selectedSpan, clearSelection } from '../stores/uiStore';
  import JsonViewer from './JsonViewer.svelte';
  import { formatDuration, formatTimestamp } from '../utils/formatters';
  
  $: span = $selectedSpan;
</script>

<div class="span-details">
  {#if span}
    <header>
      <h3>{span.name}</h3>
      <button class="close-btn" on:click={clearSelection}>×</button>
    </header>
    
    <section class="metadata">
      <div class="meta-row">
        <span class="label">Type:</span>
        <span class="value">{span.spanType}</span>
      </div>
      <div class="meta-row">
        <span class="label">Status:</span>
        <span class="value status-{span.status}">{span.status || 'unknown'}</span>
      </div>
      <div class="meta-row">
        <span class="label">Duration:</span>
        <span class="value">{formatDuration(span.startedAt, span.endedAt)}</span>
      </div>
      <div class="meta-row">
        <span class="label">Started:</span>
        <span class="value">{formatTimestamp(span.startedAt)}</span>
      </div>
      {#if span.endedAt}
        <div class="meta-row">
          <span class="label">Ended:</span>
          <span class="value">{formatTimestamp(span.endedAt)}</span>
        </div>
      {/if}
    </section>
    
    {#if span.input !== undefined}
      <section class="data-section">
        <h4>Input</h4>
        <JsonViewer data={span.input} />
      </section>
    {/if}
    
    {#if span.output !== undefined}
      <section class="data-section">
        <h4>Output</h4>
        <JsonViewer data={span.output} />
      </section>
    {/if}
    
    {#if span.attributes && Object.keys(span.attributes).length > 0}
      <section class="attributes-section">
        <h4>Attributes</h4>
        {#each Object.entries(span.attributes) as [key, value]}
          <div class="attr-row">
            <span class="attr-key">{key}:</span>
            <span class="attr-value">{JSON.stringify(value)}</span>
          </div>
        {/each}
      </section>
    {/if}
  {:else}
    <div class="placeholder">
      <p>Select a span to view details</p>
      <p class="hint">Click on a span in the tree to see its input, output, and attributes.</p>
    </div>
  {/if}
</div>
```

**JSON Viewer Pattern:**
```svelte
<script lang="ts">
  export let data: unknown;
  export let maxLength = 500;
  
  let expanded = false;
  
  $: jsonString = JSON.stringify(data, null, 2);
  $: isTruncated = jsonString.length > maxLength;
  $: displayString = isTruncated && !expanded 
    ? jsonString.slice(0, maxLength) + '...' 
    : jsonString;
  
  async function copyToClipboard() {
    await navigator.clipboard.writeText(jsonString);
    // Show feedback
  }
</script>

<div class="json-viewer">
  <button class="copy-btn" on:click={copyToClipboard}>Copy</button>
  <pre><code>{displayString}</code></pre>
  {#if isTruncated}
    <button class="expand-btn" on:click={() => expanded = !expanded}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
</div>
```

### Testing Notes

- Test span selection and deselection
- Test Input/Output display with various data types
- Test truncation and expansion
- Test copy to clipboard
- Test resizable panel
- Verify XSS prevention with malicious data

### Project Structure Notes

- New file: src/webview/components/SpanDetails.svelte
- New file: src/webview/components/JsonViewer.svelte
- Update: src/webview/stores/uiStore.ts (selection state)
- Update: src/webview/components/SpanNode.svelte (click handler)
- Update: src/webview/App.svelte (split layout)

### References

- [Story 3.3: Span Tree Display](./3-3-hierarchical-span-tree-display.md)
- [Story 3.4: Expand/Collapse](./3-4-expand-collapse-span-nodes.md)
- [Architecture: Security](../_bmad-output/planning-artifacts/architecture.md#security)

## Dev Agent Record

### Agent Model Used



### Debug Log References

### Completion Notes List

### File List
