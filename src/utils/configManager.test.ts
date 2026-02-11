import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigurationManager } from './configManager';
import { MastraApiError } from '../models/errors.types';

// Mock vscode module
const mockGet = vi.fn();
const mockInspect = vi.fn();

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: mockGet,
      inspect: mockInspect,
    })),
  },
}));

describe('ConfigurationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
    mockInspect.mockReset();
  });

  describe('getEndpoint', () => {
    it('should return configured endpoint when present', () => {
      mockGet.mockReturnValue('http://custom.local:4111');

      const result = ConfigurationManager.getEndpoint();

      expect(result).toBe('http://custom.local:4111');
    });

    it('should return default when no setting configured', () => {
      mockGet.mockImplementation((_key, defaultValue) => defaultValue);

      const result = ConfigurationManager.getEndpoint();

      expect(result).toBe('http://localhost:4111');
    });

    it('should validate returned endpoint', () => {
      mockGet.mockReturnValue('invalid-url');

      expect(() => ConfigurationManager.getEndpoint()).toThrow(MastraApiError);
    });

    it('should normalize URL by removing trailing slash', () => {
      mockGet.mockReturnValue('http://localhost:4111/');

      const result = ConfigurationManager.getEndpoint();

      expect(result).toBe('http://localhost:4111');
    });
  });

  describe('validateEndpoint', () => {
    it('should accept valid http URLs', () => {
      const result = ConfigurationManager.validateEndpoint('http://localhost:4111');

      expect(result).toBe('http://localhost:4111');
    });

    it('should accept valid https URLs', () => {
      const result = ConfigurationManager.validateEndpoint('https://mastra.example.com');

      expect(result).toBe('https://mastra.example.com');
    });

    it('should accept URLs with ports', () => {
      const result = ConfigurationManager.validateEndpoint('http://localhost:8080');

      expect(result).toBe('http://localhost:8080');
    });

    it('should accept URLs with paths', () => {
      const result = ConfigurationManager.validateEndpoint('http://localhost:4111/api/v1');

      expect(result).toBe('http://localhost:4111/api/v1');
    });

    it('should trim whitespace', () => {
      const result = ConfigurationManager.validateEndpoint('  http://localhost:4111  ');

      expect(result).toBe('http://localhost:4111');
    });

    it('should remove trailing slash', () => {
      const result = ConfigurationManager.validateEndpoint('http://localhost:4111/');

      expect(result).toBe('http://localhost:4111');
    });

    it('should reject empty string', () => {
      expect(() => ConfigurationManager.validateEndpoint('')).toThrow(MastraApiError);
      expect(() => ConfigurationManager.validateEndpoint('')).toThrow('cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => ConfigurationManager.validateEndpoint('   ')).toThrow(MastraApiError);
      expect(() => ConfigurationManager.validateEndpoint('   ')).toThrow('cannot be empty');
    });

    it('should reject URLs without protocol', () => {
      expect(() => ConfigurationManager.validateEndpoint('localhost:4111')).toThrow(MastraApiError);
      expect(() => ConfigurationManager.validateEndpoint('localhost:4111')).toThrow(
        'must start with http:// or https://'
      );
    });

    it('should reject malformed URLs', () => {
      expect(() => ConfigurationManager.validateEndpoint('http://')).toThrow(MastraApiError);
    });

    it('should include INVALID_CONFIG error code', () => {
      try {
        ConfigurationManager.validateEndpoint('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MastraApiError);
        expect((error as MastraApiError).code).toBe('INVALID_CONFIG');
      }
    });
  });

  describe('hasWorkspaceEndpoint', () => {
    it('should return true when workspace value is set', () => {
      mockInspect.mockReturnValue({
        workspaceValue: 'http://workspace.local:4111',
        globalValue: undefined,
        defaultValue: 'http://localhost:4111',
      });

      const result = ConfigurationManager.hasWorkspaceEndpoint();

      expect(result).toBe(true);
    });

    it('should return false when only user/global value is set', () => {
      mockInspect.mockReturnValue({
        workspaceValue: undefined,
        globalValue: 'http://user.local:4111',
        defaultValue: 'http://localhost:4111',
      });

      const result = ConfigurationManager.hasWorkspaceEndpoint();

      expect(result).toBe(false);
    });

    it('should return false when no values are set', () => {
      mockInspect.mockReturnValue({
        workspaceValue: undefined,
        globalValue: undefined,
        defaultValue: 'http://localhost:4111',
      });

      const result = ConfigurationManager.hasWorkspaceEndpoint();

      expect(result).toBe(false);
    });
  });

  describe('getDefaultEndpoint', () => {
    it('should return the default endpoint constant', () => {
      const result = ConfigurationManager.getDefaultEndpoint();

      expect(result).toBe('http://localhost:4111');
    });
  });
});
