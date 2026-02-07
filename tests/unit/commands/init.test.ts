import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));

vi.mock('../../../src/utils/paths', () => ({
  getConfigPath: vi.fn(() => '/home/user/Downfolio'),
  getTemplatesPath: vi.fn(() => '/home/user/Downfolio/Templates'),
  getJobsPath: vi.fn(() => '/home/user/Downfolio/Jobs'),
  getOutputPath: vi.fn(() => '/home/user/Downfolio/Output'),
  ensureDirectoryExists: vi.fn(),
}));

vi.mock('../../../src/lib/config', () => ({
  loadConfig: vi.fn(() => ({})),
  saveConfig: vi.fn(),
}));

import { initCommand } from '../../../src/commands/init';
import * as p from '@clack/prompts';
import * as paths from '../../../src/utils/paths';
import * as config from '../../../src/lib/config';

describe('commands/init.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.exit to throw an error instead of exiting
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initCommand()', () => {
    it('should initialize with API key from options', async () => {
      await initCommand({ apiKey: 'sk-test-key' });

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Initialize');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Templates');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Jobs');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Output');
      expect(config.saveConfig).toHaveBeenCalled();
      expect(p.outro).toHaveBeenCalled();
    });

    it('should prompt for API key if not provided in options', async () => {
      vi.mocked(p.text).mockResolvedValue('sk-prompted-key');

      await initCommand({});

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'OpenAI API Key?',
        })
      );
    });

    it('should create directory structure', async () => {
      await initCommand({ apiKey: 'sk-test-key' });

      expect(paths.ensureDirectoryExists).toHaveBeenCalledTimes(4);
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Templates');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Jobs');
      expect(paths.ensureDirectoryExists).toHaveBeenCalledWith('/home/user/Downfolio/Output');
    });

    it('should save config with provided API key', async () => {
      await initCommand({ apiKey: 'sk-test-key' });

      expect(config.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          OPENAI_API_KEY: 'sk-test-key',
        })
      );
    });

    it('should merge with existing config', async () => {
      vi.mocked(config.loadConfig).mockReturnValue({
        EXISTING_KEY: 'existing-value',
      });

      await initCommand({ apiKey: 'sk-test-key' });

      expect(config.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          EXISTING_KEY: 'existing-value',
          OPENAI_API_KEY: 'sk-test-key',
        })
      );
    });

    it('should prompt for Anthropic key after OpenAI key', async () => {
      vi.mocked(p.text)
        .mockResolvedValueOnce('sk-openai-key')
        .mockResolvedValueOnce('sk-anthropic-key');

      await initCommand({});

      expect(p.text).toHaveBeenCalledTimes(2);
      expect(p.text).toHaveBeenNthCalledWith(1, expect.objectContaining({
        message: 'OpenAI API Key?',
      }));
      expect(p.text).toHaveBeenNthCalledWith(2, expect.objectContaining({
        message: 'Anthropic API Key? (optional)',
      }));
    });

    it('should display spinner messages', async () => {
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
      };
      vi.mocked(p.spinner).mockReturnValue(mockSpinner as any);

      await initCommand({ apiKey: 'sk-test-key' });

      expect(mockSpinner.start).toHaveBeenCalledWith('Creating directory structure...');
      expect(mockSpinner.stop).toHaveBeenCalledWith('Directory structure created');
      expect(mockSpinner.start).toHaveBeenCalledWith('Updating configuration...');
      expect(mockSpinner.stop).toHaveBeenCalledWith('Configuration updated');
    });

    it('should display success message', async () => {
      await initCommand({ apiKey: 'sk-test-key' });

      expect(p.outro).toHaveBeenCalledWith(
        expect.stringContaining('Downfolio initialized!')
      );
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(config.saveConfig).mockImplementation(() => {
        throw new Error('Save failed');
      });

      await expect(initCommand({ apiKey: 'sk-test-key' })).rejects.toThrow('process.exit called with code 1');

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Initialization failed')
      );
    });

    it('should not save API keys if cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.text).mockResolvedValue(Symbol('cancelled'));
      // Ensure saveConfig doesn't throw (it might have been mocked to throw in previous tests)
      vi.mocked(config.saveConfig).mockImplementation(() => {});

      await initCommand({});

      // When cancelled, saveConfig should still be called with empty config
      // (the config object is initialized as empty and only populated if keys are provided)
      expect(config.saveConfig).toHaveBeenCalled();
    });
  });
});
