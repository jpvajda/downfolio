import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));

vi.mock('fs');
vi.mock('path');

vi.mock('../../../src/utils/paths', () => ({
  isInitialized: vi.fn(() => true),
  getOutputPath: vi.fn(() => '/home/user/Downfolio/Output'),
}));

vi.mock('../../../src/lib/files', () => ({
  getJob: vi.fn(),
  listJobs: vi.fn(() => []),
  listTemplates: vi.fn(() => []),
  readTemplateFile: vi.fn(),
  readJobFile: vi.fn(),
}));

vi.mock('../../../src/lib/ai', () => ({
  customizeDocument: vi.fn(),
}));

vi.mock('../../../src/lib/pandoc', () => ({
  convertMarkdownToFormats: vi.fn(),
}));

vi.mock('../../../src/lib/config', () => ({
  getApiKey: vi.fn(),
  getDefaultModel: vi.fn(),
}));

import { generateCommand } from '../../../src/commands/generate';
import * as p from '@clack/prompts';
import * as paths from '../../../src/utils/paths';
import * as files from '../../../src/lib/files';
import * as ai from '../../../src/lib/ai';
import * as pandoc from '../../../src/lib/pandoc';
import * as config from '../../../src/lib/config';

describe('commands/generate.ts', () => {
  const mockSpinner = {
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paths.isInitialized).mockReturnValue(true);
    vi.mocked(paths.getOutputPath).mockReturnValue('/home/user/Downfolio/Output');
    vi.mocked(p.spinner).mockReturnValue(mockSpinner as any);
    vi.mocked(path.join).mockImplementation((...args: string[]) => args.join('/'));
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
      if (provider === 'openai') return 'sk-openai-key';
      if (provider === 'anthropic') return 'sk-anthropic-key';
      return undefined;
    });
    vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCommand()', () => {
    it('should display intro message', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.listJobs).mockReturnValue([mockJob] as any);
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.intro).toHaveBeenCalledWith('Downfolio - Generate Documents');
    });

    it('should exit if not initialized', async () => {
      vi.mocked(paths.isInitialized).mockReturnValue(false);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({});

      expect(p.cancel).toHaveBeenCalledWith(
        'Downfolio not initialized. Run "downfolio init" first.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for job if not provided', async () => {
      const mockJobs = [
        { name: 'job1', filePath: '/path/to/job1.md' },
        { name: 'job2', filePath: '/path/to/job2.md' },
      ];
      vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);
      vi.mocked(p.select).mockResolvedValue('job1' as any);
      vi.mocked(files.getJob).mockReturnValue(mockJobs[0] as any);
      vi.mocked(files.listTemplates).mockReturnValue([]);

      await generateCommand({ type: 'resume' }).catch(() => {});

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which job?',
        })
      );
    });

    it('should exit if no jobs found', async () => {
      vi.mocked(files.listJobs).mockReturnValue([]);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({});

      expect(p.cancel).toHaveBeenCalledWith(
        'No jobs found. Add one with "downfolio job add"'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if job not found', async () => {
      vi.mocked(files.getJob).mockReturnValue(undefined);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'nonexistent' });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Job "nonexistent" not found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for document type if not provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(p.select).mockResolvedValue('resume' as any);
      vi.mocked(files.listTemplates).mockReturnValue([]);

      await generateCommand({ job: 'test_job' }).catch(() => {});

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to generate?',
        })
      );
    });

    it('should prompt for resume template if not provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue('base_resume' as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        format: ['markdown'],
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which resume template?',
        })
      );
    });

    it('should exit if no resume templates found', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue([]);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'test_job', type: 'resume' });

      expect(p.cancel).toHaveBeenCalledWith(
        'No resume templates found. Add one with "downfolio template add"'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for cover letter template if not provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue('base_cover_letter' as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'cover-letter',
        format: ['markdown'],
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which cover letter template?',
        })
      );
    });

    it('should prompt for output formats if not provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.multiselect).mockResolvedValue(['markdown'] as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.multiselect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Output format(s)?',
        })
      );
    });

    it('should prompt for output name if not provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.text).mockResolvedValue('custom_output' as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Output name?',
        })
      );
    });

    it('should auto-select provider if only one API key available', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'openai') return 'sk-openai-key';
        return undefined;
      });

      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        model: 'gpt-4o-mini',
      });

      expect(ai.customizeDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
        })
      );
    });

    it('should prompt for provider if multiple API keys available', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'openai') return 'sk-openai-key';
        if (provider === 'anthropic') return 'sk-anthropic-key';
        return undefined;
      });
      vi.mocked(p.select).mockResolvedValue('openai' as any);

      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        model: 'gpt-4o-mini',
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which AI provider?',
        })
      );
    });

    it('should exit if no API keys found', async () => {
      vi.mocked(config.getApiKey).mockReturnValue(undefined);
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('No API keys found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should validate provider has API key when specified', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'anthropic') return 'sk-anthropic-key';
        return undefined;
      });
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        provider: 'openai',
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('OpenAI API key not found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should generate resume successfully', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized resume', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(ai.customizeDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: 'resume',
          provider: 'openai',
          model: 'gpt-4o-mini',
        })
      );
      expect(mockSpinner.start).toHaveBeenCalledWith('Generating documents...');
      expect(mockSpinner.stop).toHaveBeenCalledWith('Documents generated');
      expect(p.outro).toHaveBeenCalled();
    });

    it('should generate cover letter successfully', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized cover letter', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'cover-letter',
        coverLetterTemplate: 'base_cover_letter',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(ai.customizeDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: 'cover-letter',
        })
      );
    });

    it('should generate both resume and cover letter', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
        { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument)
        .mockResolvedValueOnce({ content: 'Customized resume', provider: 'openai' } as any)
        .mockResolvedValueOnce({ content: 'Customized cover letter', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'both',
        resumeTemplate: 'base_resume',
        coverLetterTemplate: 'base_cover_letter',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(ai.customizeDocument).toHaveBeenCalledTimes(2);
    });

    it('should convert to docx format', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized resume', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['docx'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(pandoc.convertMarkdownToFormats).toHaveBeenCalledWith(
        'Customized resume',
        'resume.md',
        expect.any(String),
        ['docx']
      );
    });

    it('should create output directory if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized resume', provider: 'openai' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('test_output'),
        { recursive: true }
      );
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(ai.customizeDocument).mockRejectedValue(new Error('AI error'));
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Generation failed')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if operation cancelled', async () => {
      vi.mocked(p.isCancel).mockReturnValue(true);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const mockJobs = [{ name: 'job1', filePath: '/path/to/job1.md' }];
      vi.mocked(files.listJobs).mockReturnValue(mockJobs as any);

      await generateCommand({});

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });
  });
});
