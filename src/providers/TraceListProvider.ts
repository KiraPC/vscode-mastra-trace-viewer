/**
 * TraceListProvider - TreeDataProvider for Mastra traces sidebar view
 */

import * as vscode from 'vscode';
import { MastraClientWrapper } from '../api/MastraClientWrapper';
import type { Trace, Span, PaginationInfo } from '../models/trace.types';
import { TraceCache } from '../utils/traceCache';
import {
  formatTraceTimestamp,
  formatISOTimestamp,
  truncateString,
} from '../utils/formatters';

/**
 * Get the root span from a trace (span with null parentSpanId)
 */
function getRootSpan(trace: Trace): Span | undefined {
  return trace.spans?.find((s) => !s.parentSpanId);
}

/**
 * Extract status from trace root span
 */
function getTraceStatus(trace: Trace): string {
  const rootSpan = getRootSpan(trace);
  return rootSpan?.status || 'unknown';
}

/**
 * Get timestamp from trace (startedAt from root span or exportedAt)
 */
function getTraceTimestamp(trace: Trace): string | undefined {
  const rootSpan = getRootSpan(trace);
  if (rootSpan?.startedAt) {
    return typeof rootSpan.startedAt === 'string'
      ? rootSpan.startedAt
      : rootSpan.startedAt.toISOString();
  }
  return trace.exportedAt;
}

/**
 * Get status-based icon for a trace
 */
function getTraceStatusIcon(trace: Trace): vscode.ThemeIcon {
  const status = getTraceStatus(trace);

  switch (status) {
    case 'success':
      return new vscode.ThemeIcon(
        'check',
        new vscode.ThemeColor('testing.iconPassed')
      );
    case 'error':
      return new vscode.ThemeIcon(
        'error',
        new vscode.ThemeColor('testing.iconFailed')
      );
    case 'running':
    case 'pending':
      return new vscode.ThemeIcon('sync~spin');
    default:
      return new vscode.ThemeIcon('pulse');
  }
}

/**
 * Build comprehensive tooltip for a trace
 */
function buildTraceTooltip(trace: Trace): string {
  const lines: string[] = [];
  const rootSpan = getRootSpan(trace);
  const status = getTraceStatus(trace);
  const timestamp = getTraceTimestamp(trace);
  const spanCount = trace.spans?.length || 0;

  lines.push(`Trace ID: ${trace.traceId}`);

  if (timestamp) {
    lines.push(`Timestamp: ${formatISOTimestamp(timestamp)}`);
  }

  lines.push(`Status: ${status}`);
  lines.push(`Spans: ${spanCount}`);

  if (rootSpan?.name) {
    lines.push(`Root Span: ${rootSpan.name}`);
  }

  return lines.join('\n');
}

/**
 * Tree item representing a trace, span, or action in the sidebar
 */
