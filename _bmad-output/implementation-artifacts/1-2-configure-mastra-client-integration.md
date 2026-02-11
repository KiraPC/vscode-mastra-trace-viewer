# Story 1.2: Configure Mastra Client Integration

Status: done

## Story

As a developer,
I want to integrate the official Mastra client into the extension,
So that I can connect to Mastra instances programmatically.

## Acceptance Criteria

**Given** The extension project is initialized
**When** I install the official Mastra client package
**Then** The Mastra client is added to package.json dependencies
**And** TypeScript types are available for the Mastra client

**Given** The Mastra client is installed
**When** I create a MastraClientWrapper class in src/api/MastraClientWrapper.ts
**Then** The wrapper initializes the Mastra client with configurable endpoint
**And** The wrapper provides methods: fetchTraces(), fetchTraceById(id)
**And** The wrapper handles client errors and transforms them to typed errors

**Given** The MastraClientWrapper is implemented
**When** I create unit tests for the wrapper in src/api/MastraClientWrapper.test.ts
**Then** Tests verify successful connection initialization
**And** Tests verify fetchTraces() returns expected data structure
**And** Tests verify fetchTraceById() returns trace details
**And** Tests verify error handling for network failures

**Given** The wrapper and tests are complete
**When** I run npm test
**Then** All Mastra client wrapper tests pass
**And** The wrapper is ready for integration with VSCode providers

## Tasks / Subtasks

- [x] Install Mastra client dependencies (AC: 1)
  - [x] Research and identify official Mastra client package
  - [x] Run `npm install @mastra/client` (or appropriate package name)
  - [x] Verify TypeScript types are available (@types or built-in)
  - [x] Update package.json with correct version

- [x] Create MastraClientWrapper class (AC: 2)
  - [x] Create src/api/MastraClientWrapper.ts
  - [x] Define MastraClientWrapper class with constructor accepting endpoint URL
  - [x] Initialize Mastra client instance with endpoint configuration
  - [x] Implement fetchTraces() method returning Promise<Trace[]>
  - [x] Implement fetchTraceById(id: string) method returning Promise<Trace>
  - [x] Add error transformation logic to convert Mastra errors to MastraApiError

- [x] Define error types for API layer (AC: 2)
  - [x] Create src/models/errors.types.ts
  - [x] Define MastraApiError class with code, message, statusCode, details
  - [x] Define error codes: 'NETWORK', 'TIMEOUT', 'API_ERROR', 'INVALID_DATA'
  - [x] Export error types for use across extension

- [x] Define trace data models (AC: 2)
  - [x] Create src/models/trace.types.ts
  - [x] Define Trace interface (traceId, spans, timestamp, metadata)
  - [x] Define Span interface (spanId, parentSpanId, name, type, startTime, endTime, input, output, attributes)
  - [x] Define SpanType enum (agent_run, processor_run, tool_streaming, llm_call)
  - [x] Add validation type guards for runtime checks

- [x] Implement comprehensive unit tests (AC: 3, 4)
  - [x] Create src/api/MastraClientWrapper.test.ts
  - [x] Test: Constructor initializes with endpoint
  - [x] Test: fetchTraces() returns array of traces
  - [x] Test: fetchTraceById() returns single trace
  - [x] Test: Network error throws MastraApiError with NETWORK code
  - [x] Test: Timeout error throws MastraApiError with TIMEOUT code
  - [x] Test: Invalid data throws MastraApiError with INVALID_DATA code
  - [x] Mock Mastra client for isolated testing

- [x] Verify integration readiness (AC: 4)
  - [x] Run `npm test` to execute all tests
  - [x] Verify 100% test pass rate
  - [x] Check test coverage for MastraClientWrapper (aim for >80%)
  - [x] Document any Mastra client API assumptions or limitations

## Dev Notes

### Critical Architecture Requirements

