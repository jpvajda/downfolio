import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('fs');
vi.mock('path');

vi.mock('../../../src/utils/paths', () => ({
  isInitialized: vi.fn(() => true),
  getTemplatesPath: vi.fn(() => '/home/user/Downfolio/Templates'),
}));

vi.mock('../../../src/lib/files', () => ({
  addTemplate: vi.fn(),
  listTemplates: vi.fn(() => []),
  removeTemplate: vi.fn(),
  getTemplateFilesInDirectory: vi.fn(() => []),
}));

import { templateCommand } from '../../../src/commands/template';
import * as p from '@clack/prompts';
import * as paths from '../../../src/utils/paths';
import * as files from '../../../src/lib/files';

describe('commands/template.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paths.isInitialized).mockReturnValue(true);
    vi.mocked(paths.getTemplatesPath).mockReturnValue('/home/user/Downfolio/Templates');
    vi.mocked(path.resolve).mockImplementation((...args: string[]) => '/' + args.join('/'));
    vi.mocked(path.basename).mockImplementation((p: string) => p.split('/').pop() || p);
    vi.mocked(path.extname).mockImplementation((p: string) => {
      const ext = p.split('.').pop();
      return ext && ext !== p ? `.${ext}` : '';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('templateCommand()', () => {
    it('should display intro message', async () => {
      await templateCommand('list');

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Template Management');
    });

    it('should exit if not initialized', async () => {
      vi.mocked(paths.isInitialized).mockReturnValue(false);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await templateCommand();

      expect(p.cancel).toHaveBeenCalledWith(
        'Downfolio not initialized. Run "downfolio init" first.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for action if not provided', async () => {
      vi.mocked(p.select).mockResolvedValue('list' as any);

      await templateCommand();

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to do?',
        })
      );
    });

    describe('add action', () => {
      it('should add template with provided options', async () => {
        const filePath = '/home/user/Downfolio/Templates/base_resume.md';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([filePath]);

        await templateCommand('add', {
          type: 'resume',
          file: filePath,
          name: 'base_resume',
        });

        expect(files.addTemplate).toHaveBeenCalled();
        expect(p.log.success).toHaveBeenCalledWith('Template "base_resume" registered successfully');
      });

      it('should prompt for template type if not provided', async () => {
        const filePath = '/home/user/Downfolio/Templates/base_resume.md';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([filePath]);
        vi.mocked(p.select)
          .mockResolvedValueOnce('resume' as any)
          .mockResolvedValueOnce(filePath as any);
        vi.mocked(p.text).mockResolvedValue('base_resume' as any);

        await templateCommand('add', { file: filePath });

        expect(p.select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Template type?',
          })
        );
      });

      it('should prompt for file selection if not provided', async () => {
        const filePath = '/home/user/Downfolio/Templates/base_resume.md';
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([filePath]);
        vi.mocked(p.select)
          .mockResolvedValueOnce('resume' as any)
          .mockResolvedValueOnce(filePath as any);
        vi.mocked(p.text).mockResolvedValue('base_resume' as any);

        await templateCommand('add', { type: 'resume' });

        expect(p.select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Which template file to register?',
          })
        );
      });

      it('should exit if no files found in Templates directory', async () => {
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([]);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await templateCommand('add');

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('No markdown files found')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should validate file is in Templates directory', async () => {
        const filePath = '/invalid/path/file.md';
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([]);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await templateCommand('add', { type: 'resume', file: filePath });

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('Template operation failed')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should prompt for name if not provided', async () => {
        const filePath = '/home/user/Downfolio/Templates/base_resume.md';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([filePath]);
        vi.mocked(p.select).mockResolvedValue(filePath as any);
        vi.mocked(p.text).mockResolvedValue('custom_name' as any);

        await templateCommand('add', { type: 'resume', file: filePath });

        expect(p.text).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Template name (for reference)?',
          })
        );
      });
    });

    describe('list action', () => {
      it('should list templates grouped by type', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
          { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);

        await templateCommand('list');

        expect(files.listTemplates).toHaveBeenCalled();
        expect(p.log.info).toHaveBeenCalledWith('Templates:');
        expect(p.log.message).toHaveBeenCalled();
      });

      it('should show info message if no templates found', async () => {
        vi.mocked(files.listTemplates).mockReturnValue([]);

        await templateCommand('list');

        expect(p.log.info).toHaveBeenCalledWith('No templates found');
      });
    });

    describe('remove action', () => {
      it('should remove template with provided name and type', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        vi.mocked(p.confirm).mockResolvedValueOnce(true as any); // First confirmation
        vi.mocked(files.removeTemplate).mockReturnValue('/path/to/resume.md');
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(p.confirm).mockResolvedValueOnce(false as any); // File deletion prompt - decline

        await templateCommand('remove', { name: 'base_resume', type: 'resume' });

        expect(files.removeTemplate).toHaveBeenCalledWith('base_resume', 'resume');
        expect(p.log.success).toHaveBeenCalledWith('Template "base_resume" removed from registry');
        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('kept in directory'));
      });

      it('should prompt for template selection if name/type not provided', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        vi.mocked(p.select).mockResolvedValue(mockTemplates[0] as any);
        vi.mocked(p.confirm).mockResolvedValueOnce(true as any); // Removal confirmation
        vi.mocked(files.removeTemplate).mockReturnValue('/path/to/resume.md');
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(p.confirm).mockResolvedValueOnce(false as any); // File deletion prompt - decline

        await templateCommand('remove');

        expect(p.select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Which template to remove?',
          })
        );
      });

      it('should delete file when user confirms', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        vi.mocked(p.confirm).mockResolvedValueOnce(true as any); // Removal confirmation
        vi.mocked(files.removeTemplate).mockReturnValue('/path/to/resume.md');
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(p.confirm).mockResolvedValueOnce(true as any); // File deletion confirmation

        await templateCommand('remove', { name: 'base_resume', type: 'resume' });

        expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/resume.md');
        expect(p.log.success).toHaveBeenCalledWith(expect.stringContaining('deleted'));
      });

      it('should not prompt for file deletion if file does not exist', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        vi.mocked(p.confirm).mockResolvedValueOnce(true as any); // Removal confirmation
        vi.mocked(files.removeTemplate).mockReturnValue('/path/to/resume.md');
        vi.mocked(fs.existsSync).mockReturnValue(false); // File doesn't exist

        await templateCommand('remove', { name: 'base_resume', type: 'resume' });

        // Should only have one confirm call (removal confirmation)
        expect(p.confirm).toHaveBeenCalledTimes(1);
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });

      it('should warn if no templates found', async () => {
        vi.mocked(files.listTemplates).mockReturnValue([]);

        await templateCommand('remove');

        expect(p.log.warn).toHaveBeenCalledWith('No templates found');
      });

      it('should exit if template not found', async () => {
        const mockTemplates = [
          { name: 'other_template', type: 'resume' as const, filePath: '/path/to/template.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await templateCommand('remove', { name: 'nonexistent', type: 'resume' });

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('Template operation failed')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should require confirmation before removing', async () => {
        const mockTemplates = [
          { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        ];
        vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
        vi.mocked(p.isCancel).mockReturnValue(false);
        vi.mocked(p.confirm).mockResolvedValue(false as any);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        await expect(templateCommand('remove', { name: 'base_resume', type: 'resume' })).rejects.toThrow('process.exit called');

        expect(p.confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Are you sure'),
          })
        );
        expect(files.removeTemplate).not.toHaveBeenCalled();
        expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
        expect(mockExit).toHaveBeenCalledWith(0);

        mockExit.mockRestore();
      });
    });

    it('should handle unknown action', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await templateCommand('unknown' as any);

      expect(p.cancel).toHaveBeenCalledWith('Unknown action: unknown');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if operation cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await templateCommand();

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(files.addTemplate).mockImplementation(() => {
        throw new Error('Add failed');
      });
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const filePath = '/home/user/Downfolio/Templates/base_resume.md';
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(files.getTemplateFilesInDirectory).mockReturnValue([filePath]);

      await templateCommand('add', { type: 'resume', file: filePath, name: 'test' });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Template operation failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should display outro message on success', async () => {
      await templateCommand('list');

      expect(p.outro).toHaveBeenCalledWith('Template operation completed');
    });
  });
});
