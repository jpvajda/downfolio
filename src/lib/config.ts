import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { getConfigFilePath, ensureDirectoryExists } from '../utils/paths';
import { Config, OpenAIModel, AnthropicModel } from '../types';

/**
 * Set restrictive file permissions (600 on Unix, owner-only on Windows)
 * This ensures only the file owner can read/write the config file
 */
function setSecureFilePermissions(filePath: string): void {
  try {
    if (os.platform() === 'win32') {
      // On Windows, set file to owner-only access
      // fs.chmodSync works but Windows handles permissions differently
      // The file is already user-specific in the home directory
      fs.chmodSync(filePath, 0o600);
    } else {
      // On Unix/Linux/macOS: chmod 600 (read/write for owner only)
      fs.chmodSync(filePath, 0o600);
    }
  } catch (error) {
    // Non-fatal: log warning but don't fail
    console.warn(`Warning: Could not set secure permissions on ${filePath}: ${error}`);
  }
}

/**
 * Check if config file has secure permissions
 * Returns true if permissions are secure (600 or more restrictive)
 */
function hasSecurePermissions(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return true; // File doesn't exist yet, will be created with secure permissions
  }

  try {
    const stats = fs.statSync(filePath);
    const mode = stats.mode;

    // On Windows, permissions work differently, so we'll be more lenient
    if (os.platform() === 'win32') {
      return true; // Windows file system handles permissions differently
    }

    // On Unix: check if file is readable/writable only by owner (mode 0600)
    // Allow 0400 (read-only) or 0600 (read-write) for owner only
    const ownerOnlyMask = 0o077; // Group and other permissions mask
    const ownerOnly = (mode & ownerOnlyMask) === 0;

    return ownerOnly;
  } catch (error) {
    // If we can't check, assume insecure to be safe
    return false;
  }
}

export function loadConfig(): Config {
  const configPath = getConfigFilePath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  // Warn if config file has insecure permissions
  if (!hasSecurePermissions(configPath)) {
    console.warn(
      `⚠️  Warning: Config file ${configPath} has insecure permissions.\n` +
      `   API keys should be protected. Run: chmod 600 "${configPath}"`
    );
  }

  try {
    const fileContents = fs.readFileSync(configPath, 'utf-8');
    return (yaml.load(fileContents) as Config) || {};
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    return {};
  }
}

export function saveConfig(config: Config): void {
  const configPath = getConfigFilePath();
  const configDir = configPath.substring(0, configPath.lastIndexOf('/'));

  ensureDirectoryExists(configDir);

  try {
    const yamlContent = yaml.dump(config, { indent: 2 });
    fs.writeFileSync(configPath, yamlContent, 'utf-8');

    // Set restrictive permissions after writing (chmod 600)
    // If this fails, warn but don't throw (file was saved successfully)
    try {
      setSecureFilePermissions(configPath);
    } catch (permError) {
      console.warn(
        `Could not set secure permissions on config file: ${permError instanceof Error ? permError.message : String(permError)}`
      );
    }
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

export function setConfigValue(key: string, value: string): void {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

export function getConfigValue(key: string): string | undefined {
  const config = loadConfig();
  return config[key];
}

export function getAllConfig(): Config {
  return loadConfig();
}

export function getApiKey(provider: 'openai' | 'anthropic'): string | undefined {
  // Check environment variables first (takes precedence)
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Check config file
  const config = loadConfig();
  if (provider === 'openai') {
    return config.OPENAI_API_KEY;
  }
  return config.ANTHROPIC_API_KEY;
}

export function getDefaultModel(provider: 'openai' | 'anthropic'): OpenAIModel | AnthropicModel | undefined {
  const config = loadConfig();
  if (provider === 'openai') {
    return config.OPENAI_MODEL;
  }
  return config.ANTHROPIC_MODEL;
}
