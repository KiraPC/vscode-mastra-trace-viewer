/**
 * Tests for TraceDropEditProvider
 * Story 6.3: Enable Drop into VSCode Editors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TraceDropEditProvider } from './TraceDropEditProvider';

// Mock vscode module
vi.mock('vscode', () => ({
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  DocumentDropEdit: class DocumentDropEdit {
    public insertText: string;
    public title?: string;
    constructor(insertText: string) {
      this.insertText = insertText;
    }
  },
  Uri: {
    parse: vi.fn((uriString: string) => {
      // Parse file:// URI
      if (uriString.startsWith('file://')) {
        return { fsPath: uriString.replace('file://', '') };
      }
      return { fsPath: uriString };
    }),
  },
}));

// Create mock document
const createMockDocument = (overrides: Partial<{
  isUntitled: boolean;
  languageId: string;
  uri: { scheme: string; fsPath: string };
}> = {}) => ({
  isUntitled: false,
  languageId: 'plaintext',
  uri: { scheme: 'file', fsPath: '/test/file.txt' },
  ...overrides,
});

// Create mock DataTransfer with JSON content
const createMockDataTransfer = (
  jsonContent?: string,
  options: { useJson?: boolean } = { useJson: true }
) => {
  const data = new Map<string, { asString: () => Promise<string> }>();
  if (jsonContent !== undefined) {
    if (options.useJson) {
      data.set('application/json', { asString: async () => jsonContent });
    }
    data.set('text/plain', { asString: async () => jsonContent });
  }
  return {
    get: (mimeType: string) => data.get(mimeType),
  };
};

// Create mock CancellationToken
const createMockCancellationToken = (isCancelled = false) => ({
  isCancellationRequested: isCancelled,
  onCancellationRequested: vi.fn(),
});

// Create mock Position
const createMockPosition = (line = 0, character = 0) => ({
  line,
  character,
});

describe('TraceDropEditProvider', () => {
  const testJsonContent = '{"traceId": "test-123", "spans": []}';

  let provider: TraceDropEditProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new TraceDropEditProvider();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mimeTypes', () => {
    it('should expose application/json mime type', () => {
      expect(TraceDropEditProvider.mimeTypes).toContain('application/json');
    });

    it('should expose text/plain mime type', () => {
      expect(TraceDropEditProvider.mimeTypes).toContain('text/plain');
    });

    it('should have exactly 2 mime types', () => {
      expect(TraceDropEditProvider.mimeTypes).toHaveLength(2);
    });
  });

  describe('provideDocumentDropEdits', () => {
    it('should return DocumentDropEdit with JSON content for text files', async () => {
      const document = createMockDocument({ languageId: 'plaintext' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testJsonContent);
      expect(result?.title).toBe('Insert Trace JSON');
    });

    it('should return JSON content for markdown files', async () => {
      const document = createMockDocument({ languageId: 'markdown' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testJsonContent);
    });

    it('should return JSON content for JSON files', async () => {
      const document = createMockDocument({ languageId: 'json' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testJsonContent);
    });

    it('should handle untitled documents', async () => {
      const document = createMockDocument({ isUntitled: true, languageId: 'plaintext' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testJsonContent);
    });

    it('should return undefined for empty dataTransfer', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(); // No data
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeUndefined();
    });

    it('should respect cancellation token', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent);
      const token = createMockCancellationToken(true); // Cancelled

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeUndefined();
    });

    it('should prefer application/json over text/plain', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      
      // DataTransfer with both mime types
      const data = new Map<string, { asString: () => Promise<string> }>();
      data.set('application/json', { asString: async () => '{"from": "json"}' });
      data.set('text/plain', { asString: async () => '{"from": "plain"}' });
      
      const dataTransfer = {
        get: (mimeType: string) => data.get(mimeType),
      };
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe('{"from": "json"}');
    });

    it('should fall back to text/plain if application/json missing', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testJsonContent, { useJson: false });
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testJsonContent);
    });
  });
});
