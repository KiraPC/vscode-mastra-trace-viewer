<script lang="ts">
  /**
   * Loading spinner component
   * Displays a loading indicator with message
   */
  
  interface Props {
    message?: string;
  }
  
  let { message = 'Loading trace...' }: Props = $props();
</script>

<div class="loading-container">
  <div class="spinner"></div>
  <p class="loading-message">{message}</p>
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    gap: 16px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--vscode-progressBar-background, #0078d4);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-message {
    color: var(--vscode-foreground, #cccccc);
    font-size: 14px;
    margin: 0;
  }
</style>
