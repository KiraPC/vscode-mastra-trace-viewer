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
