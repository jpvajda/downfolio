import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { isInitialized, getJobsPath } from '../utils/paths';
import { addJob, listJobs, removeJob, getJobFilesInDirectory } from '../lib/files';
import { Job } from '../types';

interface JobOptions {
  file?: string;
  name?: string;
}

export async function jobCommand(
  action?: string,
  options: JobOptions = {}
): Promise<void> {
  p.intro('Downfolio - Job Management');

  try {
    if (!isInitialized()) {
      p.cancel('Downfolio not initialized. Run "downfolio init" first.');
      process.exit(1);
    }

    // If no action provided, make it interactive
    if (!action) {
      action = (await p.select({
        message: 'What would you like to do?',
        options: [
          { value: 'add', label: 'Add a job' },
          { value: 'list', label: 'List jobs' },
          { value: 'remove', label: 'Remove a job' },
        ],
      })) as string;

      if (p.isCancel(action)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
    }

    switch (action) {
      case 'add':
        await handleAdd(options);
        break;
      case 'list':
        await handleList();
        break;
      case 'remove':
        await handleRemove(options);
        break;
      default:
        p.cancel(`Unknown action: ${action}`);
        process.exit(1);
    }

    p.outro('Job operation completed');
  } catch (error) {
    p.cancel(`Job operation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function handleAdd(options: JobOptions): Promise<void> {
  // Get available job files from Jobs directory
  const availableFiles = getJobFilesInDirectory();

  if (availableFiles.length === 0) {
    p.cancel(`No markdown files found in ${getJobsPath()}. Please create job description files there first.`);
    process.exit(1);
  }

  // Let user pick which file to register
  let filePath: string;
  if (options.file) {
    // If file path provided, validate it's in Jobs directory
    const resolvedPath = path.resolve(options.file);
    const jobsDir = getJobsPath();
    if (!resolvedPath.startsWith(path.resolve(jobsDir))) {
      throw new Error(`Job file must be in ${jobsDir}`);
    }
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    filePath = resolvedPath;
  } else {
    // Show available files for selection
    const fileOptions = availableFiles.map(file => ({
      value: file,
      label: path.basename(file),
    }));

    const selected = await p.select({
      message: 'Which job description file to register?',
      options: fileOptions,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    filePath = selected as string;
  }

  // Get job name
  let name: string;
  if (options.name) {
    name = options.name;
  } else {
    const defaultName = path.basename(filePath, path.extname(filePath));
    const input = await p.text({
      message: 'Job name (for reference)?',
      placeholder: defaultName,
      initialValue: defaultName,
    });

    if (p.isCancel(input)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    name = (input as string) || defaultName;
  }

  const job: Job = {
    name,
    filePath: '', // Will be set by addJob
  };

  addJob(job, filePath);
  p.log.success(`Job "${name}" registered successfully`);
}

async function handleList(): Promise<void> {
  const jobs = listJobs();

  if (jobs.length === 0) {
    p.log.info('No jobs found');
    return;
  }

  p.log.info('Jobs:');
  jobs.forEach((job) => {
    p.log.message(`  • ${job.name}`);
  });
  p.log.message(`\n${jobs.length} job(s) found`);
}

async function handleRemove(options: JobOptions): Promise<void> {
  const jobs = listJobs();

  if (jobs.length === 0) {
    p.log.warn('No jobs found');
    return;
  }

  let jobToRemove: Job;
  if (options.name) {
    jobToRemove = jobs.find((j) => j.name === options.name)!;
    if (!jobToRemove) {
      throw new Error(`Job "${options.name}" not found`);
    }
  } else {
    const optionsList = jobs.map((j) => ({
      value: j,
      label: j.name,
    }));

    const selected = await p.select({
      message: 'Which job to remove?',
      options: optionsList,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    jobToRemove = selected as Job;
  }

  const confirmed = await p.confirm({
    message: `Are you sure you want to remove "${jobToRemove.name}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  removeJob(jobToRemove.name);
  p.log.success(`Job "${jobToRemove.name}" removed successfully`);
}
