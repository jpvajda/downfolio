import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Template, Job } from '../../../src/types';

// Mock modules
vi.mock('fs');
vi.mock('path', () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
  resolve: vi.fn((p: string) => p.startsWith('/') ? p : '/' + p),
  dirname: vi.fn((p: string) => p.substring(0, p.lastIndexOf('/'))),
}));
vi.mock('../../../src/utils/paths', () => ({
  getTemplatesPath: vi.fn(() => '/home/user/Downfolio/Templates'),
  getJobsPath: vi.fn(() => '/home/user/Downfolio/Jobs'),
  ensureDirectoryExists: vi.fn(),
}));

import {
  addTemplate,
  listTemplates,
  removeTemplate,
  addJob,
  listJobs,
  removeJob,
  getJob,
  readTemplateFile,
  readJobFile,
  getTemplateFilesInDirectory,
  getJobFilesInDirectory,
} from '../../../src/lib/files';

describe('lib/files.ts', () => {
  const mockTemplatesPath = '/home/user/Downfolio/Templates';
  const mockJobsPath = '/home/user/Downfolio/Jobs';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addTemplate()', () => {
    const mockTemplate: Template = {
      name: 'base_resume',
      type: 'resume',
      filePath: '',
    };

    it('should add template successfully', () => {
      const filePath = `${mockTemplatesPath}/base_resume.md`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');
      vi.mocked(path.resolve).mockReturnValue(filePath);

      addTemplate(mockTemplate, filePath);

      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should prevent duplicates', () => {
      const filePath = `${mockTemplatesPath}/base_resume.md`;
      const existingTemplates = JSON.stringify([mockTemplate]);
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(existingTemplates);

      expect(() => addTemplate(mockTemplate, filePath)).toThrow(
        'Template "base_resume" of type "resume" already exists'
      );
    });

    it('should validate file exists', () => {
      const filePath = `${mockTemplatesPath}/missing.md`;
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => addTemplate(mockTemplate, filePath)).toThrow(
        'Template file not found'
      );
    });

    it('should store absolute path', () => {
      const filePath = 'relative/path/template.md';
      const absolutePath = '/home/user/Downfolio/Templates/template.md';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');
      vi.mocked(path.resolve).mockReturnValue(absolutePath);

      addTemplate(mockTemplate, filePath);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData[0].filePath).toBe(absolutePath);
    });

    it('should allow templates with same name but different types', () => {
      const resumeTemplate: Template = {
        name: 'base',
        type: 'resume',
        filePath: '',
      };
      const coverLetterTemplate: Template = {
        name: 'base',
        type: 'cover-letter',
        filePath: '',
      };
      
      const existingTemplates = JSON.stringify([resumeTemplate]);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(existingTemplates);
      vi.mocked(path.resolve).mockReturnValue('/path/to/file.md');

      expect(() => addTemplate(coverLetterTemplate, '/path/to/file.md')).not.toThrow();
    });
  });

  describe('listTemplates()', () => {
    it('should return all templates', () => {
      const mockTemplates: Template[] = [
        { name: 'base_resume', type: 'resume', filePath: '/path/1.md' },
        { name: 'base_cover_letter', type: 'cover-letter', filePath: '/path/2.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplates));

      const result = listTemplates();

      expect(result).toEqual(mockTemplates);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if none exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = listTemplates();

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json');

      const result = listTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('removeTemplate()', () => {
    it('should remove template successfully', () => {
      const mockTemplates: Template[] = [
        { name: 'base_resume', type: 'resume', filePath: '/path/1.md' },
        { name: 'other', type: 'resume', filePath: '/path/2.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplates));

      removeTemplate('base_resume', 'resume');

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('other');
    });

    it('should throw if template not found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => removeTemplate('missing', 'resume')).toThrow(
        'Template "missing" of type "resume" not found'
      );
    });

    it('should not delete the actual file', () => {
      const mockTemplates: Template[] = [
        { name: 'base_resume', type: 'resume', filePath: '/path/1.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplates));

      removeTemplate('base_resume', 'resume');

      // Verify that unlinkSync (file deletion) is not called
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should only remove template with matching name and type', () => {
      const mockTemplates: Template[] = [
        { name: 'base', type: 'resume', filePath: '/path/1.md' },
        { name: 'base', type: 'cover-letter', filePath: '/path/2.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplates));

      removeTemplate('base', 'resume');

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].type).toBe('cover-letter');
    });
  });

  describe('getTemplateFilesInDirectory()', () => {
    it('should find .md files in templates directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'resume.md',
        'cover.md',
        'notes.txt',
      ] as any);

      const result = getTemplateFilesInDirectory();

      expect(result).toHaveLength(2);
      expect(result).toContain(`${mockTemplatesPath}/resume.md`);
      expect(result).toContain(`${mockTemplatesPath}/cover.md`);
    });

    it('should return empty array if directory missing', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getTemplateFilesInDirectory();

      expect(result).toEqual([]);
    });

    it('should filter non-markdown files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'template.md',
        'image.png',
        'document.pdf',
        'readme.txt',
      ] as any);

      const result = getTemplateFilesInDirectory();

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('template.md');
    });

    it('should return full paths to files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['test.md'] as any);

      const result = getTemplateFilesInDirectory();

      expect(result[0]).toBe(`${mockTemplatesPath}/test.md`);
    });
  });

  describe('addJob()', () => {
    const mockJob: Job = {
      name: 'senior_engineer',
      filePath: '',
    };

    it('should add job successfully', () => {
      const filePath = `${mockJobsPath}/senior_engineer.md`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');
      vi.mocked(path.resolve).mockReturnValue(filePath);

      addJob(mockJob, filePath);

      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should prevent duplicates', () => {
      const filePath = `${mockJobsPath}/senior_engineer.md`;
      const existingJobs = JSON.stringify([mockJob]);
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(existingJobs);

      expect(() => addJob(mockJob, filePath)).toThrow(
        'Job "senior_engineer" already exists'
      );
    });

    it('should validate file exists', () => {
      const filePath = `${mockJobsPath}/missing.md`;
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => addJob(mockJob, filePath)).toThrow(
        'Job file not found'
      );
    });

    it('should store absolute path', () => {
      const filePath = 'relative/path/job.md';
      const absolutePath = '/home/user/Downfolio/Jobs/job.md';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');
      vi.mocked(path.resolve).mockReturnValue(absolutePath);

      addJob(mockJob, filePath);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData[0].filePath).toBe(absolutePath);
    });
  });

  describe('listJobs()', () => {
    it('should return all jobs', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/1.md' },
        { name: 'junior_dev', filePath: '/path/2.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJobs));

      const result = listJobs();

      expect(result).toEqual(mockJobs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if none exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = listJobs();

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json');

      const result = listJobs();

      expect(result).toEqual([]);
    });
  });

  describe('getJob()', () => {
    it('should return job if found', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/1.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJobs));

      const result = getJob('senior_engineer');

      expect(result).toEqual(mockJobs[0]);
    });

    it('should return undefined if not found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      const result = getJob('missing');

      expect(result).toBeUndefined();
    });
  });

  describe('removeJob()', () => {
    it('should remove job successfully', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/1.md' },
        { name: 'junior_dev', filePath: '/path/2.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJobs));

      removeJob('senior_engineer');

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('junior_dev');
    });

    it('should throw if job not found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => removeJob('missing')).toThrow(
        'Job "missing" not found'
      );
    });

    it('should not delete the actual file', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/1.md' },
      ];
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJobs));

      removeJob('senior_engineer');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getJobFilesInDirectory()', () => {
    it('should find .md files in jobs directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        'senior.md',
        'junior.md',
        'notes.txt',
      ] as any);

      const result = getJobFilesInDirectory();

      expect(result).toHaveLength(2);
      expect(result).toContain(`${mockJobsPath}/senior.md`);
      expect(result).toContain(`${mockJobsPath}/junior.md`);
    });

    it('should return empty array if directory missing', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getJobFilesInDirectory();

      expect(result).toEqual([]);
    });
  });

  describe('readTemplateFile()', () => {
    it('should read template file content', () => {
      const mockTemplates: Template[] = [
        { name: 'base_resume', type: 'resume', filePath: '/path/resume.md' },
      ];
      const fileContent = '# Resume Template';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(JSON.stringify(mockTemplates))
        .mockReturnValueOnce(fileContent);

      const result = readTemplateFile('base_resume', 'resume');

      expect(result).toBe(fileContent);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/resume.md', 'utf-8');
    });

    it('should throw if template not found in registry', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => readTemplateFile('missing', 'resume')).toThrow(
        'Template "missing" of type "resume" not found'
      );
    });

    it('should throw if template file is missing', () => {
      const mockTemplates: Template[] = [
        { name: 'base_resume', type: 'resume', filePath: '/path/resume.md' },
      ];
      
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true)  // storage.json exists
        .mockReturnValueOnce(false); // template file doesn't exist
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTemplates));

      expect(() => readTemplateFile('base_resume', 'resume')).toThrow(
        'Template file not found: /path/resume.md'
      );
    });
  });

  describe('readJobFile()', () => {
    it('should read job file content', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/job.md' },
      ];
      const fileContent = '# Job Description';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(JSON.stringify(mockJobs))
        .mockReturnValueOnce(fileContent);

      const result = readJobFile('senior_engineer');

      expect(result).toBe(fileContent);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/job.md', 'utf-8');
    });

    it('should throw if job not found in registry', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      expect(() => readJobFile('missing')).toThrow(
        'Job "missing" not found'
      );
    });

    it('should throw if job file is missing', () => {
      const mockJobs: Job[] = [
        { name: 'senior_engineer', filePath: '/path/job.md' },
      ];
      
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true)  // storage.json exists
        .mockReturnValueOnce(false); // job file doesn't exist
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJobs));

      expect(() => readJobFile('senior_engineer')).toThrow(
        'Job file not found: /path/job.md'
      );
    });
  });
});
