import * as p from '@clack/prompts';
import * as fs from 'fs';
import matter = require('gray-matter');

export async function validateCommand(file?: string): Promise<void> {
  p.intro('Downfolio - Validate Markdown');

  try {
    let filePath: string;
    if (file) {
      filePath = file;
    } else {
      const input = await p.text({
        message: 'File to validate?',
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

    const spinner = p.spinner();
    spinner.start('Validating markdown...');

    const content = fs.readFileSync(filePath, 'utf-8');

    // Validate frontmatter
    let frontmatterValid = true;
    try {
      matter(content);
    } catch (error) {
      frontmatterValid = false;
    }

    // Basic markdown validation (can be enhanced)
    const hasContent = content.trim().length > 0;
    const hasHeaders = /^#+\s+.+$/m.test(content);

    spinner.stop('Validation complete');

    if (frontmatterValid && hasContent) {
      p.log.success('✓ Syntax valid');
      if (hasHeaders) {
        p.log.success('✓ Structure valid');
      }
      p.log.success('✓ No errors found');
      p.outro('Validation complete!');
    } else {
      p.log.error('Validation failed');
      if (!frontmatterValid) {
        p.log.error('✗ Frontmatter invalid');
      }
      if (!hasContent) {
        p.log.error('✗ File is empty');
      }
      process.exit(1);
    }
  } catch (error) {
    p.cancel(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
