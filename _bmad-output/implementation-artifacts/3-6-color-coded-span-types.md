# Story 3.6: Color-Coded Span Types

Status: done

## Story

As a developer,
I want different span types to have distinct colors,
So that I can quickly identify agent runs, tool calls, and LLM calls.

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] Define color scheme CSS variables (AC: 1)
  - [ ] Update src/webview/styles/global.css
  - [ ] Define --span-color-agent-run: #0078d4 (blue)
  - [ ] Define --span-color-processor-run: #8b5cf6 (purple)
  - [ ] Define --span-color-tool-streaming: #10b981 (green)
  - [ ] Define --span-color-llm-call: #f59e0b (orange)
  - [ ] Define --span-color-custom: #6b7280 (gray)
  - [ ] Define --span-color-error: #ef4444 (red)

- [ ] Add dark theme color variants (AC: 7)
  - [ ] Define lighter/brighter variants for dark theme readability
  - [ ] Use CSS media query or :root[data-vscode-theme-kind="vscode-dark"]
  - [ ] Or use VSCode color variables for automatic adjustment
  - [ ] Test colors in both light and dark themes

- [ ] Create span icon mapping (AC: 2, 3, 4, 5, 6)
  - [ ] Create src/webview/utils/spanIcons.ts
  - [ ] Define getSpanIcon(spanType: string): string function
  - [ ] agent_run → 👤 or codicon person/robot
  - [ ] processor_run → ⚙️ or codicon gear
  - [ ] tool_streaming → 🔧 or codicon wrench
  - [ ] llm_call → ✨ or codicon sparkle/lightbulb
  - [ ] custom/default → 📦 or codicon box

- [ ] Create span color mapping (AC: 2-6)
  - [ ] Create getSpanColor(spanType: string): string function
  - [ ] Return CSS variable name for each span type
  - [ ] Export both icon and color utilities

- [ ] Apply color to span icon in SpanNode (AC: 2-6)
  - [ ] Update src/webview/components/SpanNode.svelte
  - [ ] Get color from getSpanColor(node.spanType)
  - [ ] Apply color to icon using style attribute or class
  - [ ] Ensure icon is visible against background

- [ ] Add left border color to span rows (AC: 6)
  - [ ] Add 3px left border to span-node element
  - [ ] Set border-color using span type color
  - [ ] Subtle but visible indicator of type

- [ ] Create type badge component (AC: 6)
  - [ ] Create small badge/pill showing span type
  - [ ] Background color matches span type
  - [ ] Text is readable (white or dark based on background)
  - [ ] Position after span name or in details area

- [ ] Implement nested color intensity (AC: 6)
  - [ ] Reduce opacity for deeper nested spans
  - [ ] depth 0: 100% opacity
  - [ ] depth 1: 90% opacity
  - [ ] depth 2+: 80% opacity
  - [ ] Or use CSS calc with depth variable

- [ ] Handle error status overlay (AC: 8)
  - [ ] If span.status === 'error', show error indicator
  - [ ] Add red error icon or badge next to span
  - [ ] Don't replace type color, supplement it
  - [ ] Error indicator visible even when collapsed

- [ ] Ensure selected span styling (AC: 6)
  - [ ] Selected span has distinct background color
  - [ ] Selection background doesn't clash with type colors
  - [ ] Use --vscode-list-activeSelectionBackground
  - [ ] Type color border/icon still visible when selected

- [ ] Handle theme changes (AC: 7)
  - [ ] Listen for VSCode theme change message (if available)
  - [ ] Or use CSS that works in both themes
  - [ ] Test in VSCode light, dark, and high contrast themes

- [ ] Add legend/key (optional enhancement)
  - [ ] Create small legend showing color meanings
  - [ ] Position in toolbar or as tooltip
  - [ ] Help new users understand colors

## Dev Notes

### Critical Architecture Requirements

**Color Coding:**
- Per PRD: "Color-coded span types for quick visual scanning"
- Per architecture.md: "Visual hierarchy: agent_run → processor_run → tool_streaming → LLM calls"
- Colors must be accessible and theme-compatible

**Theme Compatibility:**
- VSCode supports light, dark, and high contrast themes
- Use CSS variables for automatic theme adaptation
- Test in all theme variants

**Accessibility:**
- Colors should not be the only indicator (use icons too)
- Ensure sufficient contrast ratios
- Consider colorblind-friendly palette

### Implementation Pattern

