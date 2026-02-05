import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';

// Mock modules
vi.mock('fs');
vi.mock('gray-matter', () => ({
  default: vi.fn((content: string) => {
    if (content.includes('invalid')) {
      throw new Error('Invalid frontmatter');
    }
    return { data: {}, content };
  }),
}));
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
  log: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { validateCommand } from '../../../src/commands/validate';
import * as p from '@clack/prompts';

describe('commands/validate.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateCommand()', () => {
    it('should validate file provided as argument', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Valid Markdown\n\nContent here');

      await validateCommand('test.md');

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Validate Markdown');
      expect(fs.existsSync).toHaveBeenCalledWith('test.md');
      expect(fs.readFileSync).toHaveBeenCalledWith('test.md', 'utf-8');
    });

    it('should prompt for file if not provided', async () => {
      vi.mocked(p.text).mockResolvedValue('prompted.md');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Valid Markdown');

      await validateCommand();

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'File to validate?',
        })
      );
    });

    it('should validate markdown with headers', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Header\n\nContent');

      await validateCommand('test.md');

      expect(p.log.success).toHaveBeenCalledWith('✓ Syntax valid');
      expect(p.log.success).toHaveBeenCalledWith('✓ Structure valid');
      expect(p.log.success).toHaveBeenCalledWith('✓ No errors found');
      expect(p.outro).toHaveBeenCalledWith('Validation complete!');
    });

    it('should validate markdown without headers', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('Just plain text');

      await validateCommand('test.md');

      expect(p.log.success).toHaveBeenCalledWith('✓ Syntax valid');
      expect(p.log.success).toHaveBeenCalledWith('✓ No errors found');
    });

    it('should fail validation for empty file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('   \n  \n  ');

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await validateCommand('test.md');

      expect(p.log.error).toHaveBeenCalledWith('Validation failed');
      expect(p.log.error).toHaveBeenCalledWith('✗ File is empty');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should fail validation for invalid frontmatter', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // Content with "invalid" triggers the mock to throw an error
      vi.mocked(fs.readFileSync).mockReturnValue('---\ninvalid: [unclosed\n---\nContent');

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await validateCommand('test.md');

      expect(p.log.error).toHaveBeenCalledWith('Validation failed');
      expect(p.log.error).toHaveBeenCalledWith('✗ Frontmatter invalid');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if file not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await validateCommand('missing.md');

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('File not found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if operation cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.text).mockResolvedValue(Symbol('cancelled'));

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await validateCommand();

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should display spinner during validation', async () => {
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
      };
      vi.mocked(p.spinner).mockReturnValue(mockSpinner as any);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Valid');

      await validateCommand('test.md');

      expect(mockSpinner.start).toHaveBeenCalledWith('Validating markdown...');
      expect(mockSpinner.stop).toHaveBeenCalledWith('Validation complete');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await validateCommand('test.md');

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});
