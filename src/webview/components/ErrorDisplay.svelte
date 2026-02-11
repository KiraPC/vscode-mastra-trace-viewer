<script lang="ts">
  /**
   * Error display component
   * Shows error message with retry button
   */
  import { sendMessage } from '../utils/messageHandler';
  
  interface Props {
    message: string;
  }
  
  let { message }: Props = $props();
  
  function handleRetry() {
    sendMessage({ type: 'retry' });
  }
</script>

<div class="error-container">
  <div class="error-icon">
    <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
    </svg>
  </div>
  <h2 class="error-title">Failed to load trace</h2>
  <p class="error-message">{message}</p>
  <button class="retry-button" onclick={handleRetry}>
    Retry
  </button>
</div>

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    gap: 12px;
    padding: 24px;
    text-align: center;
  }

  .error-icon {
    color: var(--vscode-errorForeground, #f14c4c);
  }

  .error-title {
    color: var(--vscode-foreground, #cccccc);
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .error-message {
    color: var(--vscode-descriptionForeground, #8b8b8b);
    font-size: 14px;
    margin: 0;
    max-width: 400px;
  }

  .retry-button {
    margin-top: 8px;
    padding: 8px 16px;
    background-color: var(--vscode-button-background, #0078d4);
    color: var(--vscode-button-foreground, #ffffff);
    border: none;
    border-radius: 2px;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .retry-button:hover {
    background-color: var(--vscode-button-hoverBackground, #026ec1);
  }

  .retry-button:focus {
    outline: 1px solid var(--vscode-focusBorder, #007fd4);
    outline-offset: 2px;
  }
</style>
