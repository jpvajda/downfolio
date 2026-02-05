import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  password: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('../../../src/utils/paths', () => ({
  isInitialized: vi.fn(() => true),
}));

vi.mock('../../../src/lib/config', () => ({
  setConfigValue: vi.fn(),
  getConfigValue: vi.fn(),
  getAllConfig: vi.fn(() => ({})),
}));

import { configCommand } from '../../../src/commands/config';
import * as p from '@clack/prompts';
import * as paths from '../../../src/utils/paths';
import * as config from '../../../src/lib/config';

describe('commands/config.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paths.isInitialized).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configCommand()', () => {
    it('should display intro message', async () => {
      await configCommand('set', 'OPENAI_API_KEY', 'sk-test-key');

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Configuration');
    });

    it('should exit if not initialized', async () => {
      vi.mocked(paths.isInitialized).mockReturnValue(false);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await configCommand();

      expect(p.cancel).toHaveBeenCalledWith(
        'Downfolio not initialized. Run "downfolio init" first.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for action if not provided', async () => {
      vi.mocked(p.select).mockResolvedValue('set' as any);

      await configCommand();

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to do?',
        })
      );
    });

    it('should handle set action with provided key and value', async () => {
      await configCommand('set', 'OPENAI_API_KEY', 'sk-test-key');

      expect(config.setConfigValue).toHaveBeenCalledWith('OPENAI_API_KEY', 'sk-test-key');
      expect(p.log.success).toHaveBeenCalledWith('Config "OPENAI_API_KEY" set successfully');
      expect(p.outro).toHaveBeenCalledWith('Configuration updated');
    });

    it('should prompt for key if not provided in set action', async () => {
      vi.mocked(p.text).mockResolvedValue('OPENAI_API_KEY' as any);
      vi.mocked(p.password).mockResolvedValue('sk-test-key' as any);

      await configCommand('set');

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Config key?',
        })
      );
      expect(p.password).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Config value?',
        })
      );
    });

    it('should handle update action', async () => {
      vi.mocked(config.getAllConfig).mockReturnValue({
        OPENAI_API_KEY: 'sk-old-key',
      });
      vi.mocked(config.getConfigValue).mockReturnValue('sk-old-key');
      vi.mocked(p.password).mockResolvedValue('sk-new-key' as any);

      await configCommand('update', 'OPENAI_API_KEY', 'sk-new-key');

      expect(config.setConfigValue).toHaveBeenCalledWith('OPENAI_API_KEY', 'sk-new-key');
      expect(p.log.success).toHaveBeenCalledWith('Config "OPENAI_API_KEY" updated successfully');
    });

    it('should prompt for key selection in update if not provided', async () => {
      vi.mocked(config.getAllConfig).mockReturnValue({
        OPENAI_API_KEY: 'sk-old-key',
        ANTHROPIC_API_KEY: 'sk-ant-key',
      });
      vi.mocked(p.select).mockResolvedValue('OPENAI_API_KEY' as any);
      vi.mocked(config.getConfigValue).mockReturnValue('sk-old-key');
      vi.mocked(p.password).mockResolvedValue('sk-new-key' as any);

      await configCommand('update');

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which config value to update?',
        })
      );
    });

    it('should handle get action with provided key', async () => {
      vi.mocked(config.getConfigValue).mockReturnValue('sk-test-key');

      await configCommand('get', 'OPENAI_API_KEY');

      expect(config.getConfigValue).toHaveBeenCalledWith('OPENAI_API_KEY');
      expect(p.log.info).toHaveBeenCalledWith(
        expect.stringContaining('OPENAI_API_KEY')
      );
    });

    it('should prompt for key in get action if not provided', async () => {
      vi.mocked(p.text).mockResolvedValue('OPENAI_API_KEY' as any);
      vi.mocked(config.getConfigValue).mockReturnValue('sk-test-key');

      await configCommand('get');

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Config key?',
        })
      );
    });

    it('should warn if key not found in get action', async () => {
      vi.mocked(config.getConfigValue).mockReturnValue(undefined);

      await configCommand('get', 'MISSING_KEY');

      expect(p.log.warn).toHaveBeenCalledWith('Config "MISSING_KEY" not found');
    });

    it('should handle list action', async () => {
      vi.mocked(config.getAllConfig).mockReturnValue({
        OPENAI_API_KEY: 'sk-test-key',
        ANTHROPIC_API_KEY: 'sk-ant-key',
      });

      await configCommand('list');

      expect(config.getAllConfig).toHaveBeenCalled();
      expect(p.log.info).toHaveBeenCalledWith('Configuration:');
      expect(p.log.message).toHaveBeenCalled();
    });

    it('should show info message if no config found in list', async () => {
      vi.mocked(config.getAllConfig).mockReturnValue({});

      await configCommand('list');

      expect(p.log.info).toHaveBeenCalledWith('No configuration found');
    });

    it('should handle unknown action', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await configCommand('unknown' as any);

      expect(p.cancel).toHaveBeenCalledWith('Unknown action: unknown');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if operation cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await configCommand();

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(config.setConfigValue).mockImplementation(() => {
        throw new Error('Save failed');
      });
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await configCommand('set', 'OPENAI_API_KEY', 'sk-test-key');

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Config operation failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should mask config values when displaying', async () => {
      vi.mocked(config.getConfigValue).mockReturnValue('sk-test-key-123');

      await configCommand('get', 'OPENAI_API_KEY');

      expect(p.log.info).toHaveBeenCalledWith(
        expect.stringMatching(/OPENAI_API_KEY: \*+/)
      );
    });
  });
});
