import { vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Setup function to reset all mocks before each test
 */
export function setupTest() {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Clear environment variables that might affect tests
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

/**
 * Mock module with custom implementation
 */
export function mockModule(modulePath: string, implementation: any) {
  vi.doMock(modulePath, () => implementation);
}

/**
 * Create a mock file system state
 */
export interface MockFileSystemState {
  files: Map<string, string>;
  directories: Set<string>;
}

export function createMockFileSystem(): MockFileSystemState {
  return {
    files: new Map<string, string>(),
    directories: new Set<string>(),
  };
}

/**
 * Setup mock fs with state
 */
export function setupMockFs(state: MockFileSystemState) {
  const mockFs = {
    existsSync: vi.fn((filePath: string) => {
      return state.files.has(filePath) || state.directories.has(filePath);
    }),
    readFileSync: vi.fn((filePath: string, encoding?: string) => {
      if (!state.files.has(filePath)) {
        throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      }
      return state.files.get(filePath);
    }),
    writeFileSync: vi.fn((filePath: string, content: string) => {
      state.files.set(filePath, content);
      // Add parent directory
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dir) {
        state.directories.add(dir);
      }
    }),
    mkdirSync: vi.fn((dirPath: string, options?: any) => {
      state.directories.add(dirPath);
      // If recursive, add all parent directories
      if (options?.recursive) {
        const parts = dirPath.split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
          current += '/' + part;
          state.directories.add(current);
        }
      }
    }),
    readdirSync: vi.fn((dirPath: string) => {
      if (!state.directories.has(dirPath)) {
        throw new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`);
      }
      const files: string[] = [];
      for (const [filePath] of state.files) {
        if (filePath.startsWith(dirPath + '/')) {
          const relativePath = filePath.substring(dirPath.length + 1);
          if (!relativePath.includes('/')) {
            files.push(relativePath);
          }
        }
      }
      return files;
    }),
    statSync: vi.fn((filePath: string) => {
      if (!state.files.has(filePath)) {
        throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
      }
      return {
        mode: 0o600, // Default to secure permissions
        isFile: () => true,
        isDirectory: () => false,
      };
    }),
    chmodSync: vi.fn(),
  };

  vi.doMock('fs', () => mockFs);
  return mockFs;
}

/**
 * Wait for async operations
 */
export function wait(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capture console output
 */
export function captureConsole() {
  const output: { log: string[]; error: string[]; warn: string[] } = {
    log: [],
    error: [],
    warn: [],
  };

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = vi.fn((...args) => {
    output.log.push(args.join(' '));
  });

  console.error = vi.fn((...args) => {
    output.error.push(args.join(' '));
  });

  console.warn = vi.fn((...args) => {
    output.warn.push(args.join(' '));
  });

  return {
    output,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}
