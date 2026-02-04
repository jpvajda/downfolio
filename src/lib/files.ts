import * as fs from 'fs';
import * as path from 'path';
import { Template, Job } from '../types';
import { getTemplatesPath, getJobsPath, ensureDirectoryExists } from '../utils/paths';

const STORAGE_FILE = 'storage.json';

function getStoragePath(type: 'templates' | 'jobs'): string {
  const basePath = type === 'templates' ? getTemplatesPath() : getJobsPath();
  return path.join(basePath, STORAGE_FILE);
}

function loadStorage<T>(type: 'templates' | 'jobs'): T[] {
  const storagePath = getStoragePath(type);
  const dir = path.dirname(storagePath);

  // Ensure directory exists
  ensureDirectoryExists(dir);

  if (!fs.existsSync(storagePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(storagePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

function saveStorage<T>(type: 'templates' | 'jobs', items: T[]): void {
  const storagePath = getStoragePath(type);
  const dir = path.dirname(storagePath);

  // Ensure directory exists
  ensureDirectoryExists(dir);

  fs.writeFileSync(storagePath, JSON.stringify(items, null, 2), 'utf-8');
}

// Template operations - registers files that already exist in Templates directory
export function addTemplate(template: Template, filePath: string): void {
  const templates = loadStorage<Template>('templates');

  // Check if template with same name already exists
  if (templates.some(t => t.name === template.name && t.type === template.type)) {
    throw new Error(`Template "${template.name}" of type "${template.type}" already exists`);
  }

  // Validate file exists (should already be in Templates directory)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filePath}`);
  }

  // Store reference to the file (no copying - file already exists)
  template.filePath = path.resolve(filePath);
  templates.push(template);
  saveStorage('templates', templates);
}

/**
 * Get all markdown files in the Templates directory
 */
export function getTemplateFilesInDirectory(): string[] {
  const templatesDir = getTemplatesPath();

  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const files = fs.readdirSync(templatesDir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(templatesDir, file));
}

export function listTemplates(): Template[] {
  return loadStorage<Template>('templates');
}

export function removeTemplate(name: string, type: 'resume' | 'cover-letter'): void {
  const templates = loadStorage<Template>('templates');
  const template = templates.find(t => t.name === name && t.type === type);

  if (!template) {
    throw new Error(`Template "${name}" of type "${type}" not found`);
  }

  // Only remove from registry - don't delete the file (user manages files)
  const filtered = templates.filter(t => !(t.name === name && t.type === type));
  saveStorage('templates', filtered);
}

// Job operations - registers files that already exist in Jobs directory
export function addJob(job: Job, filePath: string): void {
  const jobs = loadStorage<Job>('jobs');

  if (jobs.some(j => j.name === job.name)) {
    throw new Error(`Job "${job.name}" already exists`);
  }

  // Validate file exists (should already be in Jobs directory)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Job file not found: ${filePath}`);
  }

  // Store reference to the file (no copying - file already exists)
  job.filePath = path.resolve(filePath);
  jobs.push(job);
  saveStorage('jobs', jobs);
}

/**
 * Get all markdown files in the Jobs directory
 */
export function getJobFilesInDirectory(): string[] {
  const jobsDir = getJobsPath();

  if (!fs.existsSync(jobsDir)) {
    return [];
  }

  const files = fs.readdirSync(jobsDir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(jobsDir, file));
}

export function listJobs(): Job[] {
  return loadStorage<Job>('jobs');
}

export function getJob(name: string): Job | undefined {
  const jobs = listJobs();
  return jobs.find(j => j.name === name);
}

export function removeJob(name: string): void {
  const jobs = loadStorage<Job>('jobs');
  const job = jobs.find(j => j.name === name);

  if (!job) {
    throw new Error(`Job "${name}" not found`);
  }

  // Only remove from registry - don't delete the file (user manages files)
  const filtered = jobs.filter(j => j.name !== name);
  saveStorage('jobs', filtered);
}

/**
 * Read template file content
 */
export function readTemplateFile(templateName: string, templateType: 'resume' | 'cover-letter'): string {
  const templates = listTemplates();
  const template = templates.find(t => t.name === templateName && t.type === templateType);

  if (!template) {
    throw new Error(`Template "${templateName}" of type "${templateType}" not found`);
  }

  if (!fs.existsSync(template.filePath)) {
    throw new Error(`Template file not found: ${template.filePath}`);
  }

  return fs.readFileSync(template.filePath, 'utf-8');
}

/**
 * Read job description file content
 */
export function readJobFile(jobName: string): string {
  const job = getJob(jobName);

  if (!job) {
    throw new Error(`Job "${jobName}" not found`);
  }

  if (!fs.existsSync(job.filePath)) {
    throw new Error(`Job file not found: ${job.filePath}`);
  }

  return fs.readFileSync(job.filePath, 'utf-8');
}
