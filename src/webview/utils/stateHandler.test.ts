/**
 * Tests for stateHandler
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WebviewState } from '../../models/webviewState.types';

// Mock the messageHandler module
vi.mock('./messageHandler', () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from './messageHandler';
import { initStateHandler, triggerStateSave } from './stateHandler';

describe('stateHandler', () => {
  const mockGetState = vi.fn(() => ({
    expandedSpans: ['span-1'],
    scrollPosition: 100,
    selectedSpanId: 'span-1' as string | null
  }));
  const mockRestoreState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initStateHandler', () => {
    it('should return a cleanup function', () => {
      const cleanup = initStateHandler(mockGetState, mockRestoreState);
      
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should save state on visibility change to hidden', () => {
      const cleanup = initStateHandler(mockGetState, mockRestoreState);
      
      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(sendMessage).toHaveBeenCalledWith({
        type: 'saveState',
        payload: mockGetState()
      });
      
      cleanup();
    });

    it('should restore state when receiving restoreState message', () => {
      const cleanup = initStateHandler(mockGetState, mockRestoreState);
      
      const stateToRestore: WebviewState = {
        expandedSpans: ['span-a'],
        scrollPosition: 200,
        selectedSpanId: 'span-a'
      };
      
      // Simulate receiving message from extension
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'restoreState',
          payload: stateToRestore
        }
      }));
      
      expect(mockRestoreState).toHaveBeenCalledWith(stateToRestore);
      
      cleanup();
    });

    it('should not restore state for non-restoreState messages', () => {
      const cleanup = initStateHandler(mockGetState, mockRestoreState);
      
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'loadTrace',
          payload: { trace: {} }
        }
      }));
      
      expect(mockRestoreState).not.toHaveBeenCalled();
      
      cleanup();
    });

    it('should save state periodically', () => {
      const cleanup = initStateHandler(mockGetState, mockRestoreState);
      
      // Advance to trigger interval (5 seconds + debounce 500ms)
      vi.advanceTimersByTime(5500);
      
      expect(sendMessage).toHaveBeenCalledWith({
        type: 'saveState',
        payload: mockGetState()
      });
      
      cleanup();
    });
  });

  describe('triggerStateSave', () => {
    it('should trigger a debounced state save', () => {
      initStateHandler(mockGetState, mockRestoreState);
      
      triggerStateSave();
      
      // Should not send immediately
      expect(sendMessage).not.toHaveBeenCalled();
      
      // Advance past debounce time
      vi.advanceTimersByTime(600);
      
      expect(sendMessage).toHaveBeenCalledWith({
        type: 'saveState',
        payload: mockGetState()
      });
    });

    it('should debounce multiple calls', () => {
      initStateHandler(mockGetState, mockRestoreState);
      
      triggerStateSave();
      vi.advanceTimersByTime(200);
      triggerStateSave();
      vi.advanceTimersByTime(200);
      triggerStateSave();
      vi.advanceTimersByTime(600);
      
      // Should only have called once after debounce
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
