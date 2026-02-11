# Story 1.3: Workspace Configuration Settings

Status: done

## Story

As a developer using the extension,
I want to configure my Mastra endpoint in VSCode settings,
So that the extension knows which Mastra instance to connect to.

## Acceptance Criteria

**Given** The extension is installed
**When** I open VSCode settings (UI or settings.json)
**Then** I see "Mastra Trace Viewer" section in the extensions category
**And** There is a "mastraTraceViewer.endpoint" setting with description
**And** The default value is "http://localhost:4111"

**Given** The settings contribution is defined in package.json
**When** I create ConfigurationManager in src/utils/configManager.ts
**Then** ConfigurationManager provides getEndpoint() method
**And** getEndpoint() checks workspace settings first, then user settings
**And** getEndpoint() returns a validated URL or throws descriptive error

**Given** ConfigurationManager is implemented
**When** I modify mastraTraceViewer.endpoint in workspace settings
**Then** ConfigurationManager.getEndpoint() returns the updated value
**And** Invalid URLs (missing protocol, malformed) are rejected with clear error message

**Given** Configuration changes occur
**When** I implement onDidChangeConfiguration listener in extension.ts
**Then** The listener detects changes to mastraTraceViewer.endpoint
**And** The MastraClientWrapper reinitializes with new endpoint
**And** A notification informs the user that reconnection is in progress

**Given** ConfigurationManager is complete
**When** I create unit tests in src/utils/configManager.test.ts
**Then** Tests verify workspace settings override user settings
**And** Tests verify URL validation rejects invalid endpoints
**And** All configuration tests pass

## Tasks / Subtasks

- [ ] Add settings contribution to package.json (AC: 1)
  - [ ] Open package.json
  - [ ] Add "contributes.configuration" section
  - [ ] Define "mastraTraceViewer.endpoint" setting
  - [ ] Set type: "string", default: "http://localhost:4111"
  - [ ] Add descriptive title and markdownDescription
  - [ ] Set scope: "window" for workspace-level configuration

- [ ] Create ConfigurationManager utility class (AC: 2)
  - [ ] Create src/utils/configManager.ts
  - [ ] Import vscode workspace API
  - [ ] Implement getEndpoint() method
  - [ ] Check workspace configuration first: getConfiguration('mastraTraceViewer', workspace URI)
  - [ ] Fall back to user configuration if workspace undefined
  - [ ] Return validated URL string