**API Client Architecture:**
- **HTTP Client**: Use official Mastra client (not custom axios implementation)
- **Error Handling**: Transform Mastra client errors to custom MastraApiError types
- **Module Boundary**: Only `api/` module makes HTTP calls
- **Zero VSCode Dependencies**: API layer should be pure Node.js/TypeScript

**Mastra Client Integration:**
According to the architecture, the original plan was to use axios, but the PRD and latest requirements specify using the **official Mastra client** for API integration. This provides:
- Built-in connection management
- Authentication handling
- Retry logic
- Type-safe API calls

**Installation Command:**
```bash
# Check Mastra documentation for exact package name
npm install @mastra/client
# Or if types are separate:
npm install --save-dev @types/mastra
```

**Error Type Structure (src/models/errors.types.ts):**
```typescript
export class MastraApiError extends Error {
  constructor(
    public message: string,
    public code: 'NETWORK' | 'TIMEOUT' | 'API_ERROR' | 'INVALID_DATA',
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MastraApiError';
  }
}

// Type guard for error checking
export function isMastraApiError(error: unknown): error is MastraApiError {
  return error instanceof MastraApiError;
}
```

**Trace Data Models (src/models/trace.types.ts):**
```typescript
export enum SpanType {
  AgentRun = 'agent_run',
  ProcessorRun = 'processor_run',
  ToolStreaming = 'tool_streaming',
  LlmCall = 'llm_call',
  Custom = 'custom'
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  name: string;
  type: SpanType;
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  status?: 'success' | 'error' | 'running' | 'pending';
  input?: unknown;  // JSON-serializable
  output?: unknown; // JSON-serializable
  attributes?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

export interface Trace {
  traceId: string;
  timestamp: string; // ISO 8601
  spans: Span[];
  status?: 'success' | 'error' | 'running';
  metadata?: Record<string, unknown>;
}

// Type guards
export function isValidTrace(data: unknown): data is Trace {
  const trace = data as Trace;
  return (
    typeof trace?.traceId === 'string' &&
    Array.isArray(trace?.spans) &&
    typeof trace?.timestamp === 'string'
  );
}

export function isValidSpan(data: unknown): data is Span {
  const span = data as Span;
  return (
    typeof span?.spanId === 'string' &&
    typeof span?.traceId === 'string' &&
    typeof span?.name === 'string' &&
    typeof span?.type === 'string'
  );
}
```

**MastraClientWrapper Implementation Pattern:**
```typescript
// src/api/MastraClientWrapper.ts
import { MastraClient } from '@mastra/client'; // Adjust import based on actual package
import { Trace } from '../models/trace.types';
import { MastraApiError } from '../models/errors.types';

export class MastraClientWrapper {
  private client: MastraClient;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.client = new MastraClient({
      baseUrl: endpoint,
      timeout: 10000, // 10 seconds
      // Add authentication if needed
    });
  }

  async fetchTraces(): Promise<Trace[]> {
    try {
      // Use actual Mastra client API
      const response = await this.client.telemetry.getTraces();
      
      // Transform/validate data
      if (!Array.isArray(response)) {
        throw new MastraApiError(
          'Invalid trace data format',
          'INVALID_DATA',
          undefined,
          response
        );
      }
      
      return response as Trace[];
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async fetchTraceById(traceId: string): Promise<Trace> {
    try {
      const response = await this.client.telemetry.getTrace(traceId);
      
      if (!response || typeof response !== 'object') {
        throw new MastraApiError(
          `Trace ${traceId} not found or invalid`,
          'INVALID_DATA'
        );
      }
      
      return response as Trace;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  private transformError(error: unknown): MastraApiError {
    // Transform Mastra client errors to our error types
    if (error instanceof MastraApiError) {
      return error;
    }
    
    // Handle timeout
    if ((error as any).code === 'ETIMEDOUT' || (error as any).code === 'ECONNABORTED') {
      return new MastraApiError(
        'Request timed out',
        'TIMEOUT'
      );
    }
    
    // Handle network errors
    if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
      return new MastraApiError(
        `Cannot connect to Mastra at ${this.endpoint}`,
        'NETWORK'
      );
    }
    
    // Handle API errors
    if ((error as any).response) {
      return new MastraApiError(
        (error as any).response.data?.message || 'API request failed',
        'API_ERROR',
        (error as any).response.status,
        (error as any).response.data
      );
    }
    
    // Unknown error
    return new MastraApiError(
      error instanceof Error ? error.message : 'Unknown error',
      'API_ERROR'
    );
  }
}
```

