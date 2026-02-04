import * as p from '@clack/prompts';
import {
  getConfigPath,
  ensureDirectoryExists,
  getTemplatesPath,
  getJobsPath,
  getOutputPath,
} from '../utils/paths';
import { loadConfig, saveConfig } from '../lib/config';
import { Config } from '../types';

interface InitOptions {
  apiKey?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  p.intro('Downfolio - Initialize');

  try {
    // Get API keys
    let openaiKey: string | symbol | undefined;
    if (options.apiKey) {
      openaiKey = options.apiKey;
    } else {
      openaiKey = await p.text({
        message: 'OpenAI API Key?',
        placeholder: 'sk-... (press Enter to skip)',
        initialValue: '',
      });
    }

    let anthropicKey: string | symbol | undefined;
    if (!p.isCancel(openaiKey) && openaiKey) {
      anthropicKey = await p.text({
        message: 'Anthropic API Key? (optional)',
        placeholder: 'sk-... (press Enter to skip)',
        initialValue: '',
      });
    }

    // Create directory structure
    const spinner = p.spinner();
    spinner.start('Creating directory structure...');

    const basePath = getConfigPath();
    ensureDirectoryExists(basePath);
    ensureDirectoryExists(getTemplatesPath());
    ensureDirectoryExists(getJobsPath());
    ensureDirectoryExists(getOutputPath());

    spinner.stop('Directory structure created');

    // Load existing config and merge with new values
    spinner.start('Updating configuration...');
    const existingConfig = loadConfig();
    const config: Config = { ...existingConfig };

    // Only update API keys if provided (preserve existing if skipped)
    if (!p.isCancel(openaiKey) && openaiKey) {
      config.OPENAI_API_KEY = openaiKey as string;
    }
    if (!p.isCancel(anthropicKey) && anthropicKey) {
      config.ANTHROPIC_API_KEY = anthropicKey as string;
    }

    // Save config (will set secure permissions automatically)
    saveConfig(config);
    spinner.stop('Configuration updated');

    p.outro(`Downfolio initialized! → ${basePath}/`);
  } catch (error) {
    p.cancel(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
