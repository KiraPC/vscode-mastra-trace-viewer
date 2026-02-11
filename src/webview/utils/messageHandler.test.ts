/**
 * Tests for message handler utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExtensionMessage } from '../../models/messages.types';

// Mock acquireVsCodeApi before importing module
const mockPostMessage = vi.fn();
const mockGetState = vi.fn();
const mockSetState = vi.fn();

vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: mockPostMessage,
  getState: mockGetState,
  setState: mockSetState,
}));

// Import after mocking
import { sendMessage, onMessage } from './messageHandler';

describe('messageHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send ready message', () => {
      sendMessage({ type: 'ready' });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' });
    });

    it('should send retry message', () => {
      sendMessage({ type: 'retry' });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'retry' });
    });

    it('should send message only once per call', () => {
      sendMessage({ type: 'ready' });
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('onMessage', () => {
    it('should add message event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      const handler = vi.fn();
      onMessage(handler);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('should return unsubscribe function', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const handler = vi.fn();
      const unsubscribe = onMessage(handler);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should call handler with message data', () => {
      const handler = vi.fn();
      onMessage(handler);
      
      const testMessage: ExtensionMessage = { 
        type: 'loadTrace', 
        payload: { trace: { traceId: 'test', spans: [] } }
      };
      
      const event = new MessageEvent('message', { data: testMessage });
      window.dispatchEvent(event);
      
      expect(handler).toHaveBeenCalledWith(testMessage);
    });

    it('should handle error messages', () => {
      const handler = vi.fn();
      onMessage(handler);
      
      const testMessage: ExtensionMessage = { 
        type: 'error', 
        payload: { message: 'Test error' }
      };
      
      const event = new MessageEvent('message', { data: testMessage });
      window.dispatchEvent(event);
      
      expect(handler).toHaveBeenCalledWith(testMessage);
    });

    it('should handle loading messages', () => {
      const handler = vi.fn();
      onMessage(handler);
      
      const testMessage: ExtensionMessage = { 
        type: 'loading', 
        payload: { message: 'Loading...' }
      };
      
      const event = new MessageEvent('message', { data: testMessage });
      window.dispatchEvent(event);
      
      expect(handler).toHaveBeenCalledWith(testMessage);
    });

    it('should not call handler after unsubscribe', () => {
      const handler = vi.fn();
      const unsubscribe = onMessage(handler);
      
      unsubscribe();
      
      const event = new MessageEvent('message', { 
        data: { type: 'ready' }
      });
      window.dispatchEvent(event);
      
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