### Testing Standards

**Unit Test Structure (Vitest):**
```typescript
// src/api/MastraClientWrapper.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MastraClientWrapper } from './MastraClientWrapper';
import { MastraApiError } from '../models/errors.types';

// Mock the Mastra client
vi.mock('@mastra/client', () => ({
  MastraClient: vi.fn().mockImplementation(() => ({
    telemetry: {
      getTraces: vi.fn(),
      getTrace: vi.fn()
    }
  }))
}));

describe('MastraClientWrapper', () => {
  let wrapper: MastraClientWrapper;
  const mockEndpoint = 'http://localhost:4111';

  beforeEach(() => {
    wrapper = new MastraClientWrapper(mockEndpoint);
  });

  describe('constructor', () => {
    it('should initialize with endpoint', () => {
      expect(wrapper).toBeDefined();
      // Verify client was initialized
    });
  });

  describe('fetchTraces', () => {
    it('should return array of traces on success', async () => {
      const mockTraces = [
        { traceId: 'trace-1', timestamp: '2026-02-11T10:00:00Z', spans: [] },
        { traceId: 'trace-2', timestamp: '2026-02-11T10:01:00Z', spans: [] }
      ];
      
      // Mock successful response
      // ... setup mock ...
      
      const result = await wrapper.fetchTraces();
      expect(result).toEqual(mockTraces);
    });

    it('should throw NETWORK error on connection refused', async () => {
      // Mock connection error
      // ... setup mock to reject ...
      
      await expect(wrapper.fetchTraces()).rejects.toThrow(MastraApiError);
      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'NETWORK'
      });
    });

    it('should throw TIMEOUT error on timeout', async () => {
      // Mock timeout error
      // ... setup mock ...
      
      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'TIMEOUT'
      });
    });

    it('should throw INVALID_DATA error for malformed response', async () => {
      // Mock invalid response
      // ... setup mock ...
      
      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'INVALID_DATA'
      });
    });
  });

  describe('fetchTraceById', () => {
    it('should return single trace on success', async () => {
      const mockTrace = {
        traceId: 'trace-123',
        timestamp: '2026-02-11T10:00:00Z',
        spans: []
      };
      
      const result = await wrapper.fetchTraceById('trace-123');
      expect(result).toEqual(mockTrace);
    });

    it('should throw error for non-existent trace', async () => {
      // Mock 404 or null response
      
      await expect(wrapper.fetchTraceById('non-existent')).rejects.toThrow();
    });
  });
});
```

**Test Coverage Goals:**
- MastraClientWrapper: 100% (all paths, all error cases)
- Error transformation logic: 100%
- Type guards: 100%

**Running Tests:**
```bash
npm test                    # Run in watch mode
npm run test:unit          # Run once
npm run test:coverage      # Generate coverage report
```

### Dependencies

**Required Packages:**
- `@mastra/client` or appropriate Mastra SDK package
- Possibly `@types/mastra` if types are separate

**Note**: Check latest Mastra documentation at https://mastra.ai for:
- Official client package name
- Installation instructions
- API documentation
- Authentication requirements
- Rate limiting considerations

### Known Pitfalls to Avoid

1. **Package Name**: Verify exact Mastra client package name from official docs
2. **API Endpoints**: Confirm actual telemetry API endpoints from Mastra
3. **Authentication**: Check if Mastra requires auth headers or API keys
4. **Data Validation**: Always validate API responses before type assertions
5. **Error Messages**: Make error messages actionable for users
6. **No VSCode API**: Keep this module pure Node.js for testability
7. **Mock Properly**: Use Vitest's vi.mock() for clean test isolation

