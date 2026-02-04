import { vi } from 'vitest';
import type { Config, Template, Job } from '../../src/types';

/**
 * Mock file system utilities
 */
export const createMockFs = () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  chmodSync: vi.fn(),
});

/**
 * Mock path utilities
 */
export const createMockPath = () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
  resolve: vi.fn((...args: string[]) => '/' + args.join('/')),
  dirname: vi.fn((p: string) => p.substring(0, p.lastIndexOf('/'))),
});

/**
 * Mock OS utilities
 */
export const createMockOs = () => ({
  homedir: vi.fn(() => '/home/user'),
  platform: vi.fn(() => 'linux'),
});

/**
 * Mock OpenAI client
 */
export const createMockOpenAI = () => {
  const mockCreate = vi.fn();
  
  return {
    mockInstance: {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    },
    mockCreate,
  };
};

/**
 * Mock Anthropic API response
 */
export const createMockAnthropicResponse = (content: string) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    content: [{ text: content }],
  }),
  statusText: 'OK',
});

/**
 * Mock execa (for Pandoc)
 */
export const createMockExeca = () => vi.fn().mockResolvedValue({ stdout: '', stderr: '' });

/**
 * Mock Clack prompts
 */
export const createMockPrompts = () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  isCancel: vi.fn(),
  cancel: vi.fn(),
});

/**
 * Mock fetch for Anthropic API
 */
export const createMockFetch = () => vi.fn();

/**
 * Test fixtures
 */
export const fixtures = {
  config: {
    valid: {
      OPENAI_API_KEY: 'sk-test-key-123',
      OPENAI_MODEL: 'gpt-4o-mini',
    } as Config,
    withAnthropic: {
      ANTHROPIC_API_KEY: 'sk-ant-test-key-456',
      ANTHROPIC_MODEL: 'claude-sonnet-4-5',
    } as Config,
    empty: {} as Config,
  },
  template: {
    resume: {
      name: 'base_resume',
      type: 'resume' as const,
      filePath: '/home/user/Downfolio/Templates/base_resume.md',
    } as Template,
    coverLetter: {
      name: 'base_cover_letter',
      type: 'cover-letter' as const,
      filePath: '/home/user/Downfolio/Templates/base_cover_letter.md',
    } as Template,
  },
  job: {
    seniorEngineer: {
      name: 'senior_engineer',
      filePath: '/home/user/Downfolio/Jobs/senior_engineer.md',
    } as Job,
  },
  markdown: {
    resume: `# John Doe
## Software Engineer

### Experience
- Senior Engineer at Company A`,
    coverLetter: `# Cover Letter

Dear Hiring Manager,

I am excited to apply for this position.`,
    jobDescription: `# Senior Software Engineer

We are looking for a senior software engineer with 5+ years of experience.

Requirements:
- TypeScript
- Node.js
- React`,
  },
  yaml: {
    valid: `OPENAI_API_KEY: sk-test-key-123
OPENAI_MODEL: gpt-4o-mini`,
    invalid: `OPENAI_API_KEY: [unclosed`,
  },
  json: {
    templates: JSON.stringify([
      {
        name: 'base_resume',
        type: 'resume',
        filePath: '/home/user/Downfolio/Templates/base_resume.md',
      },
    ], null, 2),
    jobs: JSON.stringify([
      {
        name: 'senior_engineer',
        filePath: '/home/user/Downfolio/Jobs/senior_engineer.md',
      },
    ], null, 2),
    invalid: '{ invalid json',
  },
};
