import * as vscode from 'vscode';
import { ConfigurationManager } from './utils/configManager';
import { MastraApiError } from './models/errors.types';
import { ConnectionStateManager } from './utils/connectionStateManager';
import { MastraClientWrapper } from './api/MastraClientWrapper';
import { TraceListProvider, TraceTreeItem } from './providers/TraceListProvider';
import { TraceViewerPanel } from './providers/TraceViewerPanel';

let connectionManager: ConnectionStateManager | undefined;
let traceListProvider: TraceListProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
	// Create output channel
	const outputChannel = vscode.window.createOutputChannel('Mastra Trace Viewer');
	context.subscriptions.push(outputChannel);

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		100
	);
	statusBarItem.command = 'workbench.action.openSettings';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Get configured endpoint
	const endpoint = ConfigurationManager.getEndpoint();

	// Create API client
	const apiClient = new MastraClientWrapper(endpoint);

	// Create connection manager
	connectionManager = new ConnectionStateManager(
		statusBarItem,
		outputChannel,
		apiClient
	);
	context.subscriptions.push(connectionManager);

	// Create trace list provider and register view
	traceListProvider = new TraceListProvider(apiClient);
	const treeView = vscode.window.createTreeView('mastraTraceList', {
		treeDataProvider: traceListProvider,
		showCollapseAll: true
	});
	context.subscriptions.push(treeView);

	// Register refresh command
	const refreshCommand = vscode.commands.registerCommand(
		'mastraTraceViewer.refresh',
		() => traceListProvider?.refresh()
	);
	context.subscriptions.push(refreshCommand);

	// Register load more command
	const loadMoreCommand = vscode.commands.registerCommand(
		'mastraTraceViewer.loadMore',
		() => traceListProvider?.loadMore()
	);
	context.subscriptions.push(loadMoreCommand);

	// Register save as JSON command
	const saveAsJsonCommand = vscode.commands.registerCommand(
		'mastraTraceViewer.saveAsJson',
		async (item: TraceTreeItem) => {
			if (!item) {
				return;
			}

			let dataToSave: unknown;
			let defaultFileName: string;

			if (item.span && item.span.parentSpanId !== null) {
				// Save only the span (has a parent, so it's not root)
				dataToSave = item.span;
				defaultFileName = `span-${item.span.spanId}.json`;
			} else if (item.trace) {
				// Save the entire trace (either trace node or root span with no parent)
				// Fetch the complete trace with all spans
				const fullTrace = await traceListProvider?.fetchFullTrace(item.trace.traceId);
				dataToSave = fullTrace || item.trace;
				defaultFileName = `trace-${item.trace.traceId}.json`;
			} else {
				return;
			}

			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(defaultFileName),
				filters: { 'JSON': ['json'] }
			});

			if (uri) {
				const content = JSON.stringify(dataToSave, null, 2);
				await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
				vscode.window.showInformationMessage(`Saved to ${uri.fsPath}`);
			}
		}
	);
	context.subscriptions.push(saveAsJsonCommand);

	// Register open-trace command (opens webview panel)
	const openTraceCommand = vscode.commands.registerCommand(
		'mastra-trace-viewer.open-trace',
		async (traceId: string, spanId?: string) => {
			if (!traceId) {
				return;
			}

			const outputChannel = vscode.window.createOutputChannel('Mastra Trace Viewer');

			// Create or reveal panel
			const panel = TraceViewerPanel.createOrShow(traceId, context.extensionUri);

			// Always fetch full trace from API (cache may have incomplete spans)
			outputChannel.appendLine(`Fetching full trace from API: ${traceId}${spanId ? ` (span: ${spanId})` : ''}`);
			panel.sendLoading('Loading trace...');

			const loadTrace = async () => {
				try {
					const trace = await traceListProvider?.fetchFullTrace(traceId);
					if (trace) {
						outputChannel.appendLine(`Trace loaded with ${trace.spans?.length ?? 0} spans`);
						panel.sendTrace(trace, spanId);
					} else {
						throw new Error('Trace not found');
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					vscode.window.showErrorMessage(`Failed to load trace: ${message}`);
					panel.sendError(message);
					outputChannel.appendLine(`Error loading trace ${traceId}: ${message}`);
				}
			};

			// Set up retry handler
			panel.onRetry(loadTrace);

			// Initial load
			await loadTrace();
		}
	);
	context.subscriptions.push(openTraceCommand);

	// Register open JSON command (click on item)
	const openJsonCommand = vscode.commands.registerCommand(
		'mastraTraceViewer.openJson',
		async (item: TraceTreeItem) => {
			if (!item) {
				return;
			}

			let dataToShow: unknown;
			let title: string;

			if (item.span && item.span.parentSpanId !== null) {
				// Show only the span (has a parent, so it's not root)
				dataToShow = item.span;
				title = `Span: ${item.span.name}`;
			} else if (item.trace) {
				// Show the entire trace (either trace node or root span with no parent)
				const fullTrace = await traceListProvider?.fetchFullTrace(item.trace.traceId);
				dataToShow = fullTrace || item.trace;
				title = `Trace: ${item.trace.traceId}`;
			} else {
				return;
			}

			const content = JSON.stringify(dataToShow, null, 2);
			const doc = await vscode.workspace.openTextDocument({
				content,
				language: 'json'
			});
			await vscode.window.showTextDocument(doc, { preview: true });
		}
	);
	context.subscriptions.push(openJsonCommand);

	// Initial connection attempt
	try {
		await connectionManager.connect(endpoint);
		// Load traces after successful connection
		await traceListProvider.refresh();
	} catch (error) {
		// Error handled by ConnectionStateManager
		outputChannel.appendLine(`Activation error: ${error}`);
	}

	// Listen for configuration changes
	const configListener = vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration('mastraTraceViewer.endpoint')) {
			await handleEndpointChange(statusBarItem, outputChannel);
		}
	});

	context.subscriptions.push(configListener);
}

/**
 * Handle endpoint configuration changes
 * Validates new endpoint and notifies user
 */
async function handleEndpointChange(
	statusBarItem: vscode.StatusBarItem, 
	outputChannel: vscode.OutputChannel
): Promise<void> {
	try {
		const newEndpoint = ConfigurationManager.getEndpoint();

		vscode.window.showInformationMessage(
			`Mastra endpoint changed to ${newEndpoint}. Reconnecting...`
		);

		// Create new client and connection manager
		const newApiClient = new MastraClientWrapper(newEndpoint);
		connectionManager = new ConnectionStateManager(
			statusBarItem,
			outputChannel,
			newApiClient
		);

		// Update trace list provider with new client
		traceListProvider?.setApiClient(newApiClient);

		await connectionManager.connect(newEndpoint);
		
		// Refresh traces after reconnection
		await traceListProvider?.refresh();
	} catch (error) {
		if (error instanceof MastraApiError) {
			const selection = await vscode.window.showErrorMessage(
				`Invalid Mastra endpoint configuration: ${error.message}`,
				'Open Settings'
			);

			if (selection === 'Open Settings') {
				vscode.commands.executeCommand(
					'workbench.action.openSettings',
					'mastraTraceViewer.endpoint'
				);
			}
		}
	}
}

export function deactivate() {
	connectionManager?.disconnect();
}
