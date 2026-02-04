import * as fs from 'fs';
import * as path from 'path';
import { execa } from 'execa';
import * as p from '@clack/prompts';

export type PandocFormat = 'docx' | 'pdf';

/**
 * Check if Pandoc is installed and available
 */
export async function isPandocInstalled(): Promise<boolean> {
  try {
    await execa('pandoc', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert markdown file to docx format
 */
export async function convertToDocx(
  markdownPath: string,
  outputPath: string
): Promise<void> {
  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file not found: ${markdownPath}`);
  }

  try {
    await execa('pandoc', [
      markdownPath,
      '-o',
      outputPath,
      '--from',
      'markdown',
      '--to',
      'docx',
    ]);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Pandoc conversion to docx failed: ${error.message}`);
    }
    throw new Error('Pandoc conversion to docx failed');
  }
}

/**
 * Convert markdown file to PDF format
 */
export async function convertToPdf(
  markdownPath: string,
  outputPath: string
): Promise<void> {
  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file not found: ${markdownPath}`);
  }

  try {
    // PDF conversion requires a PDF engine (pdflatex, xelatex, or wkhtmltopdf)
    // Try pdflatex first, fall back to xelatex
    await execa('pandoc', [
      markdownPath,
      '-o',
      outputPath,
      '--from',
      'markdown',
      '--to',
      'pdf',
      '--pdf-engine=pdflatex',
    ]);
  } catch (error) {
    // Try xelatex as fallback
    try {
      await execa('pandoc', [
        markdownPath,
        '-o',
        outputPath,
        '--from',
        'markdown',
        '--to',
        'pdf',
        '--pdf-engine=xelatex',
      ]);
    } catch (fallbackError) {
      throw new Error(
        'PDF conversion failed. Please install a PDF engine (pdflatex or xelatex). ' +
        'Alternatively, install wkhtmltopdf and use: pandoc --pdf-engine=wkhtmltopdf'
      );
    }
  }
}

/**
 * Convert markdown content to specified formats
 */
export async function convertMarkdownToFormats(
  markdownContent: string,
  markdownFileName: string,
  outputDir: string,
  formats: PandocFormat[]
): Promise<string[]> {
  const createdFiles: string[] = [];

  // First, write markdown to a temporary file if we need to convert
  const tempMarkdownPath = path.join(outputDir, markdownFileName);
  fs.writeFileSync(tempMarkdownPath, markdownContent, 'utf-8');
  createdFiles.push(tempMarkdownPath);

  // Check if Pandoc is installed
  const pandocInstalled = await isPandocInstalled();
  if (!pandocInstalled && (formats.includes('docx') || formats.includes('pdf'))) {
    throw new Error(
      'Pandoc is not installed. Please install Pandoc to convert to docx/pdf formats.\n' +
      'Installation: https://pandoc.org/installing.html'
    );
  }

  // Convert to docx if requested
  if (formats.includes('docx')) {
    const docxPath = tempMarkdownPath.replace('.md', '.docx');
    await convertToDocx(tempMarkdownPath, docxPath);
    createdFiles.push(docxPath);
  }

  // Convert to pdf if requested
  if (formats.includes('pdf')) {
    const pdfPath = tempMarkdownPath.replace('.md', '.pdf');
    await convertToPdf(tempMarkdownPath, pdfPath);
    createdFiles.push(pdfPath);
  }

  return createdFiles;
}
