import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('figlet', () => ({
  textSync: vi.fn(),
}));
vi.mock('@clack/prompts', () => ({
  log: {
    info: vi.fn(),
  },
}));

import { showBanner } from '../../../src/utils/banner';
import * as figlet from 'figlet';
import * as p from '@clack/prompts';

describe('utils/banner.ts', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('showBanner()', () => {
    it('should display ASCII art banner using figlet', () => {
      const mockBanner = 'ASCII ART BANNER';
      vi.mocked(figlet.textSync).mockReturnValue(mockBanner);

      showBanner();

      expect(figlet.textSync).toHaveBeenCalledWith('DOWNFOLIO', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(mockBanner);
    });

    it('should display info message using Clack', () => {
      vi.mocked(figlet.textSync).mockReturnValue('BANNER');

      showBanner();

      expect(p.log.info).toHaveBeenCalledWith(
        expect.stringContaining('AI-powered CLI tool')
      );
    });

    it('should add newlines for spacing', () => {
      vi.mocked(figlet.textSync).mockReturnValue('BANNER');

      showBanner();

      expect(consoleLogSpy).toHaveBeenCalledWith('\n');
    });

    it('should fallback to simple banner if figlet fails', () => {
      vi.mocked(figlet.textSync).mockImplementation(() => {
        throw new Error('Figlet error');
      });

      showBanner();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('DOWNFOLIO')
      );
      expect(p.log.info).toHaveBeenCalled();
    });

    it('should display fallback with box characters', () => {
      vi.mocked(figlet.textSync).mockImplementation(() => {
        throw new Error('Figlet error');
      });

      showBanner();

      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const hasBoxChars = calls.some((call: string) => 
        typeof call === 'string' && (call.includes('╔') || call.includes('║') || call.includes('╚'))
      );
      expect(hasBoxChars).toBe(true);
    });

    it('should still display info message on figlet error', () => {
      vi.mocked(figlet.textSync).mockImplementation(() => {
        throw new Error('Figlet error');
      });

      showBanner();

      expect(p.log.info).toHaveBeenCalledWith(
        expect.stringContaining('AI-powered CLI tool')
      );
    });
  });
});
