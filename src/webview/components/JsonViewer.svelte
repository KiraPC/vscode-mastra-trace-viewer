<script lang="ts">
  /**
   * JsonViewer component - Displays JSON data with syntax highlighting
   * Supports expansion, truncation, and copy to clipboard
   */
  
  interface Props {
    data: unknown;
    label: string;
    maxLength?: number;
  }
  
  let { data, label, maxLength = 500 }: Props = $props();
  
  // State for expansion
  let expanded = $state(false);
  let copied = $state(false);
  
  // Format JSON string
  const jsonString = $derived(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  });
  
  // Check if truncation is needed
  const needsTruncation = $derived(jsonString().length > maxLength);
  
  // Get display text
  const displayText = $derived(() => {
    const str = jsonString();
    if (!needsTruncation || expanded) {
      return str;
    }
    return str.substring(0, maxLength) + '...';
  });
  
  // Copy to clipboard
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(jsonString());
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  // Toggle expansion
  function toggleExpand(): void {
    expanded = !expanded;
  }
</script>

<div class="json-viewer">
  <div class="json-header">
    <button 
      type="button"
      class="copy-btn"
      onclick={handleCopy}
      aria-label="Copy {label} to clipboard"
      title="Copy to clipboard"
    >
      {#if copied}
        ✓ Copied
      {:else}
        📋 Copy
      {/if}
    </button>
  </div>
  <pre class="json-content"><code>{@html highlightJson(displayText())}</code></pre>
  {#if needsTruncation}
    <button 
      type="button"
      class="expand-btn"
      onclick={toggleExpand}
    >
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
</div>

<script lang="ts" module>
  /**
   * Simple JSON syntax highlighting
   * Escapes HTML and adds color spans for different value types
   */
  function highlightJson(json: string): string {
    // First escape HTML entities
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Then apply syntax highlighting
    return escaped
      // Strings (must come first to avoid highlighting strings inside keys)
      .replace(/"([^"\\]|\\.)*"/g, (match) => {
        // Check if it's a key (followed by :) or a value
        return `<span class="json-string">${match}</span>`;
      })
      // Numbers
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      // Booleans
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      // Null
      .replace(/\bnull\b/g, '<span class="json-null">null</span>');
  }
</script>

<style>
  .json-viewer {
    border: 1px solid var(--vscode-panel-border, #454545);
    border-radius: 4px;
    overflow: hidden;
  }

  .json-header {
    display: flex;
    justify-content: flex-end;
    padding: 4px 8px;
    background-color: var(--vscode-editor-lineHighlightBackground, rgba(255, 255, 255, 0.04));
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
  }

  .copy-btn {
    padding: 2px 8px;
    font-size: 11px;
    background-color: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #cccccc);
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }

  .copy-btn:hover {
    background-color: var(--vscode-button-secondaryHoverBackground, #45494e);
  }

  .json-content {
    margin: 0;
    padding: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: var(--vscode-editor-background, #1e1e1e);
  }

  code {
    font-family: inherit;
  }

  .expand-btn {
    width: 100%;
    padding: 6px;
    font-size: 11px;
    background-color: var(--vscode-editor-lineHighlightBackground, rgba(255, 255, 255, 0.04));
    color: var(--vscode-textLink-foreground, #3794ff);
    border: none;
    border-top: 1px solid var(--vscode-panel-border, #454545);
    cursor: pointer;
    text-align: center;
  }

  .expand-btn:hover {
    background-color: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    text-decoration: underline;
  }

  /* Syntax highlighting colors */
  :global(.json-string) {
    color: var(--vscode-debugTokenExpression-string, #ce9178);
  }

  :global(.json-number) {
    color: var(--vscode-debugTokenExpression-number, #b5cea8);
  }

  :global(.json-boolean) {
    color: var(--vscode-debugTokenExpression-boolean, #569cd6);
  }

  :global(.json-null) {
    color: var(--vscode-debugTokenExpression-boolean, #569cd6);
  }
</style>
