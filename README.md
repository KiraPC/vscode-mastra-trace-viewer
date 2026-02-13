# Mastra Trace Viewer

A Visual Studio Code extension for viewing and analyzing Mastra tracing data.

## Why This Extension?

While working with [Mastra](https://mastra.ai), I found myself constantly switching between my editor and the browser to view agent run traces. I also needed to export traces as JSON to compare two different agent configurations—one wasn't producing the expected output. By exporting both traces to JSON, I could have Copilot analyze the differences and help me refine the prompt to get the desired result.

This extension solves both problems: trace visualization directly in VS Code and JSON export for deeper analysis.

## Features

- View Mastra traces in the VSCode sidebar
- Hierarchical span tree display
- Detailed span information with input/output
- Search and filter capabilities
- Multiple trace tab support

## Configuration

The extension can be configured via VS Code settings. Open settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux) and search for "Mastra".

| Setting | Default | Description |
|---------|---------|-------------|
| `mastraTraceViewer.endpoint` | `http://localhost:4100` | The URL of your Mastra instance for trace retrieval. Use `http://localhost:4111` for local development or your remote Mastra URL for deployed instances. |

**Example configurations:**

```json
{
  "mastraTraceViewer.endpoint": "http://localhost:4111"
}
```

For remote instances:

```json
{
  "mastraTraceViewer.endpoint": "https://mastra.example.com"
}
```

## Copilot Integration & Export

### Using Traces with Copilot Chat

There are two ways to share trace data with Copilot:

#### Method 1: Drag via Editor (Recommended for Copilot)

Due to VSCode API limitations, direct drag from TreeView to Copilot Chat is not supported. Use this workaround:

1. Drag a trace from the "Mastra Traces" sidebar into any **text editor**
2. The trace JSON file path is inserted in the editor
3. From the editor, drag the opened file's **tab** into Copilot Chat
4. Copilot will recognize the JSON file and attach it as context

#### Method 2: Copy & Paste

Right-click any trace and select **Copy Trace JSON**, then paste directly into Copilot Chat with Ctrl/Cmd+V.

**Example prompts:**
- "Analyze this trace and explain what the agent did"
- "Why did this agent call the tool multiple times?"
- "Find any errors or unexpected behavior in this trace"
- "Summarize the LLM calls in this trace"

### Drop into Text Editors

Drag traces directly into any VSCode text editor. The file path to the trace JSON is inserted at the cursor position. The trace is saved as a temporary JSON file that you can open or reference.

### Save as JSON

Right-click any trace or span and select **Save as JSON** to save the data to a file for offline analysis or comparison.

## Development Setup

### Prerequisites

- Node.js 22.x or higher
- npm
- Visual Studio Code

### Installation

```bash
npm install
```

### Building

Build both extension and webview:

```bash
npm run compile
```

Watch mode for development:

```bash
npm run watch
```

### Running the Extension

1. Open the project in VSCode
2. Press `F5` to launch the Extension Development Host
3. The extension will appear in the Activity Bar with "Mastra Traces" view

### Testing

Run unit tests:

```bash
npm test
```

Run tests once:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

### Project Structure

```
src/
├── extension.ts          # Extension entry point
├── api/                  # Mastra API client
├── models/               # Type definitions
├── providers/            # VSCode tree/webview providers
├── utils/                # Shared utilities
├── webview/             # Svelte webview application
│   ├── components/      # UI components
│   ├── stores/          # State management
│   └── utils/           # Webview utilities
└── test/
    ├── unit/            # Vitest unit tests
    └── integration/     # VSCode integration tests

build/
└── vite.config.ts       # Vite configuration for webview
```

## Architecture

### Dual Build System

- **Extension**: Built with esbuild (Node.js environment)
- **Webview**: Built with Vite + Svelte (browser environment)

### Lazy Activation

Extension activates only when the Mastra Traces view is opened (`onView:mastraTraceList`).

### Technology Stack

- TypeScript (strict mode)
- Svelte 5 for webview UI
- Vitest for unit testing
- VSCode Extension API

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and coding standards.

## License

MIT