export class TraceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly trace?: Trace,
    public readonly span?: Span,
    public readonly isLoadMore?: boolean
  ) {
    super(label, collapsibleState);

    if (isLoadMore) {
      // This is a "Load More" action item
      this.contextValue = 'loadMore';
      this.iconPath = new vscode.ThemeIcon('ellipsis');
      this.command = {
        command: 'mastraTraceViewer.loadMore',
        title: 'Load More Traces',
      };
    } else if (trace && !span) {
      // This is a trace item
      this.contextValue = 'trace';
      this.iconPath = getTraceStatusIcon(trace);
      this.tooltip = buildTraceTooltip(trace);
      this.description = this.getTraceDescription(trace);
      this.command = {
        command: 'mastra-trace-viewer.open-trace',
        title: 'Open Trace',
        arguments: [trace.traceId]
      };
    } else if (span) {
      // This is a span item
      this.contextValue = 'span';
      this.iconPath = this.getSpanIcon(span);
      this.tooltip = `${span.spanType}: ${span.name}`;
      this.description = span.status || '';
      this.command = {
        command: 'mastra-trace-viewer.open-trace',
        title: 'Open Trace',
        arguments: [span.traceId, span.spanId]
      };
    }
  }

  private getTraceDescription(trace: Trace): string {
    const timestamp = getTraceTimestamp(trace);
    if (timestamp) {
      return formatTraceTimestamp(timestamp);
    }
    // Fallback: show span count if no timestamp
    const spanCount = trace.spans?.length || 0;
    return `${spanCount} span${spanCount !== 1 ? 's' : ''}`;
  }

  private getSpanIcon(span: Span): vscode.ThemeIcon {
    switch (span.spanType) {
      case 'agent_run':
        return new vscode.ThemeIcon('hubot');
      case 'llm_call':
        return new vscode.ThemeIcon('comment-discussion');
      case 'tool_streaming':
        return new vscode.ThemeIcon('tools');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * TreeDataProvider for Mastra traces
 */
export class TraceListProvider implements vscode.TreeDataProvider<TraceTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TraceTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<TraceTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TraceTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private traces: Trace[] = [];
  private pagination: PaginationInfo | undefined;
  private currentPage = 0;
  private readonly perPage = 50;
  private isLoading = false;
  private isLoadingMore = false;
  private cache: TraceCache;

  constructor(private apiClient: MastraClientWrapper) {
    this.cache = new TraceCache();
  }

  /**
   * Refresh the trace list from API (resets to page 1)
   */
  async refresh(): Promise<void> {
    this.isLoading = true;
    this.currentPage = 0;
    this.traces = [];
    this._onDidChangeTreeData.fire();

    try {
      const result = await this.apiClient.fetchTraces({
        page: this.currentPage,
        perPage: this.perPage,
      });
      this.traces = result.traces;
      this.pagination = result.pagination;

      // Cache each trace for future retrieval
      for (const trace of this.traces) {
        this.cache.set(trace.traceId, trace);
      }
    } catch (error) {
      this.traces = [];
      this.pagination = undefined;
      // Error is handled by ConnectionStateManager
    } finally {
      this.isLoading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * Load more traces (next page)
   */
  async loadMore(): Promise<void> {
    if (!this.pagination?.hasMore || this.isLoadingMore) {
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;
    this._onDidChangeTreeData.fire();

    try {
      const result = await this.apiClient.fetchTraces({
        page: this.currentPage,
        perPage: this.perPage,
      });
      this.traces = [...this.traces, ...result.traces];
      this.pagination = result.pagination;

      // Cache each new trace for future retrieval
      for (const trace of result.traces) {
        this.cache.set(trace.traceId, trace);
      }
    } catch (error) {
      // Revert page on error
      this.currentPage--;
    } finally {
      this.isLoadingMore = false;
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * Update the API client (e.g., after endpoint change)
   * @param apiClient New API client instance
   * @param clearCache Whether to clear the trace cache (default: true)
   */
  setApiClient(apiClient: MastraClientWrapper, clearCache = true): void {
    this.apiClient = apiClient;
    if (clearCache) {
      this.cache.clear();
    }
  }

  /**
   * Retrieve a trace from the cache by ID
   * @param id The trace ID to retrieve
   * @returns The cached trace or undefined if not found
   */
  getTraceFromCache(id: string): Trace | undefined {
    return this.cache.get(id);
  }

  /**
   * Fetch the complete trace with all spans from API
   * @param traceId The trace ID to fetch
   * @returns The complete trace or undefined on error
   */
  async fetchFullTrace(traceId: string): Promise<Trace | undefined> {
    try {
      const fullTrace = await this.apiClient.fetchTraceById(traceId);
      this.cache.set(traceId, fullTrace);
      return fullTrace;
    } catch {
      return undefined;
    }
  }

  getTreeItem(element: TraceTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TraceTreeItem): Thenable<TraceTreeItem[]> {
    if (this.isLoading) {
      return Promise.resolve([
        new TraceTreeItem('Loading...', vscode.TreeItemCollapsibleState.None)
      ]);
    }

    // If expanding a trace, we need to fetch full trace details
    if (element && element.trace && !element.span) {
      return this.getTraceChildren(element);
    }

    // If expanding a span, show its children
    if (element && element.trace && element.span) {
      return this.getSpanChildren(element);
    }

    if (!element) {
      // Root level - show traces
      if (this.traces.length === 0) {
        return Promise.resolve([
          new TraceTreeItem('No traces found', vscode.TreeItemCollapsibleState.None)
        ]);
      }

      // Sort traces by timestamp descending (newest first)
      const sortedTraces = [...this.traces].sort((a, b) => {
        const timestampA = getTraceTimestamp(a);
        const timestampB = getTraceTimestamp(b);
        if (!timestampA) return 1;
        if (!timestampB) return -1;
        return new Date(timestampB).getTime() - new Date(timestampA).getTime();
      });

      const items: TraceTreeItem[] = sortedTraces.map(trace => {
        const rootSpan = getRootSpan(trace);
        const rawLabel = rootSpan?.name || trace.traceId;
        const label = truncateString(rawLabel, 40);
        const hasChildren = (trace.spans?.length || 0) > 0;
        
        return new TraceTreeItem(
          label,
          hasChildren 
            ? vscode.TreeItemCollapsibleState.Collapsed 
            : vscode.TreeItemCollapsibleState.None,
          trace
        );
      });

      // Add "Load More" item if there are more pages
      if (this.pagination?.hasMore) {
        const loadMoreLabel = this.isLoadingMore 
          ? 'Loading more...' 
          : `Load more (${this.traces.length} of ${this.pagination.total})`;
        items.push(new TraceTreeItem(
          loadMoreLabel,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          true
        ));
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  /**
   * Get children for a trace element (fetch full trace if needed, then show root spans)
   */
  private async getTraceChildren(element: TraceTreeItem): Promise<TraceTreeItem[]> {
    const trace = element.trace!;
    
    // Check if we have full trace data in cache or need to fetch
    let fullTrace = this.cache.get(trace.traceId);
    
    // If cached trace has few spans, fetch the complete trace
    const cachedSpansCount = fullTrace?.spans?.length || 0;
    if (!fullTrace || cachedSpansCount <= 1) {
      try {
        fullTrace = await this.apiClient.fetchTraceById(trace.traceId);
        this.cache.set(trace.traceId, fullTrace);
        
        // Update the trace in our local array too
        const idx = this.traces.findIndex(t => t.traceId === trace.traceId);
        if (idx !== -1) {
          this.traces[idx] = fullTrace;
        }
      } catch {
        // If fetch fails, use whatever we have
        fullTrace = trace;
      }
    }

    const allSpans = fullTrace.spans || [];
    
    // Show only root spans (no parent)
    const rootSpans = allSpans.filter(s => !s.parentSpanId);

    return rootSpans.map(span => {
      const hasChildren = allSpans.some(s => s.parentSpanId === span.spanId);
      
      return new TraceTreeItem(
        span.name,
        hasChildren 
          ? vscode.TreeItemCollapsibleState.Collapsed 
          : vscode.TreeItemCollapsibleState.None,
        fullTrace,
        span
      );
    });
  }

  /**
   * Get children for a span element (show direct child spans)
   */
  private getSpanChildren(element: TraceTreeItem): Promise<TraceTreeItem[]> {
    const trace = element.trace!;
    const parentSpan = element.span!;
    const allSpans = trace.spans || [];

    // Show direct children of this span
    const childSpans = allSpans.filter(s => s.parentSpanId === parentSpan.spanId);

    return Promise.resolve(
      childSpans.map(span => {
        const hasChildren = allSpans.some(s => s.parentSpanId === span.spanId);
        
        return new TraceTreeItem(
          span.name,
          hasChildren 
            ? vscode.TreeItemCollapsibleState.Collapsed 
            : vscode.TreeItemCollapsibleState.None,
          trace,
          span
        );
      })
    );
  }
}