### Project Structure Notes

**Module Boundaries:**
- `api/` → Only module that communicates with external services
- `models/` → Shared types used by api/, providers/, and webview/
- No circular dependencies
- API layer has zero VSCode dependencies

**Dependency Flow:**
- Extension → API → Models
- Providers → API → Models
- No imports from providers/ or webview/ into api/

### References

**Architecture Decisions:**
- Source: [_bmad-output/planning-artifacts/architecture.md](../_bmad-output/planning-artifacts/architecture.md)
  - Section: "Mastra API Client Architecture" - HTTP client decision
  - Section: "Core Architectural Decisions" - Error handling patterns
  - Section: "Implementation Patterns" - Error object structure

**Requirements:**
- Source: [_bmad-output/planning-artifacts/prd.md](../_bmad-output/planning-artifacts/prd.md)
  - Section: "Product Scope - MVP" - Mastra API Integration requirements
  - Section: "Technology Stack Requirements" - Mastra official client specification

**Epic Context:**
- Source: [_bmad-output/planning-artifacts/epics.md](../_bmad-output/planning-artifacts/epics.md)
  - Section: "Epic 1: Mastra Connection & Extension Foundation"
  - Story 1.2 complete acceptance criteria

**External Documentation:**
- Mastra Documentation: https://mastra.ai
- Mastra API Reference: Check official docs for telemetry/observability endpoints

**Dependency on Previous Stories:**
- Story 1.1: Project structure must be initialized (api/ directory exists)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (via GitHub Copilot)

### Implementation Notes

**Mastra Client Package:**
- Used `@mastra/client-js` v1.2.0 (official TypeScript client)
- Built-in TypeScript types included
- Client provides `getTelemetry(params)` method for trace data retrieval

**Architecture Decisions:**
- Followed red-green-refactor TDD cycle
- Created type models first to establish contract
- Wrapped Mastra client in custom class for error transformation
- Used actual Mastra trace JSON structure from trace.json for type definitions

**Error Handling Implementation:**
- Comprehensive error transformation covering network, timeout, API, and validation errors
- Type guards for runtime data validation
- Error codes aligned with architecture: NETWORK, TIMEOUT, API_ERROR, INVALID_DATA

**Testing Strategy:**
- 15 comprehensive unit tests covering all error paths
- Mock class implementation for Mastra client isolation
- 100% test pass rate achieved
- All tests use red-green-refactor methodology

### Completion Notes List

✅ **Installed @mastra/client-js v1.2.0** - Official Mastra TypeScript client with built-in types  
✅ **Created src/models/errors.types.ts** - Custom error class with 4 error codes and type guard  
✅ **Created src/models/trace.types.ts** - Trace/Span interfaces matching actual Mastra JSON structure  
✅ **Implemented MastraClientWrapper** - Wraps Mastra client with fetchTraces() and fetchTraceById()  
✅ **Error transformation logic** - Converts all error types to MastraApiError with appropriate codes  
✅ **15 unit tests written** - All passing, comprehensive coverage of success and error paths  
✅ **Full test suite passing** - 19/19 tests pass, no regressions introduced  

**Key Implementation Details:**
- Mastra client configured with retry logic (3 attempts, exponential backoff)
- Data validation using type guards before returning from API calls
- Trace structure supports both nested (`trace.trace.spans`) and flat (`trace.spans`) formats
- Zero VSCode dependencies in API layer (pure Node.js/TypeScript)

### File List

- src/models/errors.types.ts (NEW)
- src/models/trace.types.ts (NEW)
- src/api/MastraClientWrapper.ts (NEW)
- src/api/MastraClientWrapper.test.ts (NEW)
- package.json (UPDATED - added @mastra/client-js dependency)
