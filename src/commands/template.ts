import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { isInitialized, getTemplatesPath } from '../utils/paths';
import { addTemplate, listTemplates, removeTemplate, getTemplateFilesInDirectory } from '../lib/files';
import { Template, TemplateType } from '../types';

interface TemplateOptions {
  type?: string;
  file?: string;
  name?: string;
}

export async function templateCommand(
  action?: string,
  options: TemplateOptions = {}
): Promise<void> {
  p.intro('Downfolio - Template Management');

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
          { value: 'add', label: 'Add a template' },
          { value: 'list', label: 'List templates' },
          { value: 'remove', label: 'Remove a template' },
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

    p.outro('Template operation completed');
  } catch (error) {
    p.cancel(`Template operation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function handleAdd(options: TemplateOptions): Promise<void> {
  // Get available template files from Templates directory
  const availableFiles = getTemplateFilesInDirectory();

  if (availableFiles.length === 0) {
    p.cancel(`No markdown files found in ${getTemplatesPath()}. Please create template files there first.`);
    process.exit(1);
  }

  // Let user select template type
  let type: TemplateType;
  if (options.type) {
    type = options.type as TemplateType;
  } else {
    const selectedType = await p.select({
      message: 'Template type?',
      options: [
        { value: 'resume', label: 'Resume' },
        { value: 'cover-letter', label: 'Cover letter' },
      ],
    });

    if (p.isCancel(selectedType)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    type = selectedType as TemplateType;
  }

  // Let user pick which file to register
  let filePath: string;
  if (options.file) {
    // If file path provided, validate it's in Templates directory
    const resolvedPath = path.resolve(options.file);
    const templatesDir = getTemplatesPath();
    if (!resolvedPath.startsWith(path.resolve(templatesDir))) {
      throw new Error(`Template file must be in ${templatesDir}`);
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
      message: 'Which template file to register?',
      options: fileOptions,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    filePath = selected as string;
  }

  // Get template name
  let name: string;
  if (options.name) {
    name = options.name;
  } else {
    const defaultName = path.basename(filePath, path.extname(filePath));
    const input = await p.text({
      message: 'Template name (for reference)?',
      placeholder: defaultName,
      initialValue: defaultName,
    });

    if (p.isCancel(input)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    name = (input as string) || defaultName;
  }

  const template: Template = {
    name,
    type,
    filePath: '', // Will be set by addTemplate
  };

  addTemplate(template, filePath);
  p.log.success(`Template "${name}" registered successfully`);
}

async function handleList(): Promise<void> {
  const templates = listTemplates();

  if (templates.length === 0) {
    p.log.info('No templates found');
    return;
  }

  const resumeTemplates = templates.filter((t) => t.type === 'resume');
  const coverLetterTemplates = templates.filter((t) => t.type === 'cover-letter');

  p.log.info('Templates:');
  if (resumeTemplates.length > 0) {
    p.log.message('  Resume Templates:');
    resumeTemplates.forEach((t) => {
      p.log.message(`    • ${t.name}`);
    });
  }
  if (coverLetterTemplates.length > 0) {
    p.log.message('  Cover Letter Templates:');
    coverLetterTemplates.forEach((t) => {
      p.log.message(`    • ${t.name}`);
    });
  }
  p.log.message(`\n${templates.length} template(s) found`);
}

async function handleRemove(options: TemplateOptions): Promise<void> {
  const templates = listTemplates();

  if (templates.length === 0) {
    p.log.warn('No templates found');
    return;
  }

  let templateToRemove: Template;
  if (options.name && options.type) {
    templateToRemove = templates.find(
      (t) => t.name === options.name && t.type === (options.type as TemplateType)
    )!;
    if (!templateToRemove) {
      throw new Error(`Template "${options.name}" of type "${options.type}" not found`);
    }
  } else {
    const optionsList = templates.map((t) => ({
      value: t,
      label: `${t.name} (${t.type === 'resume' ? 'Resume' : 'Cover letter'})`,
    }));

    const selected = await p.select({
      message: 'Which template to remove?',
      options: optionsList,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    templateToRemove = selected as Template;
  }

  const confirmed = await p.confirm({
    message: `Are you sure you want to remove "${templateToRemove.name}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  removeTemplate(templateToRemove.name, templateToRemove.type);
  p.log.success(`Template "${templateToRemove.name}" removed successfully`);
}
