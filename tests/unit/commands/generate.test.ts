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

    it('should exit if no cover letter templates found', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue([]);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'test_job', type: 'cover-letter' });

      expect(p.cancel).toHaveBeenCalledWith(
        'No cover letter templates found. Add one with "downfolio template add"'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if invalid OpenAI model provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue([
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ]);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        provider: 'openai',
        model: 'invalid-model' as any,
      });

      expect(p.cancel).toHaveBeenCalledWith(
        'Model "invalid-model" is not a valid OpenAI model.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should exit if invalid Anthropic model provided', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue([
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ]);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        provider: 'anthropic',
        model: 'gpt-4o-mini' as any,
      });

      expect(p.cancel).toHaveBeenCalledWith(
        'Model "gpt-4o-mini" is not a valid Anthropic model.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should prompt for OpenAI model if not provided', async () => {
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
      vi.mocked(p.select).mockResolvedValue('gpt-4o' as any);
      vi.mocked(p.isCancel).mockReturnValue(false);
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
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which OpenAI model?',
        })
      );
    });

    it('should prompt for Anthropic model if not provided', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'anthropic') return 'sk-anthropic-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue('claude-haiku-4-5' as any);
      vi.mocked(p.isCancel).mockReturnValue(false);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      vi.mocked(files.readTemplateFile).mockReturnValue('Template content');
      vi.mocked(ai.customizeDocument).mockResolvedValue({ content: 'Customized content', provider: 'anthropic' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'anthropic',
      });

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which Anthropic model?',
        })
      );
    });

    it('should convert to PDF format', async () => {
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
        format: ['pdf'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(pandoc.convertMarkdownToFormats).toHaveBeenCalledWith(
        'Customized resume',
        'resume.md',
        expect.any(String),
        ['pdf']
      );
    });

    it('should convert to multiple formats (docx and pdf)', async () => {
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
        format: ['docx', 'pdf'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(pandoc.convertMarkdownToFormats).toHaveBeenCalledWith(
        'Customized resume',
        'resume.md',
        expect.any(String),
        ['docx', 'pdf']
      );
    });

    it('should skip directory creation if output directory already exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
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

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should default output name to job name when empty string provided', async () => {
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
      vi.mocked(p.text).mockResolvedValue('' as any);
      vi.mocked(p.isCancel).mockReturnValue(false);
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

      expect(p.outro).toHaveBeenCalledWith(
        expect.stringContaining('test_job')
      );
    });

    it('should exit if document type selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'test_job' });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if resume template selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'test_job', type: 'resume' });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if cover letter template selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({ job: 'test_job', type: 'cover-letter' });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if format selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.multiselect).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if provider selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if OpenAI model selection is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'openai',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if Anthropic model selection is cancelled', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'anthropic') return 'sk-anthropic-key';
        return undefined;
      });

      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.select).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        output: 'test_output',
        provider: 'anthropic',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should exit if output name is cancelled', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(p.text).mockResolvedValue(Symbol('cancelled') as any);
      vi.mocked(p.isCancel).mockReturnValue(true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
        resumeTemplate: 'base_resume',
        format: ['markdown'],
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(p.cancel).toHaveBeenCalledWith('Operation cancelled');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should generate documents with Anthropic provider', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'anthropic') return 'sk-anthropic-key';
        return undefined;
      });

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
        .mockResolvedValueOnce({ content: 'Customized resume', provider: 'anthropic' } as any)
        .mockResolvedValueOnce({ content: 'Customized cover letter', provider: 'anthropic' } as any);

      await generateCommand({
        job: 'test_job',
        type: 'both',
        resumeTemplate: 'base_resume',
        coverLetterTemplate: 'base_cover_letter',
        format: ['markdown'],
        output: 'test_output',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
      });

      expect(ai.customizeDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-sonnet-4-5',
        })
      );
      expect(p.outro).toHaveBeenCalled();
    });

    it('should display spinner messages in correct order', async () => {
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

      const messageCalls = mockSpinner.message.mock.calls;
      expect(messageCalls[0][0]).toBe('Reading job description...');
      expect(messageCalls[1][0]).toBe('AI customizing resume...');
      expect(messageCalls[2][0]).toBe('Converting resume to Word/PDF...');
    });

    it('should call readTemplateFile with correct parameters for resume', async () => {
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

      expect(files.readTemplateFile).toHaveBeenCalledWith('base_resume', 'resume');
    });

    it('should call readTemplateFile with correct parameters for cover letter', async () => {
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

      expect(files.readTemplateFile).toHaveBeenCalledWith('base_cover_letter', 'cover-letter');
    });

    it('should exit if Anthropic API key not found when provider specified', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider: string) => {
        if (provider === 'openai') return 'sk-openai-key';
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
        provider: 'anthropic',
      });

      expect(p.cancel).toHaveBeenCalledWith(
        expect.stringContaining('Anthropic API key not found')
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should display correct spinner message when converting cover letter to Word/PDF', async () => {
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
        format: ['docx'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const messageCalls = mockSpinner.message.mock.calls;
      expect(messageCalls.some(call => call[0] === 'Converting cover letter to Word/PDF...')).toBe(true);
    });

    it('should generate both documents with docx format and show conversion messages', async () => {
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
        format: ['docx', 'pdf'],
        output: 'test_output',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const messageCalls = mockSpinner.message.mock.calls;
      expect(messageCalls.some(call => call[0] === 'Converting resume to Word/PDF...')).toBe(true);
      expect(messageCalls.some(call => call[0] === 'Converting cover letter to Word/PDF...')).toBe(true);
    });

    it('should handle generation failure when resume template becomes undefined', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_resume', type: 'resume' as const, filePath: '/path/to/resume.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      
      // Mock select to return undefined (simulating an edge case)
      let selectCallCount = 0;
      vi.mocked(p.select).mockImplementation(async () => {
        selectCallCount++;
        return undefined as any;
      });
      vi.mocked(p.isCancel).mockReturnValue(false);
      
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'resume',
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

    it('should handle generation failure when cover letter template becomes undefined', async () => {
      const mockJob = { name: 'test_job', filePath: '/path/to/job.md' };
      const mockTemplates = [
        { name: 'base_cover_letter', type: 'cover-letter' as const, filePath: '/path/to/cl.md' },
      ];
      vi.mocked(files.getJob).mockReturnValue(mockJob as any);
      vi.mocked(files.listTemplates).mockReturnValue(mockTemplates as any);
      vi.mocked(files.readJobFile).mockReturnValue('Job description');
      
      // Mock select to return undefined (simulating an edge case)
      vi.mocked(p.select).mockImplementation(async () => {
        return undefined as any;
      });
      vi.mocked(p.isCancel).mockReturnValue(false);
      
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await generateCommand({
        job: 'test_job',
        type: 'cover-letter',
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
  });
});
