# Story 3.2: Webview Foundation with Svelte

Status: done

## Story

As a developer,
I want a rich UI for viewing trace details,
So that I can interact with the trace data effectively.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Verify Vite webview build configuration (AC: 1)
  - [x] Ensure build/vite.config.ts is configured for webview
  - [x] Entry point: src/webview/main.ts
  - [x] Output: out/webview/
  - [x] Add svelte and @sveltejs/vite-plugin-svelte to build

- [x] Create webview entry point (AC: 1)
  - [x] Create/update src/webview/main.ts
  - [x] Import Svelte mount function
  - [x] Mount App.svelte to #app container
  - [x] Set up message listener for extension communication
  - [x] Handle initial state setup

- [x] Create message types (AC: 3)
  - [x] Create src/models/messages.types.ts
  - [x] Define ExtensionMessage discriminated union:
    - `{ type: 'loadTrace'; payload: Trace }`
    - `{ type: 'error'; payload: string }`
    - `{ type: 'loading'; payload: boolean }`
  - [x] Define WebviewMessage discriminated union:
    - `{ type: 'requestRefresh' }`
    - `{ type: 'ready' }`

- [x] Create message handler utility (AC: 4)
  - [x] Create src/webview/utils/messageHandler.ts
  - [x] Declare vscode API type: `const vscode = acquireVsCodeApi()`
  - [x] Implement `sendMessage(message: WebviewMessage): void`
  - [x] Implement `onMessage(handler: (message: ExtensionMessage) => void): void`
  - [x] Export utilities for use in components

- [x] Create Svelte traceStore (AC: 6)
  - [x] Create src/webview/stores/traceStore.ts
  - [x] Use Svelte writable store: `writable<Trace | null>(null)`
  - [x] Export store and convenience functions

- [x] Create UI state store (AC: 6)
  - [x] Create src/webview/stores/uiStore.ts
  - [x] Add loading state: `writable<boolean>(true)`
  - [x] Add error state: `writable<string | null>(null)`
  - [x] Export loading and error stores

- [x] Create App.svelte root component (AC: 2)
  - [x] Create/update src/webview/App.svelte
  - [x] Subscribe to traceStore for reactive updates
  - [x] Subscribe to loading/error states
  - [x] Display loading spinner while loading is true
  - [x] Display error message when error is set
  - [x] Display trace content when trace is loaded
  - [x] Style with VSCode theme variables

- [x] Wire up message handling in App.svelte (AC: 2, 3)
  - [x] In onMount, subscribe to extension messages
  - [x] Handle 'loadTrace': update traceStore, clear loading/error
  - [x] Handle 'error': set error state, clear loading
  - [x] Handle 'loading': update loading state
  - [x] Send 'ready' message to extension when mounted

- [x] Create loading component (AC: 2)
  - [x] Create src/webview/components/LoadingSpinner.svelte
  - [x] Use VSCode progress indicator style
  - [x] Display "Loading trace..." message

- [x] Create error component (AC: 2)
  - [x] Create src/webview/components/ErrorDisplay.svelte
  - [x] Display error message with icon
  - [x] Include "Retry" button that sends refresh request
  - [x] Style with VSCode error colors

- [x] Add global styles (AC: 5)
  - [x] Create src/webview/styles/global.css
  - [x] Use VSCode CSS variables for theming: `var(--vscode-*)`
  - [x] Set base font, colors, spacing
  - [x] Import in main.ts

## Dev Notes

### Critical Architecture Requirements

**Svelte 5:**
- Per architecture.md: "Svelte 5 for webview UI components"
- Use Svelte 5 syntax with runes ($state, $derived, $effect) if applicable
- Or use classic Svelte stores for state management

**Message Protocol:**
- Per architecture.md: "Typed PostMessage with discriminated union types"
- Type safety is critical across extension ↔ webview boundary
- All messages must conform to defined types

**Build System:**
- Per architecture.md: "Dual Build System": extension (esbuild) + webview (Vite)
- Webview bundle goes to out/webview/
- Extension loads from this path

**VSCode Theme Integration:**
- Use CSS variables like `var(--vscode-editor-background)`
- Ensures UI matches user's VSCode theme (light/dark)

### Implementation Pattern

