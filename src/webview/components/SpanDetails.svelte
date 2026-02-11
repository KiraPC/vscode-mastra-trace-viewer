<script lang="ts">
  /**
   * SpanDetails component - Shows detailed information about a selected span
   * Displays metadata, input/output data, and attributes
   */
  import type { SpanTreeNode } from '../../models/tree.types';
  import { formatDuration, getSpanTypeIcon } from '../../utils/spanTreeBuilder';
  import { clearSelection } from '../stores/uiStore';
  import JsonViewer from './JsonViewer.svelte';
  
  interface Props {
    span: SpanTreeNode | null;
  }
  
  let { span }: Props = $props();
  
  // Format timestamp for display
  function formatTimestamp(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return String(timestamp);
    }
  }
  
  // Get duration string
  const duration = $derived(span ? formatDuration(span.startedAt, span.endedAt) : '');
  
  // Get icon for span type
  const icon = $derived(span ? getSpanTypeIcon(span.spanType) : 'circle-outline');
  
  // Get status class
  const statusClass = $derived(
    span?.status === 'error' ? 'error' : 
    span?.status === 'running' ? 'running' : 
    'success'
  );
  
  // Handle close button
  function handleClose(): void {
    clearSelection();
  }
</script>

{#if span}
  <div class="span-details">
    <header class="details-header">
      <div class="header-content">
        <span class="icon icon-{icon}" aria-hidden="true"></span>
        <h2 class="span-name" title={span.name}>{span.name}</h2>
      </div>
      <button 
        type="button" 
        class="close-btn" 
        onclick={handleClose}
        aria-label="Close details panel"
        title="Close"
      >×</button>
    </header>
    
    <div class="details-content">
      <section class="meta-section">
        <h3>Span Information</h3>
        <dl class="meta-list">
          <div class="meta-item">
            <dt>Type</dt>
            <dd><span class="type-badge">{span.spanType}</span></dd>
          </div>
          <div class="meta-item">
            <dt>Status</dt>
            <dd><span class="status-badge {statusClass}">{span.status}</span></dd>
          </div>
          <div class="meta-item">
            <dt>Duration</dt>
            <dd class="mono">{duration}</dd>
          </div>
          <div class="meta-item">
            <dt>Started</dt>
            <dd class="mono">{formatTimestamp(span.startedAt)}</dd>
          </div>
          <div class="meta-item">
            <dt>Ended</dt>
            <dd class="mono">{span.endedAt ? formatTimestamp(span.endedAt) : 'Running...'}</dd>
          </div>
          {#if span.originalSpan.entityType}
            <div class="meta-item">
              <dt>Entity Type</dt>
              <dd>{span.originalSpan.entityType}</dd>
            </div>
          {/if}
          {#if span.originalSpan.entityId}
            <div class="meta-item">
              <dt>Entity ID</dt>
              <dd class="mono">{span.originalSpan.entityId}</dd>
            </div>
          {/if}
          {#if span.originalSpan.entityName}
            <div class="meta-item">
              <dt>Entity Name</dt>
              <dd>{span.originalSpan.entityName}</dd>
            </div>
          {/if}
        </dl>
      </section>
      
      <section class="data-section">
        <h3>Input</h3>
        {#if span.input !== undefined && span.input !== null}
          <JsonViewer data={span.input} label="Input" />
        {:else}
          <p class="no-data">No input data</p>
        {/if}
      </section>
      
      <section class="data-section">
        <h3>Output</h3>
        {#if span.output !== undefined && span.output !== null}
          <JsonViewer data={span.output} label="Output" />
        {:else}
          <p class="no-data">No output data</p>
        {/if}
      </section>
    </div>
  </div>
{:else}
  <div class="span-details placeholder">
    <div class="placeholder-content">
      <p class="placeholder-message">Select a span to view details</p>
      <p class="placeholder-hint">Click on a span in the tree to see its input, output, and metadata.</p>
    </div>
  </div>
{/if}

<style>
  .span-details {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--vscode-editor-background, #1e1e1e);
    border-left: 1px solid var(--vscode-panel-border, #454545);
  }

  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    background-color: var(--vscode-sideBar-background, #252526);
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .span-name {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--vscode-foreground, #cccccc);
  }

  .close-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--vscode-foreground, #cccccc);
    font-size: 18px;
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background-color: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  }

  .details-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  section {
    margin-bottom: 24px;
  }

  h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
    margin: 0 0 12px 0;
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    padding-bottom: 8px;
  }

  .meta-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .meta-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  dt {
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
    min-width: 80px;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    font-size: 12px;
    color: var(--vscode-foreground, #cccccc);
    word-break: break-word;
  }

  .mono {
    font-family: var(--vscode-editor-font-family, monospace);
  }

  .type-badge {
    background-color: var(--vscode-badge-background, #4d4d4d);
    color: var(--vscode-badge-foreground, #ffffff);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
  }

  .status-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    text-transform: capitalize;
  }

  .status-badge.success {
    background-color: var(--vscode-testing-iconPassed, #73c991);
    color: #000;
  }

  .status-badge.error {
    background-color: var(--vscode-testing-iconFailed, #f14c4c);
    color: #fff;
  }

  .status-badge.running {
    background-color: var(--vscode-progressBar-background, #0078d4);
    color: #fff;
  }

  .no-data {
    color: var(--vscode-descriptionForeground, #8b8b8b);
    font-style: italic;
    font-size: 12px;
    margin: 0;
  }

  .icon {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .icon-person::before { content: '👤'; font-size: 13px; }
  .icon-gear::before { content: '⚙️'; font-size: 13px; }
  .icon-tools::before { content: '🔧'; font-size: 13px; }
  .icon-sparkle::before { content: '✨'; font-size: 13px; }
  .icon-circle-outline::before { content: '○'; font-size: 15px; }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-content {
    text-align: center;
    padding: 32px;
  }

  .placeholder-message {
    font-size: 14px;
    color: var(--vscode-foreground, #cccccc);
    margin: 0 0 8px 0;
  }

  .placeholder-hint {
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
    margin: 0;
  }
</style>
