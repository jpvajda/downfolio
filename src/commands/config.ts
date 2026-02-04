import * as p from '@clack/prompts';
import { isInitialized } from '../utils/paths';
import { setConfigValue, getConfigValue, getAllConfig } from '../lib/config';

export async function configCommand(
  action?: string,
  key?: string,
  value?: string
): Promise<void> {
  p.intro('Downfolio - Configuration');

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
          { value: 'set', label: 'Set a config value' },
          { value: 'update', label: 'Update a config value' },
          { value: 'get', label: 'Get a config value' },
          { value: 'list', label: 'List all config' },
        ],
      })) as string;

      if (p.isCancel(action)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
    }

    switch (action) {
      case 'set':
        await handleSet(key, value);
        break;
      case 'update':
        await handleUpdate(key, value);
        break;
      case 'get':
        await handleGet(key);
        break;
      case 'list':
        await handleList();
        break;
      default:
        p.cancel(`Unknown action: ${action}`);
        process.exit(1);
    }

    p.outro('Configuration updated');
  } catch (error) {
    p.cancel(`Config operation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function handleSet(key?: string, value?: string): Promise<void> {
  if (!key) {
    key = (await p.text({
      message: 'Config key?',
      placeholder: 'OPENAI_API_KEY or ANTHROPIC_API_KEY',
    })) as string;

    if (p.isCancel(key)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  }

  if (!value) {
    value = (await p.password({
      message: 'Config value?',
      mask: '*',
    })) as string;

    if (p.isCancel(value)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  }

    setConfigValue(key, value);
    p.log.success(`Config "${key}" set successfully`);
}

async function handleUpdate(key?: string, value?: string): Promise<void> {
  if (!key) {
    // Show existing keys for selection
    const config = getAllConfig();
    const keys = Object.keys(config);

    if (keys.length === 0) {
      p.log.warn('No configuration found to update. Use "set" to add a new value.');
      return;
    }

    const selectedKey = await p.select({
      message: 'Which config value to update?',
      options: keys.map(k => ({ value: k, label: k })),
    }) as string;

    if (p.isCancel(selectedKey)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    key = selectedKey;
  }

  // Show current value
  const currentValue = getConfigValue(key);
  if (!currentValue) {
    p.log.warn(`Config "${key}" not found. Use "set" to add a new value.`);
    return;
  }

  p.log.info(`Current value: ${currentValue.replace(/./g, '*')}`);

  if (!value) {
    value = (await p.password({
      message: 'New config value?',
      mask: '*',
    })) as string;

    if (p.isCancel(value)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  }

  setConfigValue(key, value);
  p.log.success(`Config "${key}" updated successfully`);
}

async function handleGet(key?: string): Promise<void> {
  if (!key) {
    key = (await p.text({
      message: 'Config key?',
      placeholder: 'OPENAI_API_KEY',
    })) as string;

    if (p.isCancel(key)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  }

  const value = getConfigValue(key);
  if (value) {
    p.log.info(`${key}: ${value.replace(/./g, '*')}`);
  } else {
    p.log.warn(`Config "${key}" not found`);
  }
}

async function handleList(): Promise<void> {
  const config = getAllConfig();
  const keys = Object.keys(config);

  if (keys.length === 0) {
    p.log.info('No configuration found');
    return;
  }

  p.log.info('Configuration:');
  keys.forEach((key) => {
    const value = config[key];
    const masked = value ? value.replace(/./g, '*') : 'undefined';
    p.log.message(`  ${key}: ${masked}`);
  });
}
