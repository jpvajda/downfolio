import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { isInitialized, getOutputPath, ensureDirectoryExists } from '../utils/paths';
import { convertToDocx, convertToPdf, isPandocInstalled, PandocFormat } from '../lib/pandoc';

interface ConvertOptions {
  file?: string;
  format?: string[];
  outputDir?: string;
  outputName?: string;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Get relative path from output directory for display
 */
function getRelativePath(fullPath: string, baseDir: string): string {
  const relative = path.relative(baseDir, fullPath);
  return relative || path.basename(fullPath);
}

export async function convertCommand(options: ConvertOptions): Promise<void> {
  p.intro('Downfolio - Convert Document');

  try {
    if (!isInitialized()) {
      p.cancel('Downfolio not initialized. Run "downfolio init" first.');
      process.exit(1);
    }

    // Get input file path
    let inputFilePath: string;
    if (options.file) {
      inputFilePath = options.file;
    } else {
      // List markdown files from output directory
      const outputDir = getOutputPath();
      const markdownFiles = findMarkdownFiles(outputDir);

      if (markdownFiles.length === 0) {
        p.cancel('No markdown files found in output directory. Generate documents first with "downfolio generate"');
        process.exit(1);
      }

      // Create options for select prompt
      const fileOptions = markdownFiles.map((file) => ({
        value: file,
        label: getRelativePath(file, outputDir),
      }));

      const selected = await p.select({
        message: 'Which markdown file to convert?',
        options: fileOptions,
      });

      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      inputFilePath = selected as string;
    }

    // Validate input file exists
    if (!fs.existsSync(inputFilePath)) {
      p.cancel(`File not found: ${inputFilePath}`);
      process.exit(1);
    }

    // Validate it's a markdown file
    if (!inputFilePath.endsWith('.md')) {
      p.cancel('Input file must be a markdown file (.md)');
      process.exit(1);
    }

    // Get output formats
    let formats: PandocFormat[];
    if (options.format && options.format.length > 0) {
      // Validate formats and warn about invalid ones
      const validFormats: PandocFormat[] = [];
      const invalidFormats: string[] = [];

      for (const format of options.format) {
        if (format === 'docx' || format === 'pdf') {
          validFormats.push(format as PandocFormat);
        } else {
          invalidFormats.push(format);
        }
      }

      // Warn about invalid formats that were filtered out
      if (invalidFormats.length > 0) {
        p.log.warn(
          `Invalid format(s) ignored: ${invalidFormats.join(', ')}. Valid formats are "docx" and "pdf".`
        );
      }

      // Error if no valid formats remain
      if (validFormats.length === 0) {
        p.cancel('Invalid format. Must be "docx" and/or "pdf"');
        process.exit(1);
      }
      formats = validFormats;
    } else {
      const selected = await p.multiselect({
        message: 'Output format(s)?',
        options: [
          { value: 'docx', label: 'Word (.docx)' },
          { value: 'pdf', label: 'PDF' },
        ],
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      formats = selected as PandocFormat[];
    }

    // Check if Pandoc is installed
    const pandocInstalled = await isPandocInstalled();
    if (!pandocInstalled) {
      p.cancel(
        'Pandoc is not installed. Please install Pandoc to convert to docx/pdf formats.\n' +
          'Installation: https://pandoc.org/installing.html'
      );
      process.exit(1);
    }

    // Determine output directory
    const outputDir = options.outputDir
      ? path.resolve(options.outputDir)
      : path.dirname(inputFilePath);

    // Create output directory if it doesn't exist
    ensureDirectoryExists(outputDir);

    // Determine output base name
    const inputBaseName = path.basename(inputFilePath, '.md');
    const outputBaseName = options.outputName || inputBaseName;

    // Generate output paths
    const outputPaths: { format: PandocFormat; path: string }[] = [];
    if (formats.includes('docx')) {
      outputPaths.push({
        format: 'docx',
        path: path.join(outputDir, `${outputBaseName}.docx`),
      });
    }
    if (formats.includes('pdf')) {
      outputPaths.push({
        format: 'pdf',
        path: path.join(outputDir, `${outputBaseName}.pdf`),
      });
    }

    // Check for existing files and prompt for confirmation
    const existingFiles = outputPaths.filter((op) => fs.existsSync(op.path));
    if (existingFiles.length > 0) {
      const fileList = existingFiles.map((op) => path.basename(op.path)).join(', ');
      const confirmed = await p.confirm({
        message: `File(s) already exist: ${fileList}. Overwrite?`,
        initialValue: false,
      });

      if (p.isCancel(confirmed)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      if (!confirmed) {
        p.cancel('Conversion cancelled');
        process.exit(0);
      }
    }

    // Perform conversions
    const spinner = p.spinner();
    spinner.start('Converting files...');

    for (const outputPath of outputPaths) {
      spinner.message(`Converting to ${outputPath.format.toUpperCase()}...`);
      if (outputPath.format === 'docx') {
        await convertToDocx(inputFilePath, outputPath.path);
      } else if (outputPath.format === 'pdf') {
        await convertToPdf(inputFilePath, outputPath.path);
      }
    }

    spinner.stop('Conversion complete');

    const createdFiles = outputPaths.map((op) => path.basename(op.path)).join(', ');
    p.outro(`Files created: ${createdFiles} → ${outputDir}/`);
  } catch (error) {
    p.cancel(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