**Svelte Store Pattern:**
```typescript
// src/webview/stores/traceStore.ts
import { writable } from 'svelte/store';
import type { Trace } from '../../models/trace.types';

export const traceStore = writable<Trace | null>(null);

export function setTrace(trace: Trace): void {
  traceStore.set(trace);
}

export function clearTrace(): void {
  traceStore.set(null);
}
```

**Message Handler Pattern:**
```typescript
// src/webview/utils/messageHandler.ts
import type { ExtensionMessage, WebviewMessage } from '../../models/messages.types';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

export function sendMessage(message: WebviewMessage): void {
  vscode.postMessage(message);
}

export function onMessage(handler: (message: ExtensionMessage) => void): () => void {
  const listener = (event: MessageEvent) => {
    handler(event.data as ExtensionMessage);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
```

**App.svelte Structure:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { traceStore, setTrace } from './stores/traceStore';
  import { onMessage, sendMessage } from './utils/messageHandler';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorDisplay from './components/ErrorDisplay.svelte';

  let loading = true;
  let error: string | null = null;

  onMount(() => {
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case 'loadTrace':
          setTrace(message.payload);
          loading = false;
          error = null;
          break;
        case 'error':
          error = message.payload;
          loading = false;
          break;
        case 'loading':
          loading = message.payload;
          break;
      }
    });

    sendMessage({ type: 'ready' });
    return unsubscribe;
  });
</script>

{#if loading}
  <LoadingSpinner />
{:else if error}
  <ErrorDisplay message={error} />
{:else if $traceStore}
  <main>
    <!-- Trace content will be added in Story 3.3 -->
    <pre>{JSON.stringify($traceStore, null, 2)}</pre>
  </main>
{/if}
```

### VSCode CSS Variables

Common variables for theming:
- `--vscode-editor-background`
- `--vscode-editor-foreground`
- `--vscode-button-background`
- `--vscode-button-foreground`
- `--vscode-errorForeground`
- `--vscode-progressBar-background`
- `--vscode-focusBorder`

### Testing Notes

- Test message handling with mock messages
- Test loading state display
- Test error state display
- Test store reactivity
- Verify Vite build produces correct output

### Project Structure Notes

- src/webview/main.ts already exists - update as needed
- src/webview/stores/ directory exists
- src/webview/components/ directory exists
- src/webview/utils/ directory exists
- Add src/models/messages.types.ts (new file)

### References

- [Architecture: Message Protocol](../_bmad-output/planning-artifacts/architecture.md#decision-2-1-message-protocol)
- [Architecture: Webview State Management](../_bmad-output/planning-artifacts/architecture.md#decision-1-2-webview-state-management)
- [Architecture: Build System](../_bmad-output/planning-artifacts/architecture.md#build-architecture)
- [Story 3.1: TraceViewerPanel](./3-1-open-trace-in-webview-tab.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Webview logs messages to console for debugging extension↔webview communication

### Completion Notes List

1. Verified Vite config already properly configured for webview build
2. Created typed message protocol in src/models/messages.types.ts with discriminated unions
3. Implemented messageHandler.ts with sendMessage() and onMessage() utilities
4. Created traceStore for reactive trace state management
5. Created uiStore for loading/error state with convenience functions
6. Created LoadingSpinner.svelte with VSCode-themed spinner animation
7. Created ErrorDisplay.svelte with error icon and retry button
8. Created App.svelte root component integrating all stores and message handling
9. Updated main.ts to mount Svelte app and import global styles
10. Created global.css with VSCode theme variable integration
11. Added 28 new tests covering stores and message handler utilities
12. All 146 tests passing, both extension and webview compile successfully

### File List

- src/models/messages.types.ts (new)
- src/webview/main.ts (modified)
- src/webview/App.svelte (new)
- src/webview/components/LoadingSpinner.svelte (new)
- src/webview/components/ErrorDisplay.svelte (new)
- src/webview/stores/traceStore.ts (new)
- src/webview/stores/traceStore.test.ts (new)
- src/webview/stores/uiStore.ts (new)
- src/webview/stores/uiStore.test.ts (new)
- src/webview/utils/messageHandler.ts (new)
- src/webview/utils/messageHandler.test.ts (new)
- src/webview/styles/global.css (new)
