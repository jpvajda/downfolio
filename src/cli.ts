#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

import { Command } from 'commander';
import * as p from '@clack/prompts';
import { showBanner } from './utils/banner';
import { initCommand } from './commands/init';
import { configCommand } from './commands/config';
import { templateCommand } from './commands/template';
import { jobCommand } from './commands/job';
import { generateCommand } from './commands/generate';
import { validateCommand } from './commands/validate';
import { previewCommand } from './commands/preview';

const program = new Command();

// Show banner on startup (but not for --help or --version)
const args = process.argv.slice(2);
if (!args.includes('--help') && !args.includes('-h') && !args.includes('--version') && !args.includes('-V')) {
  showBanner();
}

program
  .name('downfolio')
  .description('AI-powered CLI tool for generating customized resumes and cover letters')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize Downfolio')
  .option('--api-key <key>', 'OpenAI API key')
  .action(async (options) => {
    await initCommand(options);
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .argument('[action]', 'Action: set, get, or list')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Config value')
  .action(async (action, key, value) => {
    await configCommand(action, key, value);
  });

// Template command
program
  .command('template')
  .description('Manage templates')
  .argument('[action]', 'Action: add, list, or remove')
  .option('--type <type>', 'Template type: resume or cover-letter')
  .option('--file <path>', 'Template file path')
  .option('--name <name>', 'Template name')
  .action(async (action, options) => {
    await templateCommand(action, options);
  });

// Job command
program
  .command('job')
  .description('Manage job descriptions')
  .argument('[action]', 'Action: add, list, or remove')
  .option('--file <path>', 'Job description file path')
  .option('--name <name>', 'Job name')
  .action(async (action, options) => {
    await jobCommand(action, options);
  });

// Generate command
program
  .command('generate')
  .description('Generate customized documents')
  .option('--job <name>', 'Job name (if not provided, will prompt interactively)')
  .option('--type <type>', 'Document type: resume, cover-letter, or both')
  .option('--resume-template <name>', 'Resume template name')
  .option('--cover-letter-template <name>', 'Cover letter template name')
  .option('--format <formats...>', 'Output formats: markdown, docx, pdf')
  .option('--output <name>', 'Output name')
  .action(async (options) => {
    await generateCommand(options);
  });

// Validate command
program
  .command('validate')
  .description('Validate markdown file')
  .argument('[file]', 'File to validate')
  .action(async (file) => {
    await validateCommand(file);
  });

// Preview command
program
  .command('preview')
  .description('Preview markdown file')
  .argument('[file]', 'File to preview')
  .action(async (file) => {
    await previewCommand(file);
  });

// Handle errors gracefully
process.on('SIGINT', () => {
  p.cancel('Operation cancelled');
  process.exit(0);
});

// Run CLI
// Exit with code 0 when showing help (no command provided)
if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}
program.parse();
