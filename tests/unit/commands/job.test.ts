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
  getJobsPath: vi.fn(() => '/home/user/Downfolio/Jobs'),
}));

vi.mock('../../../src/lib/files', () => ({
  addJob: vi.fn(),
  listJobs: vi.fn(() => []),
  removeJob: vi.fn(),
  getJobFilesInDirectory: vi.fn(() => []),
}));

import { jobCommand } from '../../../src/commands/job';
import * as p from '@clack/prompts';
import * as paths from '../../../src/utils/paths';
import * as files from '../../../src/lib/files';
import { fixtures } from '../../helpers/mocks';

describe('commands/job.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paths.isInitialized).mockReturnValue(true);
    vi.mocked(paths.getJobsPath).mockReturnValue('/home/user/Downfolio/Jobs');
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

  describe('jobCommand()', () => {
    it('should display intro message', async () => {
      await jobCommand('list');

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Job Management');
    });

    it('should exit if not initialized', async () => {
      vi.mocked(paths.isInitialized).mockReturnValue(false);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await jobCommand();

      expect(p.cancel).toHaveBeenCalledWith(
        'Downfolio not initialized. Run "downfolio init" first.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for action if not provided', async () => {
      vi.mocked(p.select).mockResolvedValue('list' as any);

      await jobCommand();

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to do?',
        })
      );
    });

    describe('add action', () => {
      it('should add job with provided file and name', async () => {
        const filePath = '/home/user/Downfolio/Jobs/senior_engineer.md';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(files.getJobFilesInDirectory).mockReturnValue([filePath]);

        await jobCommand('add', { file: filePath, name: 'senior_engineer' });

        expect(files.addJob).toHaveBeenCalled();
        expect(p.log.success).toHaveBeenCalledWith('Job "senior_engineer" registered successfully');
      });

      it('should prompt for file selection if not provided', async () => {
        const filePath = '/home/user/Downfolio/Jobs/senior_engineer.md';
        vi.mocked(files.getJobFilesInDirectory).mockReturnValue([filePath]);
        vi.mocked(p.select).mockResolvedValue(filePath as any);
        vi.mocked(p.text).mockResolvedValue('senior_engineer' as any);

        await jobCommand('add');

        expect(p.select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Which job description file to register?',
          })
        );
      });

      it('should exit if no files found in Jobs directory', async () => {
        vi.mocked(files.getJobFilesInDirectory).mockReturnValue([]);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await jobCommand('add');

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('No markdown files found')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should validate file is in Jobs directory', async () => {
        const filePath = '/invalid/path/file.md';
        vi.mocked(files.getJobFilesInDirectory).mockReturnValue([]);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await jobCommand('add', { file: filePath });

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('Job operation failed')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should prompt for name if not provided', async () => {
        const filePath = '/home/user/Downfolio/Jobs/senior_engineer.md';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(files.getJobFilesInDirectory).mockReturnValue([filePath]);
        vi.mocked(p.select).mockResolvedValue(filePath as any);
        vi.mocked(p.text).mockResolvedValue('custom_name' as any);

        await jobCommand('add', { file: filePath });

        expect(p.text).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Job name (for reference)?',
          })
        );
      });
    });

    describe('list action', () => {
      it('should list all jobs', async () => {
        const mockJobs = [
          { name: 'senior_engineer', filePath: '/path/to/job.md' },
          { name: 'netflix_dx', filePath: '/path/to/job2.md' },
        ];
        vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);

        await jobCommand('list');

        expect(files.listJobs).toHaveBeenCalled();
        expect(p.log.info).toHaveBeenCalledWith('Jobs:');
        expect(p.log.message).toHaveBeenCalled();
      });

      it('should show info message if no jobs found', async () => {
        vi.mocked(files.listJobs).mockReturnValue([]);

        await jobCommand('list');

        expect(p.log.info).toHaveBeenCalledWith('No jobs found');
      });
    });

    describe('remove action', () => {
      it('should remove job with provided name', async () => {
        const mockJobs = [
          { name: 'senior_engineer', filePath: '/path/to/job.md' },
        ];
        vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);
        vi.mocked(p.confirm).mockResolvedValue(true as any);

        await jobCommand('remove', { name: 'senior_engineer' });

        expect(files.removeJob).toHaveBeenCalledWith('senior_engineer');
        expect(p.log.success).toHaveBeenCalledWith('Job "senior_engineer" removed successfully');
      });

      it('should prompt for job selection if name not provided', async () => {
        const mockJobs = [
          { name: 'senior_engineer', filePath: '/path/to/job.md' },
        ];
        vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);
        vi.mocked(p.select).mockResolvedValue(mockJobs[0] as any);
        vi.mocked(p.confirm).mockResolvedValue(true as any);

        await jobCommand('remove');

        expect(p.select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Which job to remove?',
          })
        );
      });

      it('should warn if no jobs found', async () => {
        vi.mocked(files.listJobs).mockReturnValue([]);

        await jobCommand('remove');

        expect(p.log.warn).toHaveBeenCalledWith('No jobs found');
      });

      it('should exit if job not found', async () => {
        const mockJobs = [
          { name: 'other_job', filePath: '/path/to/job.md' },
        ];
        vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        await jobCommand('remove', { name: 'nonexistent' });

        expect(p.cancel).toHaveBeenCalledWith(
          expect.stringContaining('Job operation failed')
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
      });

      it('should require confirmation before removing', async () => {
        const mockJobs = [
          { name: 'senior_engineer', filePath: '/path/to/job.md' },
        ];
        vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);
        vi.mocked(p.isCancel).mockReturnValue(false);
        vi.mocked(p.confirm).mockResolvedValue(false as any);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        await expect(jobCommand('remove', { name: 'senior_engineer' })).rejects.toThrow('process.exit called');

        expect(p.confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Are you sure'),
          })
        );
        expect(files.removeJob).not.toHaveBeenCalled();
        expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
        expect(mockExit).toHaveBeenCalledWith(0);

        mockExit.mockRestore();
      });
    });

    it('should handle unknown action', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await jobCommand('unknown' as any);

      expect(p.cancel).toHaveBeenCalledWith('Unknown action: unknown');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if operation cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await jobCommand();

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(files.addJob).mockImplementation(() => {
        throw new Error('Add failed');
      });
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const filePath = '/home/user/Downfolio/Jobs/senior_engineer.md';
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(files.getJobFilesInDirectory).mockReturnValue([filePath]);

      await jobCommand('add', { file: filePath, name: 'test' });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Job operation failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should display outro message on success', async () => {
      await jobCommand('list');

      expect(p.outro).toHaveBeenCalledWith('Job operation completed');
    });
  });
});
