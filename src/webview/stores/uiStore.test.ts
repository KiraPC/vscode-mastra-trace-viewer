/**
 * Tests for uiStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  loadingStore,
  loadingMessageStore,
  errorStore,
  expandedSpans,
  focusedSpanId,
  selectedSpanId,
  scrollPosition,
  viewMode,
  setLoading,
  clearLoading,
  setError,
  clearError,
  clearUIState,
  toggleExpand,
  expandAll,
  collapseAll,
  isExpanded,
  setFocusedSpan,
  setSelectedSpan,
  clearSelection,
  setScrollPosition,
  getState,
  restoreState,
  toggleViewMode,
  setViewMode,
} from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    clearUIState();
    collapseAll();
    setFocusedSpan(null);
    clearSelection();
    setScrollPosition(0);
  });

  describe('loadingStore', () => {
    it('should start as false after clearUIState', () => {
      expect(get(loadingStore)).toBe(false);
    });

    it('should be true after setLoading', () => {
      setLoading();
      expect(get(loadingStore)).toBe(true);
    });

    it('should be false after clearLoading', () => {
      setLoading();
      clearLoading();
      expect(get(loadingStore)).toBe(false);
    });
  });

  describe('loadingMessageStore', () => {
    it('should have default message after setLoading', () => {
      setLoading();
      expect(get(loadingMessageStore)).toBe('Loading trace...');
    });

    it('should have custom message when provided', () => {
      setLoading('Fetching data...');
      expect(get(loadingMessageStore)).toBe('Fetching data...');
    });
  });

  describe('errorStore', () => {
    it('should start as null after clearUIState', () => {
      expect(get(errorStore)).toBeNull();
    });

    it('should have error message after setError', () => {
      setError('Connection failed');
      expect(get(errorStore)).toBe('Connection failed');
    });

    it('should be null after clearError', () => {
      setError('Error');
      clearError();
      expect(get(errorStore)).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should clear error when called', () => {
      setError('Error');
      setLoading();
      expect(get(errorStore)).toBeNull();
    });
  });

  describe('setError', () => {
    it('should clear loading when called', () => {
      setLoading();
      setError('Error');
      expect(get(loadingStore)).toBe(false);
    });
  });

  describe('clearUIState', () => {
    it('should clear both loading and error', () => {
      setLoading();
      setError('Error');
      clearUIState();
      
      expect(get(loadingStore)).toBe(false);
      expect(get(errorStore)).toBeNull();
    });
  });

  describe('reactivity', () => {
    it('should notify loading subscribers', () => {
      const values: boolean[] = [];
      const unsubscribe = loadingStore.subscribe((value) => {
        values.push(value);
      });

      setLoading();
      clearLoading();

      unsubscribe();

      expect(values).toContain(true);
      expect(values).toContain(false);
    });

    it('should notify error subscribers', () => {
      const values: (string | null)[] = [];
      const unsubscribe = errorStore.subscribe((value) => {
        values.push(value);
      });

      setError('Test error');
      clearError();

      unsubscribe();

      expect(values).toContain('Test error');
      expect(values).toContain(null);
    });
  });

  describe('expandedSpans', () => {
    it('should start as empty set', () => {
      expect(get(expandedSpans).size).toBe(0);
    });

    it('should add spanId when toggled from collapsed', () => {
      toggleExpand('span-1');
      expect(get(expandedSpans).has('span-1')).toBe(true);
    });

    it('should remove spanId when toggled from expanded', () => {
      toggleExpand('span-1');
      toggleExpand('span-1');
      expect(get(expandedSpans).has('span-1')).toBe(false);
    });

    it('should handle multiple spans independently', () => {
      toggleExpand('span-1');
      toggleExpand('span-2');
      
      expect(get(expandedSpans).has('span-1')).toBe(true);
      expect(get(expandedSpans).has('span-2')).toBe(true);
      
      toggleExpand('span-1');
      expect(get(expandedSpans).has('span-1')).toBe(false);
      expect(get(expandedSpans).has('span-2')).toBe(true);
    });
  });

  describe('expandAll', () => {
    it('should expand all provided spanIds', () => {
      expandAll(['span-1', 'span-2', 'span-3']);
      
      expect(get(expandedSpans).has('span-1')).toBe(true);
      expect(get(expandedSpans).has('span-2')).toBe(true);
      expect(get(expandedSpans).has('span-3')).toBe(true);
    });

    it('should replace existing expanded spans', () => {
      toggleExpand('old-span');
      expandAll(['new-span-1', 'new-span-2']);
      
      expect(get(expandedSpans).has('old-span')).toBe(false);
      expect(get(expandedSpans).has('new-span-1')).toBe(true);
    });
  });

  describe('collapseAll', () => {
    it('should collapse all spans', () => {
      expandAll(['span-1', 'span-2', 'span-3']);
      collapseAll();
      
      expect(get(expandedSpans).size).toBe(0);
    });
  });

  describe('isExpanded', () => {
    it('should return true for expanded span', () => {
      toggleExpand('span-1');
      expect(isExpanded('span-1')).toBe(true);
    });

    it('should return false for collapsed span', () => {
      expect(isExpanded('span-1')).toBe(false);
    });
  });

  describe('focusedSpanId', () => {
    it('should start as null', () => {
      expect(get(focusedSpanId)).toBeNull();
    });

    it('should update when setFocusedSpan is called', () => {
      setFocusedSpan('span-1');
      expect(get(focusedSpanId)).toBe('span-1');
    });

    it('should clear when set to null', () => {
      setFocusedSpan('span-1');
      setFocusedSpan(null);
      expect(get(focusedSpanId)).toBeNull();
    });
  });

  describe('selectedSpanId', () => {
    it('should start as null', () => {
      expect(get(selectedSpanId)).toBeNull();
    });

    it('should update when setSelectedSpan is called', () => {
      setSelectedSpan('span-1');
      expect(get(selectedSpanId)).toBe('span-1');
    });

    it('should update to new selection', () => {
      setSelectedSpan('span-1');
      setSelectedSpan('span-2');
      expect(get(selectedSpanId)).toBe('span-2');
    });

    it('should clear when clearSelection is called', () => {
      setSelectedSpan('span-1');
      clearSelection();
      expect(get(selectedSpanId)).toBeNull();
    });

    it('should clear when setSelectedSpan is called with null', () => {
      setSelectedSpan('span-1');
      setSelectedSpan(null);
      expect(get(selectedSpanId)).toBeNull();
    });
  });

  describe('scrollPosition', () => {
    it('should start as 0', () => {
      expect(get(scrollPosition)).toBe(0);
    });

    it('should update when setScrollPosition is called', () => {
      setScrollPosition(100);
      expect(get(scrollPosition)).toBe(100);
    });

    it('should update to new position', () => {
      setScrollPosition(100);
      setScrollPosition(250);
      expect(get(scrollPosition)).toBe(250);
    });
  });

  describe('getState', () => {
    it('should return current state as WebviewState', () => {
      toggleExpand('span-1');
      toggleExpand('span-2');
      setSelectedSpan('span-1');
      setScrollPosition(150);

      const state = getState();

      expect(state.expandedSpans).toContain('span-1');
      expect(state.expandedSpans).toContain('span-2');
      expect(state.selectedSpanId).toBe('span-1');
      expect(state.scrollPosition).toBe(150);
    });

    it('should return empty state when nothing is set', () => {
      const state = getState();

      expect(state.expandedSpans).toEqual([]);
      expect(state.selectedSpanId).toBeNull();
      expect(state.scrollPosition).toBe(0);
    });
  });

  describe('restoreState', () => {
    it('should restore expandedSpans from array', () => {
      restoreState({
        expandedSpans: ['span-a', 'span-b'],
        scrollPosition: 0,
        selectedSpanId: null
      });

      expect(get(expandedSpans).has('span-a')).toBe(true);
      expect(get(expandedSpans).has('span-b')).toBe(true);
    });

    it('should restore selectedSpanId', () => {
      restoreState({
        expandedSpans: [],
        scrollPosition: 0,
        selectedSpanId: 'span-test'
      });

      expect(get(selectedSpanId)).toBe('span-test');
    });

    it('should restore scrollPosition', () => {
      restoreState({
        expandedSpans: [],
        scrollPosition: 500,
        selectedSpanId: null
      });

      expect(get(scrollPosition)).toBe(500);
    });

    it('should restore complete state', () => {
      restoreState({
        expandedSpans: ['span-1', 'span-2'],
        scrollPosition: 300,
        selectedSpanId: 'span-1'
      });

      expect(get(expandedSpans).has('span-1')).toBe(true);
      expect(get(expandedSpans).has('span-2')).toBe(true);
      expect(get(selectedSpanId)).toBe('span-1');
      expect(get(scrollPosition)).toBe(300);
    });

    it('should overwrite existing state', () => {
      toggleExpand('old-span');
      setSelectedSpan('old-span');
      setScrollPosition(999);

      restoreState({
        expandedSpans: ['new-span'],
        scrollPosition: 100,
        selectedSpanId: 'new-span'
      });

      expect(get(expandedSpans).has('old-span')).toBe(false);
      expect(get(expandedSpans).has('new-span')).toBe(true);
      expect(get(selectedSpanId)).toBe('new-span');
      expect(get(scrollPosition)).toBe(100);
    });
  });

  describe('viewMode', () => {
    beforeEach(() => {
      setViewMode('tree');
    });

    it('should default to tree mode', () => {
      expect(get(viewMode)).toBe('tree');
    });

    it('should toggle from tree to json', () => {
      toggleViewMode();
      expect(get(viewMode)).toBe('json');
    });

    it('should toggle from json to tree', () => {
      setViewMode('json');
      toggleViewMode();
      expect(get(viewMode)).toBe('tree');
    });

    it('should set mode explicitly', () => {
      setViewMode('json');
      expect(get(viewMode)).toBe('json');
      setViewMode('tree');
      expect(get(viewMode)).toBe('tree');
    });
  });
});
