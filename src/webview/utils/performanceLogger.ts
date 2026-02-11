/**
 * Performance logging utilities for development mode
 * Only logs when running in development mode
 */

// Track development mode - set at build time
let _isDev = false;

/**
 * Set development mode (called during initialization)
 */
export function setDevMode(isDev: boolean): void {
  _isDev = isDev;
}

/**
 * Check if we're in development mode
 */
function isDev(): boolean {
  return _isDev;
}

/**
 * Log performance of a function execution
 * @param label Description of what's being measured
 * @param fn Function to execute and measure
 * @returns The result of the function
 */
export function logPerformance<T>(label: string, fn: () => T): T {
  if (!isDev()) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * Log async performance of a function execution
 * @param label Description of what's being measured
 * @param fn Async function to execute and measure
 * @returns Promise with the result of the function
 */
export async function logPerformanceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev()) {
    return fn();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * Log render performance metrics
 * @param spanCount Number of spans rendered
 * @param renderTime Time taken to render in milliseconds
 */
export function measureRender(spanCount: number, renderTime: number): void {
  if (!isDev()) return;

  const spansPerMs = spanCount / renderTime;
  console.log(
    `[Perf] Rendered ${spanCount} spans in ${renderTime.toFixed(2)}ms ` +
      `(${spansPerMs.toFixed(1)} spans/ms)`
  );
}

/**
 * Log tree flatten performance metrics
 * @param totalNodes Total nodes in tree
 * @param visibleNodes Number of visible nodes after flattening
 * @param flattenTime Time taken to flatten in milliseconds
 */
export function measureFlatten(totalNodes: number, visibleNodes: number, flattenTime: number): void {
  if (!isDev()) return;

  console.log(
    `[Perf] Flattened tree: ${visibleNodes}/${totalNodes} visible nodes in ${flattenTime.toFixed(2)}ms`
  );
}

/**
 * Log virtual scroll metrics
 * @param startIndex First visible item index
 * @param endIndex Last visible item index
 * @param totalItems Total items in list
 */
export function logScrollMetrics(startIndex: number, endIndex: number, totalItems: number): void {
  if (!isDev()) return;

  const visibleCount = endIndex - startIndex;
  const percentVisible = ((visibleCount / totalItems) * 100).toFixed(1);

  console.log(
    `[Perf] Virtual scroll: showing ${startIndex}-${endIndex} of ${totalItems} ` +
      `(${percentVisible}% visible in DOM)`
  );
}

/**
 * Create a performance mark for later measurement
 * @param name Name of the mark
 */
export function markStart(name: string): void {
  if (!isDev()) return;
  performance.mark(`${name}-start`);
}

/**
 * Measure time since a performance mark
 * @param name Name of the mark (should match markStart)
 */
export function markEnd(name: string): void {
  if (!isDev()) return;

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(endMark);

  try {
    const measure = performance.measure(name, startMark, endMark);
    console.log(`[Perf] ${name}: ${measure.duration.toFixed(2)}ms`);
  } catch {
    // Marks may not exist
  }

  // Cleanup
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(name);
}