- [ ] Implement URL validation (AC: 3)
  - [ ] Create validateEndpoint(url: string) method
  - [ ] Verify URL has protocol (http:// or https://)
  - [ ] Check URL is well-formed using URL constructor
  - [ ] Throw MastraApiError with INVALID_CONFIG code for invalid URLs
  - [ ] Return normalized URL (trim whitespace, remove trailing slash)

- [ ] Implement configuration change listener (AC: 4)
  - [ ] In src/extension.ts activate() function
  - [ ] Register onDidChangeConfiguration listener
  - [ ] Filter for 'mastraTraceViewer' configuration changes
  - [ ] Show notification: "Mastra endpoint changed. Reconnecting..."
  - [ ] Reinitialize MastraClientWrapper with new endpoint
  - [ ] Update connection state (will be implemented in Story 1.4)
  - [ ] Add listener to context.subscriptions for cleanup

- [ ] Create comprehensive unit tests (AC: 5)
  - [ ] Create src/utils/configManager.test.ts
  - [ ] Test: getEndpoint() returns workspace setting when present
  - [ ] Test: getEndpoint() falls back to user setting
  - [ ] Test: getEndpoint() returns default when no setting configured
  - [ ] Test: validateEndpoint() accepts valid http URLs
  - [ ] Test: validateEndpoint() accepts valid https URLs
  - [ ] Test: validateEndpoint() rejects URLs without protocol
  - [ ] Test: validateEndpoint() rejects malformed URLs
  - [ ] Mock VSCode workspace API for isolated testing

- [ ] Integration validation (AC: all)
  - [ ] Run extension in Development Host
  - [ ] Open VSCode Settings UI
  - [ ] Verify "Mastra Trace Viewer" section appears
  - [ ] Change endpoint setting in UI
  - [ ] Verify notification appears about reconnection
  - [ ] Change endpoint in settings.json directly
  - [ ] Verify change is detected
  - [ ] Run `npm test` to verify all tests pass

## Dev Notes

### Critical Architecture Requirements

**Configuration Management Strategy:**
- **Multi-level Configuration**: VSCode supports user (global) and workspace (project-specific) settings
- **Priority**: Workspace settings override user settings
- **Validation**: Always validate configuration values before use
- **Change Detection**: Listen to configuration changes and respond appropriately

**Settings Contribution in package.json:**
```json
{
  "contributes": {
    "configuration": {
      "title": "Mastra Trace Viewer",
      "properties": {
        "mastraTraceViewer.endpoint": {
          "type": "string",
          "default": "http://localhost:4111",
          "scope": "window",
          "description": "Mastra instance endpoint URL",
          "markdownDescription": "The URL of your Mastra instance for trace retrieval. Typically `http://localhost:4111` for local development.\n\n**Examples:**\n- Local: `http://localhost:4111`\n- Remote: `https://mastra.example.com`",
          "pattern": "^https?://",
          "patternErrorMessage": "Must be a valid HTTP or HTTPS URL"
        }
      }
    }
  }
}
```

**ConfigurationManager Implementation:**
```typescript
// src/utils/configManager.ts
import * as vscode from 'vscode';
import { MastraApiError } from '../models/errors.types';

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'mastraTraceViewer';
  private static readonly ENDPOINT_KEY = 'endpoint';
  private static readonly DEFAULT_ENDPOINT = 'http://localhost:4111';

  /**
   * Get the configured Mastra endpoint URL
   * Priority: workspace settings > user settings > default
   */
  static getEndpoint(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const endpoint = config.get<string>(this.ENDPOINT_KEY, this.DEFAULT_ENDPOINT);
    
    return this.validateEndpoint(endpoint);
  }

  /**
   * Validate and normalize endpoint URL
   * @throws {MastraApiError} if URL is invalid
   */
  static validateEndpoint(endpoint: string): string {
    // Trim whitespace
    const trimmed = endpoint.trim();
    
    // Check for empty
    if (!trimmed) {
      throw new MastraApiError(
        'Mastra endpoint cannot be empty',
        'INVALID_CONFIG'
      );
    }
    
    // Check for protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new MastraApiError(
        `Invalid Mastra endpoint: ${trimmed}. URL must start with http:// or https://`,
        'INVALID_CONFIG'
      );
    }
    
    // Validate URL structure
    try {
      const url = new URL(trimmed);
      // Return without trailing slash for consistency
      return url.toString().replace(/\/$/, '');
    } catch (error) {
      throw new MastraApiError(
        `Malformed Mastra endpoint: ${trimmed}. Please check the URL format.`,
        'INVALID_CONFIG',
        undefined,
        error
      );
    }
  }

  /**
   * Check if workspace has custom endpoint configured
   * (Different from user/default settings)
   */
  static hasWorkspaceEndpoint(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const inspect = config.inspect<string>(this.ENDPOINT_KEY);
    return inspect?.workspaceValue !== undefined;
  }
}
```

**Configuration Change Listener in extension.ts:**
```typescript
// In activate() function
export function activate(context: vscode.ExtensionContext) {
  // ... other activation code ...

  // Listen for configuration changes
  const configListener = vscode.workspace.onDidChangeConfiguration(event => {
    // Only respond to our configuration changes
    if (event.affectsConfiguration('mastraTraceViewer.endpoint')) {
      handleEndpointChange();
    }
  });
  
  context.subscriptions.push(configListener);
}

async function handleEndpointChange() {
  try {
    const newEndpoint = ConfigurationManager.getEndpoint();
    
    // Show notification
    vscode.window.showInformationMessage(
      `Mastra endpoint changed to ${newEndpoint}. Reconnecting...`
    );
    
    // Reinitialize API client (will be implemented in Story 1.4)
    // await connectionManager.reconnect(newEndpoint);
    
  } catch (error) {
    if (error instanceof MastraApiError) {
      vscode.window.showErrorMessage(
        `Invalid Mastra endpoint configuration: ${error.message}`,
        'Open Settings'
      ).then(selection => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'mastraTraceViewer.endpoint');
        }
      });
    }
  }
}
```

### Testing Standards

**Unit Test Structure:**
```typescript
// src/utils/configManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { ConfigurationManager } from './configManager';
import { MastraApiError } from '../models/errors.types';

// Mock VSCode API
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn()
  }
}));

