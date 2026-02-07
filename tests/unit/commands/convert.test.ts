import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules
vi.mock('fs');
vi.mock('path');
vi.mock('execa', () => ({
  execa: vi.fn(),
}));
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));
vi.mock('../../../src/utils/paths', () => ({
  isInitialized: vi.fn(() => true),
  getOutputPath: vi.fn(() => '/home/user/Downfolio/Output'),
  ensureDirectoryExists: vi.fn(),
}));
vi.mock('../../../src/lib/pandoc', () => ({
  isPandocInstalled: vi.fn(),
  convertToDocx: vi.fn(),
  convertToPdf: vi.fn(),
}));

import { convertCommand } from '../../../src/commands/convert';
import * as p from '@clack/prompts';
import { isPandocInstalled, convertToDocx, convertToPdf } from '../../../src/lib/pandoc';
import { isInitialized, getOutputPath, ensureDirectoryExists } from '../../../src/utils/paths';
import { execa } from 'execa';

describe('commands/convert.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isInitialized).mockReturnValue(true);
    vi.mocked(getOutputPath).mockReturnValue('/home/user/Downfolio/Output');
    vi.mocked(isPandocInstalled).mockResolvedValue(true);
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.dirname).mockImplementation((p) => {
      const str = String(p);
      const lastSlash = str.lastIndexOf('/');
      return lastSlash >= 0 ? str.substring(0, lastSlash) : str;
    });
    vi.mocked(path.basename).mockImplementation((p, ext) => {
      const str = String(p);
      const base = str.split('/').pop() || str;
      if (ext && base.endsWith(ext)) {
        return base.slice(0, -ext.length);
      }
      return base;
    });
    vi.mocked(path.resolve).mockImplementation((p) => String(p));
    vi.mocked(path.relative).mockImplementation((from, to) => {
      const fromStr = String(from);
      const toStr = String(to);
      if (toStr.startsWith(fromStr)) {
        return toStr.substring(fromStr.length + 1);
      }
      return toStr;
    });
    // Default: mock process.exit to prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertCommand()', () => {
    it('should exit if not initialized', async () => {
      vi.mocked(isInitialized).mockReturnValue(false);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({});

      expect(p.cancel).toHaveBeenCalledWith(
        'Downfolio not initialized. Run "downfolio init" first.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should convert file provided as argument to docx', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        // Input file exists, output file doesn't exist yet
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx'],
      });

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Convert Document');
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/resume.md');
      expect(convertToDocx).toHaveBeenCalled();
      expect(p.outro).toHaveBeenCalled();
    });

    it('should convert file provided as argument to pdf', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToPdf).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['pdf'],
      });

      expect(convertToPdf).toHaveBeenCalled();
    });

    it('should convert file to both docx and pdf', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();
      vi.mocked(convertToPdf).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx', 'pdf'],
      });

      expect(convertToDocx).toHaveBeenCalled();
      expect(convertToPdf).toHaveBeenCalled();
    });

    it('should prompt for file selection when file not provided', async () => {
      const mockFiles = [
        '/home/user/Downfolio/Output/job1/resume.md',
        '/home/user/Downfolio/Output/job2/cover_letter.md',
      ];

      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === '/home/user/Downfolio/Output') return true;
        if (mockFiles.includes(pathStr)) return true;
        // Output file doesn't exist
        return false;
      });
      vi.mocked(fs.readdirSync).mockImplementation((dir, options) => {
        const dirStr = String(dir);
        if (dirStr === '/home/user/Downfolio/Output') {
          return [
            { name: 'job1', isFile: () => false, isDirectory: () => true },
            { name: 'job2', isFile: () => false, isDirectory: () => true },
          ] as any;
        }
        if (dirStr === '/home/user/Downfolio/Output/job1') {
          return [{ name: 'resume.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        if (dirStr === '/home/user/Downfolio/Output/job2') {
          return [{ name: 'cover_letter.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        return [] as any;
      });
      vi.mocked(p.select).mockResolvedValue(mockFiles[0] as any);
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        format: ['docx'],
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which markdown file to convert?',
        })
      );
      expect(convertToDocx).toHaveBeenCalled();
    });

    it('should exit if no markdown files found in output directory', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({});

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('No markdown files found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for format selection when format not provided', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(p.multiselect).mockResolvedValue(['docx'] as any);
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
      });

      expect(p.multiselect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Output format(s)?',
        })
      );
      expect(convertToDocx).toHaveBeenCalled();
    });

    it('should exit if pandoc not installed', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(isPandocInstalled).mockResolvedValue(false);
      vi.mocked(p.multiselect).mockResolvedValue(['docx'] as any);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/resume.md',
      });

      expect(p.cancel).toHaveBeenCalledWith(expect.stringContaining('Pandoc is not installed'));
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if file not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/missing.md',
        format: ['docx'],
      });

      expect(p.cancel).toHaveBeenCalledWith(expect.stringContaining('File not found'));
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if file is not markdown', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/resume.txt',
        format: ['docx'],
      });

      expect(p.cancel).toHaveBeenCalledWith(
        'Input file must be a markdown file (.md)'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should use custom output directory when provided', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx'],
        outputDir: '/custom/output',
      });

      expect(ensureDirectoryExists).toHaveBeenCalledWith('/custom/output');
      expect(convertToDocx).toHaveBeenCalledWith(
        '/path/to/resume.md',
        expect.stringContaining('/custom/output')
      );
    });

    it('should use custom output name when provided', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx'],
        outputName: 'custom_name',
      });

      expect(convertToDocx).toHaveBeenCalledWith(
        '/path/to/resume.md',
        expect.stringContaining('custom_name.docx')
      );
    });

    it('should prompt for confirmation when file already exists', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === '/path/to/resume.md') return true;
        if (pathStr.includes('resume.docx')) return true; // Output file exists
        return false;
      });
      vi.mocked(p.confirm).mockResolvedValue(true);
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx'],
      });

      expect(p.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already exist'),
        })
      );
      expect(convertToDocx).toHaveBeenCalled();
    });

    it('should cancel conversion if user declines overwrite', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === '/path/to/resume.md') return true;
        if (pathStr.includes('resume.docx')) return true;
        return false;
      });
      vi.mocked(p.confirm).mockResolvedValue(false);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        // In real execution, this would stop the function, but in tests we need to throw
        // to simulate the exit behavior
        throw new Error('process.exit called');
      });

      try {
        await convertCommand({
          file: '/path/to/resume.md',
          format: ['docx'],
        });
      } catch (error) {
        // Expected - process.exit throws in our mock to stop execution
      }

      expect(p.cancel).toHaveBeenCalledWith('Conversion cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);
      // convertToDocx should not be called because process.exit stops execution
      expect(convertToDocx).not.toHaveBeenCalled();

      mockExit.mockRestore();
    });

    it('should handle cancellation during file selection', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/home/user/Downfolio/Output';
      });
      vi.mocked(fs.readdirSync).mockImplementation((dir, options) => {
        const dirStr = String(dir);
        if (dirStr === '/home/user/Downfolio/Output') {
          return [
            { name: 'resume.md', isFile: () => true, isDirectory: () => false },
          ] as any;
        }
        return [] as any;
      });
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({});

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should handle cancellation during format selection', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.multiselect).mockResolvedValue(Symbol('cancelled') as any);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/resume.md',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should filter invalid formats', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();
      vi.mocked(convertToPdf).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx', 'invalid', 'pdf'],
      });

      // Should only call docx and pdf, not invalid format
      expect(convertToDocx).toHaveBeenCalled();
      expect(convertToPdf).toHaveBeenCalled();
    });

    it('should exit if all formats are invalid', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['invalid1', 'invalid2'],
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Invalid format')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should recursively find markdown files in subdirectories', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === '/home/user/Downfolio/Output') return true;
        if (pathStr === '/home/user/Downfolio/Output/job1/subdir/nested.md') return true;
        return false;
      });
      vi.mocked(fs.readdirSync).mockImplementation((dir, options) => {
        const dirStr = String(dir);
        if (dirStr === '/home/user/Downfolio/Output') {
          return [
            { name: 'job1', isFile: () => false, isDirectory: () => true },
            { name: 'job2', isFile: () => false, isDirectory: () => true },
          ] as any;
        }
        if (dirStr === '/home/user/Downfolio/Output/job1') {
          return [
            { name: 'resume.md', isFile: () => true, isDirectory: () => false },
            { name: 'subdir', isFile: () => false, isDirectory: () => true },
          ] as any;
        }
        if (dirStr === '/home/user/Downfolio/Output/job1/subdir') {
          return [
            { name: 'nested.md', isFile: () => true, isDirectory: () => false },
          ] as any;
        }
        if (dirStr === '/home/user/Downfolio/Output/job2') {
          return [
            { name: 'cover_letter.md', isFile: () => true, isDirectory: () => false },
          ] as any;
        }
        return [] as any;
      });
      vi.mocked(p.select).mockResolvedValue('/home/user/Downfolio/Output/job1/subdir/nested.md' as any);
      vi.mocked(convertToDocx).mockResolvedValue();

      await convertCommand({
        format: ['docx'],
      });

      expect(p.select).toHaveBeenCalled();
      expect(convertToDocx).toHaveBeenCalled();
    });

    it('should show spinner during conversion', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
        message: vi.fn(),
      };
      vi.mocked(p.spinner).mockReturnValue(mockSpinner as any);
      vi.mocked(convertToDocx).mockResolvedValue();
      vi.mocked(convertToPdf).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx', 'pdf'],
      });

      expect(mockSpinner.start).toHaveBeenCalledWith('Converting files...');
      expect(mockSpinner.message).toHaveBeenCalledWith(expect.stringContaining('DOCX'));
      expect(mockSpinner.message).toHaveBeenCalledWith(expect.stringContaining('PDF'));
      expect(mockSpinner.stop).toHaveBeenCalledWith('Conversion complete');
    });

    it('should handle conversion errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockRejectedValue(new Error('Conversion failed'));

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx'],
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Conversion failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should display created files in outro message', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr === '/path/to/resume.md';
      });
      vi.mocked(convertToDocx).mockResolvedValue();
      vi.mocked(convertToPdf).mockResolvedValue();

      await convertCommand({
        file: '/path/to/resume.md',
        format: ['docx', 'pdf'],
      });

      expect(p.outro).toHaveBeenCalledWith(
        expect.stringContaining('Files created')
      );
      expect(p.outro).toHaveBeenCalledWith(
        expect.stringMatching(/resume\.docx|resume\.pdf/)
      );
    });
  });
});
