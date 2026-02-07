import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';

// Mock modules
vi.mock('fs');
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import {
  isPandocInstalled,
  convertToDocx,
  convertToPdf,
  convertMarkdownToFormats,
} from '../../../src/lib/pandoc';
import { execa } from 'execa';

describe('lib/pandoc.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isPandocInstalled()', () => {
    it('should detect if Pandoc is installed', async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: 'pandoc 3.1.1',
        stderr: '',
      } as any);

      const result = await isPandocInstalled();

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('pandoc', ['--version']);
    });

    it('should detect if Pandoc is not installed', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('command not found'));

      const result = await isPandocInstalled();

      expect(result).toBe(false);
    });

    it('should handle command errors gracefully', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Permission denied'));

      const result = await isPandocInstalled();

      expect(result).toBe(false);
    });
  });

  describe('convertToDocx()', () => {
    const markdownPath = '/path/to/resume.md';
    const outputPath = '/path/to/resume.docx';

    it('should convert markdown to docx successfully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa).mockResolvedValue({
        stdout: '',
        stderr: '',
      } as any);

      await convertToDocx(markdownPath, outputPath);

      expect(fs.existsSync).toHaveBeenCalledWith(markdownPath);
      expect(execa).toHaveBeenCalledWith('pandoc', [
        markdownPath,
        '-o',
        outputPath,
        '--from',
        'markdown+smart',
        '--to',
        'docx',
        '--standalone',
      ]);
    });

    it('should throw if markdown file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(convertToDocx(markdownPath, outputPath)).rejects.toThrow(
        'Markdown file not found'
      );
    });

    it('should handle Pandoc conversion errors', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa).mockRejectedValue(new Error('Pandoc error'));

      await expect(convertToDocx(markdownPath, outputPath)).rejects.toThrow(
        'Pandoc conversion to docx failed'
      );
    });

    it('should pass correct arguments to Pandoc', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa).mockResolvedValue({
        stdout: '',
        stderr: '',
      } as any);

      await convertToDocx(markdownPath, outputPath);

      expect(execa).toHaveBeenCalledWith(
        'pandoc',
        expect.arrayContaining([
          markdownPath,
          '-o',
          outputPath,
          '--from',
          'markdown+smart',
          '--to',
          'docx',
          '--standalone',
        ])
      );
    });
  });

  describe('convertToPdf()', () => {
    const markdownPath = '/path/to/resume.md';
    const outputPath = '/path/to/resume.pdf';

    it('should convert markdown to PDF successfully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa).mockResolvedValue({
        stdout: '',
        stderr: '',
      } as any);

      await convertToPdf(markdownPath, outputPath);

      expect(fs.existsSync).toHaveBeenCalledWith(markdownPath);
      expect(execa).toHaveBeenCalledWith(
        'pandoc',
        [
          markdownPath,
          '-o',
          outputPath,
          '--from',
          'markdown+smart',
          '--to',
          'pdf',
          '--pdf-engine=pdflatex',
          '--standalone',
        ],
        expect.objectContaining({
          env: expect.any(Object),
        })
      );
    });

    it('should throw if markdown file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(convertToPdf(markdownPath, outputPath)).rejects.toThrow(
        'Markdown file not found'
      );
    });

    it('should fallback to xelatex if pdflatex fails', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error('pdflatex not found'))
        .mockResolvedValueOnce({
          stdout: '',
          stderr: '',
        } as any);

      await convertToPdf(markdownPath, outputPath);

      expect(execa).toHaveBeenCalledTimes(2);
      expect(execa).toHaveBeenNthCalledWith(
        1,
        'pandoc',
        [
          markdownPath,
          '-o',
          outputPath,
          '--from',
          'markdown+smart',
          '--to',
          'pdf',
          '--pdf-engine=pdflatex',
          '--standalone',
        ],
        expect.objectContaining({
          env: expect.any(Object),
        })
      );
      expect(execa).toHaveBeenNthCalledWith(
        2,
        'pandoc',
        [
          markdownPath,
          '-o',
          outputPath,
          '--from',
          'markdown+smart',
          '--to',
          'pdf',
          '--pdf-engine=xelatex',
          '--standalone',
        ],
        expect.objectContaining({
          env: expect.any(Object),
        })
      );
    });

    it('should throw helpful error if both PDF engines fail', async () => {
      // Mock existsSync to return true for markdown file, false for TeX bin path
      vi.mocked(fs.existsSync).mockImplementation((path: any) => {
        if (path === markdownPath) return true;
        if (path === '/Library/TeX/texbin') return false;
        return false;
      });

      vi.mocked(execa)
        .mockRejectedValueOnce(new Error('pdflatex not found'))
        .mockRejectedValueOnce(new Error('xelatex not found'));

      await expect(convertToPdf(markdownPath, outputPath)).rejects.toThrow(
        'PDF conversion failed'
      );

      // Reset and test again for second assertion
      vi.mocked(execa)
        .mockRejectedValueOnce(new Error('pdflatex not found'))
        .mockRejectedValueOnce(new Error('xelatex not found'));

      await expect(convertToPdf(markdownPath, outputPath)).rejects.toThrow(
        'install a PDF engine'
      );
    });
  });

  describe('convertMarkdownToFormats()', () => {
    const markdownContent = '# Test Resume';
    const markdownFileName = 'resume.md';
    const outputDir = '/path/to/output';

    it('should write markdown file', async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: '',
        stderr: '',
      } as any);

      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        []
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${outputDir}/${markdownFileName}`,
        markdownContent,
        'utf-8'
      );
      expect(result).toContain(`${outputDir}/${markdownFileName}`);
    });

    it('should convert to docx when requested', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // isPandocInstalled
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // convertToDocx

      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        ['docx']
      );

      expect(execa).toHaveBeenCalledWith(
        'pandoc',
        expect.arrayContaining(['--to', 'docx'])
      );
      expect(result).toHaveLength(2); // markdown + docx
      expect(result.some(f => f.endsWith('.docx'))).toBe(true);
    });

    it('should convert to PDF when requested', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // isPandocInstalled
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // convertToPdf

      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        ['pdf']
      );

      // Check that execa was called with pandoc and PDF-related arguments
      const calls = vi.mocked(execa).mock.calls;
      const pdfCall = calls.find(call =>
        call[0] === 'pandoc' &&
        Array.isArray(call[1]) &&
        call[1].includes('--to') &&
        call[1].includes('pdf')
      );
      expect(pdfCall).toBeDefined();
      expect(result).toHaveLength(2); // markdown + pdf
      expect(result.some(f => f.endsWith('.pdf'))).toBe(true);
    });

    it('should handle multiple formats', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // isPandocInstalled
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // convertToDocx
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // convertToPdf

      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        ['docx', 'pdf']
      );

      expect(result).toHaveLength(3); // markdown + docx + pdf
      expect(result.some(f => f.endsWith('.md'))).toBe(true);
      expect(result.some(f => f.endsWith('.docx'))).toBe(true);
      expect(result.some(f => f.endsWith('.pdf'))).toBe(true);
    });

    it('should throw if Pandoc not installed when formats requested', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('command not found'));

      await expect(
        convertMarkdownToFormats(
          markdownContent,
          markdownFileName,
          outputDir,
          ['docx']
        )
      ).rejects.toThrow('Pandoc is not installed');
    });

    it('should not throw if Pandoc not installed when no formats requested', async () => {
      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('.md');
    });

    it('should return array of created file paths', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      const result = await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        ['docx']
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(f => typeof f === 'string')).toBe(true);
      expect(result.every(f => f.startsWith(outputDir))).toBe(true);
    });

    it('should create output directory for files', async () => {
      vi.mocked(execa).mockResolvedValue({
        stdout: '',
        stderr: '',
      } as any);

      await convertMarkdownToFormats(
        markdownContent,
        markdownFileName,
        outputDir,
        []
      );

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(outputDir),
        expect.any(String),
        'utf-8'
      );
    });
  });
});
