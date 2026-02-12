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

// Create mock DataTransfer with file path
const createMockDataTransfer = (
  filePath?: string,
  options: { useUriList?: boolean } = { useUriList: true }
) => {
  const data = new Map<string, { asString: () => Promise<string> }>();
  if (filePath !== undefined) {
    if (options.useUriList) {
      data.set('text/uri-list', { asString: async () => `file://${filePath}` });
    }
    data.set('text/plain', { asString: async () => filePath });
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
  const testFilePath = '/tmp/trace-test1234.json';

  let provider: TraceDropEditProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new TraceDropEditProvider();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mimeTypes', () => {
    it('should expose text/uri-list mime type', () => {
      expect(TraceDropEditProvider.mimeTypes).toContain('text/uri-list');
    });

    it('should expose text/plain mime type', () => {
      expect(TraceDropEditProvider.mimeTypes).toContain('text/plain');
    });

    it('should have exactly 2 mime types', () => {
      expect(TraceDropEditProvider.mimeTypes).toHaveLength(2);
    });
  });

  describe('provideDocumentDropEdits', () => {
    it('should return DocumentDropEdit with file path for text files', async () => {
      const document = createMockDocument({ languageId: 'plaintext' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testFilePath);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testFilePath);
      expect(result?.title).toBe('Insert Trace File Path');
    });

    it('should return file path for markdown files', async () => {
      const document = createMockDocument({ languageId: 'markdown' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testFilePath);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testFilePath);
    });

    it('should return file path for JSON files', async () => {
      const document = createMockDocument({ languageId: 'json' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testFilePath);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testFilePath);
    });

    it('should handle untitled documents', async () => {
      const document = createMockDocument({ isUntitled: true, languageId: 'plaintext' });
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testFilePath);
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testFilePath);
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
      const dataTransfer = createMockDataTransfer(testFilePath);
      const token = createMockCancellationToken(true); // Cancelled

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeUndefined();
    });

    it('should prefer text/uri-list over text/plain', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      
      // DataTransfer with both mime types
      const data = new Map<string, { asString: () => Promise<string> }>();
      data.set('text/uri-list', { asString: async () => 'file:///uri/list/path.json' });
      data.set('text/plain', { asString: async () => '/plain/text/path.json' });
      
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
      expect(result?.insertText).toContain('/uri/list/path.json');
    });

    it('should fall back to text/plain if text/uri-list missing', async () => {
      const document = createMockDocument();
      const position = createMockPosition();
      const dataTransfer = createMockDataTransfer(testFilePath, { useUriList: false });
      const token = createMockCancellationToken();

      const result = await provider.provideDocumentDropEdits(
        document as any,
        position as any,
        dataTransfer as any,
        token as any
      );

      expect(result).toBeDefined();
      expect(result?.insertText).toBe(testFilePath);
    });
  });
});
