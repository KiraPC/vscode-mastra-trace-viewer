declare module 'svelte-virtual-list' {
  import type { SvelteComponent } from 'svelte';

  interface VirtualListProps<T> {
    items: T[];
    height?: string;
    itemHeight?: number;
    start?: number;
    end?: number;
  }

  export default class VirtualList<T = unknown> extends SvelteComponent<VirtualListProps<T>> {}

  export function notifyRefresh(): void;
}
