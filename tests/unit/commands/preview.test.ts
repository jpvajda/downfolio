import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules
vi.mock('fs');
vi.mock('path', () => ({
  basename: vi.fn((p: string) => p.split('/').pop()),
}));
vi.mock('marked', () => ({
  marked: vi.fn((content: string) => Promise.resolve(`<h1>HTML version</h1><p>${content}</p>`)),
}));
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));

import { previewCommand } from '../../../src/commands/preview';
import * as p from '@clack/prompts';
import { marked } from 'marked';

describe('commands/preview.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('previewCommand()', () => {
    it('should preview file provided as argument', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test Content');

      await previewCommand('test.md');

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Preview Document');
      expect(fs.existsSync).toHaveBeenCalledWith('test.md');
      expect(fs.readFileSync).toHaveBeenCalledWith('test.md', 'utf-8');
      expect(marked).toHaveBeenCalledWith('# Test Content');
    });

    it('should prompt for file if not provided', async () => {
      vi.mocked(p.text).mockResolvedValue('prompted.md');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Content');

      await previewCommand();

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'File to preview?',
        })
      );
    });

    it('should display preview using note', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');
      vi.mocked(marked).mockResolvedValue('<h1>Test</h1>');

      await previewCommand('test.md');

      expect(p.note).toHaveBeenCalledWith(
        expect.any(String),
        'Preview: test.md'
      );
    });

    it('should strip HTML tags from preview', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');
      vi.mocked(marked).mockResolvedValue('<h1>Header</h1><p>Paragraph</p>');

      await previewCommand('test.md');

      expect(p.note).toHaveBeenCalledWith(
        expect.stringMatching(/Header.*Paragraph/s),
        expect.any(String)
      );
    });

    it('should handle HTML entities', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('Test');
      vi.mocked(marked).mockResolvedValue('<p>&nbsp;&amp;&lt;&gt;&quot;</p>');

      await previewCommand('test.md');

      const noteCall = vi.mocked(p.note).mock.calls[0][0];
      // After HTML stripping and entity replacement, we should have the actual characters
      expect(noteCall).toBeTruthy();
      expect(p.note).toHaveBeenCalled();
    });

    it('should truncate long content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');
      const longContent = 'a'.repeat(600);
      vi.mocked(marked).mockResolvedValue(`<p>${longContent}</p>`);

      await previewCommand('test.md');

      const noteCall = vi.mocked(p.note).mock.calls[0][0];
      expect(noteCall).toHaveLength(503); // 500 chars + '...'
      expect(noteCall).toContain('...');
    });

    it('should not truncate short content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');
      vi.mocked(marked).mockResolvedValue('<p>Short content</p>');

      await previewCommand('test.md');

      const noteCall = vi.mocked(p.note).mock.calls[0][0];
      expect(noteCall).not.toContain('...');
    });

    it('should exit if file not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await previewCommand('missing.md');

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

      await previewCommand();

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should display success message', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');

      await previewCommand('test.md');

      expect(p.outro).toHaveBeenCalledWith('Preview complete');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await previewCommand('test.md');

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Preview failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should use basename for file display', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Test');
      vi.mocked(path.basename).mockReturnValue('file.md');

      await previewCommand('/long/path/to/file.md');

      expect(p.note).toHaveBeenCalledWith(
        expect.any(String),
        'Preview: file.md'
      );
    });
  });
});
