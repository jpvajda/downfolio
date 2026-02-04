import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export function getConfigPath(): string {
  return path.join(os.homedir(), 'Downfolio');
}

export function getConfigFilePath(): string {
  return path.join(getConfigPath(), 'config.yaml');
}

export function getTemplatesPath(): string {
  return path.join(getConfigPath(), 'Templates');
}

export function getJobsPath(): string {
  return path.join(getConfigPath(), 'Jobs');
}

export function getOutputPath(): string {
  return path.join(getConfigPath(), 'Output');
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function isInitialized(): boolean {
  return fs.existsSync(getConfigPath());
}
