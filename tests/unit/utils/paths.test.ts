import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules before importing the module under test
vi.mock('fs');
vi.mock('os');

import {
  getConfigPath,
  getConfigFilePath,
  getTemplatesPath,
  getJobsPath,
  getOutputPath,
  ensureDirectoryExists,
  isInitialized,
} from '../../../src/utils/paths';

describe('utils/paths.ts', () => {
  const mockHomedir = '/home/testuser';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.homedir).mockReturnValue(mockHomedir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfigPath()', () => {
    it('should return correct home directory path', () => {
      const result = getConfigPath();
      expect(result).toBe(path.join(mockHomedir, 'Downfolio'));
      expect(os.homedir).toHaveBeenCalledOnce();
    });

    it('should use os.homedir() to get user home directory', () => {
      getConfigPath();
      expect(os.homedir).toHaveBeenCalled();
    });
  });

  describe('getConfigFilePath()', () => {
    it('should return config.yaml path', () => {
      const result = getConfigFilePath();
      expect(result).toBe(path.join(mockHomedir, 'Downfolio', 'config.yaml'));
    });

    it('should build path from config path', () => {
      const configPath = getConfigPath();
      const configFilePath = getConfigFilePath();
      expect(configFilePath).toContain(configPath);
      expect(configFilePath).toContain('config.yaml');
    });
  });

  describe('getTemplatesPath()', () => {
    it('should return Templates directory path', () => {
      const result = getTemplatesPath();
      expect(result).toBe(path.join(mockHomedir, 'Downfolio', 'Templates'));
    });

    it('should be subdirectory of config path', () => {
      const configPath = getConfigPath();
      const templatesPath = getTemplatesPath();
      expect(templatesPath).toContain(configPath);
      expect(templatesPath).toContain('Templates');
    });
  });

  describe('getJobsPath()', () => {
    it('should return Jobs directory path', () => {
      const result = getJobsPath();
      expect(result).toBe(path.join(mockHomedir, 'Downfolio', 'Jobs'));
    });

    it('should be subdirectory of config path', () => {
      const configPath = getConfigPath();
      const jobsPath = getJobsPath();
      expect(jobsPath).toContain(configPath);
      expect(jobsPath).toContain('Jobs');
    });
  });

  describe('getOutputPath()', () => {
    it('should return Output directory path', () => {
      const result = getOutputPath();
      expect(result).toBe(path.join(mockHomedir, 'Downfolio', 'Output'));
    });

    it('should be subdirectory of config path', () => {
      const configPath = getConfigPath();
      const outputPath = getOutputPath();
      expect(outputPath).toContain(configPath);
      expect(outputPath).toContain('Output');
    });
  });

  describe('ensureDirectoryExists()', () => {
    it('should create directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const dirPath = '/test/path';
      ensureDirectoryExists(dirPath);

      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const dirPath = '/test/path';
      ensureDirectoryExists(dirPath);

      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create nested directories with recursive option', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const dirPath = '/test/nested/path';
      ensureDirectoryExists(dirPath);

      expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should handle multiple calls for same directory', () => {
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      
      const dirPath = '/test/path';
      ensureDirectoryExists(dirPath);
      ensureDirectoryExists(dirPath);

      expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInitialized()', () => {
    it('should return true if config path exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const result = isInitialized();

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(getConfigPath());
    });

    it('should return false if config path does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const result = isInitialized();

      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(getConfigPath());
    });

    it('should check the correct config path', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      isInitialized();

      const expectedPath = path.join(mockHomedir, 'Downfolio');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    });
  });
});