**CSS Color Variables:**
```css
/* src/webview/styles/global.css */

:root {
  /* Span type colors - will work in most themes */
  --span-color-agent-run: #0078d4;
  --span-color-processor-run: #8b5cf6;
  --span-color-tool-streaming: #10b981;
  --span-color-llm-call: #f59e0b;
  --span-color-custom: #6b7280;
  --span-color-error: #ef4444;
  
  /* Opacity for nesting levels */
  --span-opacity-depth-0: 1;
  --span-opacity-depth-1: 0.9;
  --span-opacity-depth-2: 0.8;
}

/* High contrast adjustments */
@media (prefers-contrast: more) {
  :root {
    --span-color-agent-run: #0066cc;
    --span-color-processor-run: #7c3aed;
    --span-color-tool-streaming: #059669;
    --span-color-llm-call: #d97706;
  }
}
```

**Icon and Color Utilities:**
```typescript
// src/webview/utils/spanIcons.ts

export type SpanTypeColor = 
  | 'agent-run' 
  | 'processor-run' 
  | 'tool-streaming' 
  | 'llm-call' 
  | 'custom';

export function getSpanIcon(spanType: string): string {
  switch (spanType) {
    case 'agent_run':
      return '👤'; // or use codicon class
    case 'processor_run':
      return '⚙️';
    case 'tool_streaming':
      return '🔧';
    case 'llm_call':
      return '✨';
    default:
      return '📦';
  }
}

export function getSpanColorClass(spanType: string): SpanTypeColor {
  switch (spanType) {
    case 'agent_run':
      return 'agent-run';
    case 'processor_run':
      return 'processor-run';
    case 'tool_streaming':
      return 'tool-streaming';
    case 'llm_call':
      return 'llm-call';
    default:
      return 'custom';
  }
}

export function getSpanColorVar(spanType: string): string {
  const colorClass = getSpanColorClass(spanType);
  return `var(--span-color-${colorClass})`;
}
```

**SpanNode with Colors:**
```svelte
<script lang="ts">
  import { getSpanIcon, getSpanColorVar, getSpanColorClass } from '../utils/spanIcons';
  import type { SpanTreeNode } from '../../models/tree.types';
  
  export let node: SpanTreeNode;
  export let depth = 0;
  
  $: spanColor = getSpanColorVar(node.spanType);
  $: spanIcon = getSpanIcon(node.spanType);
  $: colorClass = getSpanColorClass(node.spanType);
  $: hasError = node.status === 'error';
  $: opacity = Math.max(0.8, 1 - depth * 0.1);
</script>

<div 
  class="span-node span-type-{colorClass}"
  class:has-error={hasError}
  style="--span-depth-opacity: {opacity}; border-left-color: {spanColor}"
>
  <!-- ... chevron ... -->
  
  <span class="span-icon" style="color: {spanColor}">{spanIcon}</span>
  <span class="span-name">{node.name}</span>
  
  <span class="span-type-badge" style="background-color: {spanColor}">
    {node.spanType.replace('_', ' ')}
  </span>
  
  {#if hasError}
    <span class="error-indicator">⚠️</span>
  {/if}
  
  <span class="span-duration">{formatDuration(node.startedAt, node.endedAt)}</span>
</div>

<style>
  .span-node {
    border-left: 3px solid transparent;
    opacity: var(--span-depth-opacity, 1);
  }
  
  .span-icon {
    margin-right: 4px;
    font-size: 14px;
  }
  
  .span-type-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    color: white;
    margin-left: 8px;
  }
  
  .error-indicator {
    color: var(--span-color-error);
    margin-left: 4px;
  }
  
  .has-error .span-name {
    color: var(--span-color-error);
  }
</style>
```

**Type Badge Color Contrast:**
```typescript
// Ensure text is readable on badge
export function getBadgeTextColor(spanType: string): string {
  // All our colors are dark enough for white text
  return 'white';
}
```

### Testing Notes

- Test all span types display correct colors
- Test in VSCode Light, Dark, and High Contrast themes
- Test nested spans show opacity reduction
- Test error status displays correctly
- Verify accessibility (color contrast, not color-only)

### Project Structure Notes

- Update: src/webview/styles/global.css (color variables)
- New file: src/webview/utils/spanIcons.ts
- Update: src/webview/components/SpanNode.svelte (apply colors)
- Consider: Add codicons webfont for professional icons

### References

- [Architecture: Visual Hierarchy](../_bmad-output/planning-artifacts/architecture.md#visual-hierarchy)
- [Story 3.3: Span Tree Display](./3-3-hierarchical-span-tree-display.md)
- [Story 3.4: Expand/Collapse](./3-4-expand-collapse-span-nodes.md)
- [VSCode Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)

## Dev Agent Record

### Agent Model Used



### Debug Log References

### Completion Notes List

### File List
