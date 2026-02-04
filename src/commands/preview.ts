import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

export async function previewCommand(file?: string): Promise<void> {
  p.intro('Downfolio - Preview Document');

  try {
    let filePath: string;
    if (file) {
      filePath = file;
    } else {
      const input = await p.text({
        message: 'File to preview?',
        placeholder: 'resume.md',
      });

      if (p.isCancel(input)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      filePath = input as string;
    }

    if (!fs.existsSync(filePath)) {
      p.cancel(`File not found: ${filePath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Convert markdown to HTML and strip HTML tags for terminal preview
    const html = await marked(content);
    const textContent = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    // Display preview in a box
    p.note(textContent.substring(0, 500) + (textContent.length > 500 ? '...' : ''), `Preview: ${fileName}`);

    p.outro('Preview complete');
  } catch (error) {
    p.cancel(`Preview failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
