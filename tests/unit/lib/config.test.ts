import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';
import type { Config } from '../../../src/types';

// Mock modules
vi.mock('fs');
vi.mock('os');
vi.mock('js-yaml');
vi.mock('../../../src/utils/paths', () => ({
  getConfigFilePath: vi.fn(() => '/home/testuser/Downfolio/config.yaml'),
  ensureDirectoryExists: vi.fn(),
}));

import {
  loadConfig,
  saveConfig,
  setConfigValue,
  getConfigValue,
  getAllConfig,
  getApiKey,
  getDefaultModel,
} from '../../../src/lib/config';
import * as paths from '../../../src/utils/paths';

describe('lib/config.ts', () => {
  const mockConfigPath = '/home/testuser/Downfolio/config.yaml';
  const mockConfig: Config = {
    OPENAI_API_KEY: 'sk-test-123',
    OPENAI_MODEL: 'gpt-4o-mini',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    vi.mocked(paths.getConfigFilePath).mockReturnValue(mockConfigPath);
    vi.mocked(os.platform).mockReturnValue('linux');
    // Reset fs.writeFileSync to default (no throw) unless explicitly mocked in test
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadConfig()', () => {
    it('should load existing config file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = loadConfig();

      expect(result).toEqual(mockConfig);
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
      expect(yaml.load).toHaveBeenCalled();
    });

    it('should return empty object if config file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = loadConfig();

      expect(result).toEqual({});
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should handle invalid YAML gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid: [yaml');
      vi.mocked(yaml.load).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = loadConfig();

      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should warn on insecure permissions (Unix)', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(os.platform).mockReturnValue('linux');
      // Insecure permissions (readable by others)
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o644 } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      loadConfig();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('insecure permissions')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not warn on secure permissions (Unix)', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(os.platform).mockReturnValue('linux');
      // Secure permissions (owner only)
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      loadConfig();

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not warn on Windows platform', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(os.platform).mockReturnValue('win32');
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o644 } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      loadConfig();

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should return empty object on null YAML', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('');
      vi.mocked(yaml.load).mockReturnValue(null);
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = loadConfig();

      expect(result).toEqual({});
    });
  });

  describe('saveConfig()', () => {
    it('should save config to file', () => {
      const yamlContent = 'OPENAI_API_KEY: sk-test-123\nOPENAI_MODEL: gpt-4o-mini\n';
      vi.mocked(yaml.dump).mockReturnValue(yamlContent);

      saveConfig(mockConfig);

      expect(paths.ensureDirectoryExists).toHaveBeenCalled();
      expect(yaml.dump).toHaveBeenCalledWith(mockConfig, { indent: 2 });
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, yamlContent, 'utf-8');
      expect(fs.chmodSync).toHaveBeenCalledWith(mockConfigPath, 0o600);
    });

    it('should create directory if missing', () => {
      vi.mocked(yaml.dump).mockReturnValue('test: value');

      saveConfig(mockConfig);

      expect(paths.ensureDirectoryExists).toHaveBeenCalled();
    });

    it('should set secure permissions (chmod 600) on Unix', () => {
      vi.mocked(yaml.dump).mockReturnValue('test: value');
      vi.mocked(os.platform).mockReturnValue('linux');

      saveConfig(mockConfig);

      expect(fs.chmodSync).toHaveBeenCalledWith(mockConfigPath, 0o600);
    });

    it('should set secure permissions on Windows', () => {
      vi.mocked(yaml.dump).mockReturnValue('test: value');
      vi.mocked(os.platform).mockReturnValue('win32');

      saveConfig(mockConfig);

      expect(fs.chmodSync).toHaveBeenCalledWith(mockConfigPath, 0o600);
    });

    it('should handle save errors gracefully', () => {
      vi.mocked(yaml.dump).mockReturnValue('test: value');
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => saveConfig(mockConfig)).toThrow('Failed to save config');
    });

    it('should handle permission errors gracefully', () => {
      vi.mocked(yaml.dump).mockReturnValue('test: value');
      vi.mocked(fs.chmodSync).mockImplementation(() => {
        throw new Error('Permission error');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw, just warn
      expect(() => saveConfig(mockConfig)).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not set secure permissions')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('setConfigValue()', () => {
    it('should set new value in empty config', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(yaml.dump).mockReturnValue('NEW_KEY: new-value\n');

      setConfigValue('NEW_KEY', 'new-value');

      expect(yaml.dump).toHaveBeenCalledWith(
        { NEW_KEY: 'new-value' },
        { indent: 2 }
      );
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should update existing value in config', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-old-123');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_API_KEY: 'sk-old-123' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);
      vi.mocked(yaml.dump).mockReturnValue('OPENAI_API_KEY: sk-new-456\n');

      setConfigValue('OPENAI_API_KEY', 'sk-new-456');

      expect(yaml.dump).toHaveBeenCalledWith(
        { OPENAI_API_KEY: 'sk-new-456' },
        { indent: 2 }
      );
    });

    it('should merge with existing config', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_API_KEY: 'sk-test-123' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);
      vi.mocked(yaml.dump).mockReturnValue('OPENAI_API_KEY: sk-test-123\nNEW_KEY: new-value\n');

      setConfigValue('NEW_KEY', 'new-value');

      expect(yaml.dump).toHaveBeenCalledWith(
        { OPENAI_API_KEY: 'sk-test-123', NEW_KEY: 'new-value' },
        { indent: 2 }
      );
    });
  });

  describe('getConfigValue()', () => {
    it('should retrieve existing value', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getConfigValue('OPENAI_API_KEY');

      expect(result).toBe('sk-test-123');
    });

    it('should return undefined for missing key', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getConfigValue('MISSING_KEY');

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty config', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getConfigValue('ANY_KEY');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllConfig()', () => {
    it('should return complete config object', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue(mockConfig);
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getAllConfig();

      expect(result).toEqual(mockConfig);
    });
  });

  describe('getApiKey()', () => {
    it('should check environment variable first for OpenAI', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key';
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-file-key');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_API_KEY: 'sk-file-key' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getApiKey('openai');

      expect(result).toBe('sk-env-key');
    });

    it('should fallback to config file for OpenAI', () => {
      delete process.env.OPENAI_API_KEY;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-file-key');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_API_KEY: 'sk-file-key' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getApiKey('openai');

      expect(result).toBe('sk-file-key');
    });

    it('should check environment variable first for Anthropic', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('ANTHROPIC_API_KEY: sk-ant-file-key');
      vi.mocked(yaml.load).mockReturnValue({ ANTHROPIC_API_KEY: 'sk-ant-file-key' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getApiKey('anthropic');

      expect(result).toBe('sk-ant-env-key');
    });

    it('should fallback to config file for Anthropic', () => {
      delete process.env.ANTHROPIC_API_KEY;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('ANTHROPIC_API_KEY: sk-ant-file-key');
      vi.mocked(yaml.load).mockReturnValue({ ANTHROPIC_API_KEY: 'sk-ant-file-key' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getApiKey('anthropic');

      expect(result).toBe('sk-ant-file-key');
    });

    it('should return undefined if no API key found', () => {
      delete process.env.OPENAI_API_KEY;
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getApiKey('openai');

      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultModel()', () => {
    it('should return configured OpenAI model', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_MODEL: gpt-4o-mini');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_MODEL: 'gpt-4o-mini' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getDefaultModel('openai');

      expect(result).toBe('gpt-4o-mini');
    });

    it('should return configured Anthropic model', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('ANTHROPIC_MODEL: claude-sonnet-4-5');
      vi.mocked(yaml.load).mockReturnValue({ ANTHROPIC_MODEL: 'claude-sonnet-4-5' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getDefaultModel('anthropic');

      expect(result).toBe('claude-sonnet-4-5');
    });

    it('should return undefined if model not set', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('OPENAI_API_KEY: sk-test-123');
      vi.mocked(yaml.load).mockReturnValue({ OPENAI_API_KEY: 'sk-test-123' });
      vi.mocked(fs.statSync).mockReturnValue({ mode: 0o600 } as any);

      const result = getDefaultModel('openai');

      expect(result).toBeUndefined();
    });
  });
});