describe('ConfigurationManager', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn(),
      inspect: vi.fn()
    };
    
    (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
  });

  describe('getEndpoint', () => {
    it('should return workspace setting when present', () => {
      mockConfig.get.mockReturnValue('http://workspace.local:4111');
      
      const result = ConfigurationManager.getEndpoint();
      
      expect(result).toBe('http://workspace.local:4111');
      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('mastraTraceViewer');
    });

    it('should return default when no setting configured', () => {
      mockConfig.get.mockImplementation((key, defaultValue) => defaultValue);
      
      const result = ConfigurationManager.getEndpoint();
      
      expect(result).toBe('http://localhost:4111');
    });

    it('should validate returned endpoint', () => {
      mockConfig.get.mockReturnValue('invalid-url');
      
      expect(() => ConfigurationManager.getEndpoint()).toThrow(MastraApiError);
    });
  });

  describe('validateEndpoint', () => {
    it('should accept valid http URL', () => {
      const result = ConfigurationManager.validateEndpoint('http://localhost:4111');
      expect(result).toBe('http://localhost:4111');
    });

    it('should accept valid https URL', () => {
      const result = ConfigurationManager.validateEndpoint('https://mastra.example.com');
      expect(result).toBe('https://mastra.example.com');
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
      expect(() => ConfigurationManager.validateEndpoint('')).toThrow(/cannot be empty/);
    });

    it('should reject URL without protocol', () => {
      expect(() => ConfigurationManager.validateEndpoint('localhost:4111')).toThrow(MastraApiError);
      expect(() => ConfigurationManager.validateEndpoint('localhost:4111')).toThrow(/must start with http/);
    });

    it('should reject malformed URL', () => {
      expect(() => ConfigurationManager.validateEndpoint('http://:4111')).toThrow(MastraApiError);
      expect(() => ConfigurationManager.validateEndpoint('http://[invalid')).toThrow(MastraApiError);
    });
  });

  describe('hasWorkspaceEndpoint', () => {
    it('should return true when workspace value exists', () => {
      mockConfig.inspect.mockReturnValue({
        workspaceValue: 'http://workspace.local:4111'
      });
      
      const result = ConfigurationManager.hasWorkspaceEndpoint();
      expect(result).toBe(true);
    });

    it('should return false when only user value exists', () => {
      mockConfig.inspect.mockReturnValue({
        globalValue: 'http://localhost:4111'
      });
      
      const result = ConfigurationManager.hasWorkspaceEndpoint();
      expect(result).toBe(false);
    });
  });
});
```

**Test Coverage Goals:**
- ConfigurationManager: 100%
- All validation paths tested
- Both success and error cases covered

### VSCode Settings Behavior

**Settings Priority (highest to lowest):**
1. Workspace settings (`.vscode/settings.json` in project)
2. User settings (`~/Library/Application Support/Code/User/settings.json` on macOS)
3. Default value from package.json

**Accessing Settings in UI:**
- Cmd/Ctrl + , → Search "Mastra"
- Or: Settings → Extensions → Mastra Trace Viewer

**Settings in JSON:**
```json
// .vscode/settings.json (workspace)
{
  "mastraTraceViewer.endpoint": "http://localhost:4111"
}

// User settings.json
{
  "mastraTraceViewer.endpoint": "https://mastra.prod.example.com"
}
```

### Known Pitfalls to Avoid

1. **Don't Forget Await**: Configuration operations are synchronous, but validation errors need handling
2. **Scope Matters**: Use "window" scope for workspace-level, "application" for machine-level
3. **Trailing Slashes**: Always normalize (remove or keep consistently)
4. **Empty Strings**: VSCode can return empty strings, must validate
5. **Mock VSCode API**: Unit tests need proper mocking of workspace API
6. **Change Detection**: Only update when configuration actually changes (avoid infinite loops)
7. **User Feedback**: Always show notifications for configuration errors with actionable steps

### Project Structure Notes

**Module Placement:**
- `utils/configManager.ts` - No VSCode provider dependencies, pure utility
- Can be imported by api/, providers/, and extension.ts
- Zero dependencies on other utils (standalone)

**Error Handling:**
- Use MastraApiError from models/errors.types.ts
- Code: 'INVALID_CONFIG' for configuration errors
- User-facing error messages must be actionable

### References

**Architecture Decisions:**
- Source: [_bmad-output/planning-artifacts/architecture.md](../_bmad-output/planning-artifacts/architecture.md)
  - Section: "Mastra API Client Architecture" - Configuration management decision
  - Section: "Cross-Cutting Concerns" - Configuration & Settings

**Requirements:**
- Source: [_bmad-output/planning-artifacts/prd.md](../_bmad-output/planning-artifacts/prd.md)
  - Section: "MVP - Mastra API Integration" - Configurable endpoint requirement

**Epic Context:**
- Source: [_bmad-output/planning-artifacts/epics.md](../_bmad-output/planning-artifacts/epics.md)
  - Section: "Epic 1: Mastra Connection & Extension Foundation"
  - Story 1.3 complete acceptance criteria

**VSCode Documentation:**
- Configuration Contribution: https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
- Workspace API: https://code.visualstudio.com/api/references/vscode-api#workspace

**Dependency on Previous Stories:**
- Story 1.1: Project structure initialized
- Story 1.2: MastraApiError type defined in models/errors.types.ts

## Dev Agent Record

### Agent Model Used

_Will be filled by Dev agent during implementation_

### Debug Log References

_Will be added if issues encountered during implementation_

### Completion Notes List

_Dev agent will document:_
- settings.json schema validation behavior
- Actual validation edge cases encountered
- Configuration change event behavior
- Test coverage achieved
- Any deviations from architectural plan with justification

### File List

_Dev agent will list all files created/modified:_
- package.json (modified - added configuration contribution)
- src/utils/configManager.ts (created)
- src/utils/configManager.test.ts (created)
- src/extension.ts (modified - added configuration listener)
