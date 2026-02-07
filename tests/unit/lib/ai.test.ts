import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CustomizeOptions } from '../../../src/lib/ai';

// Mock dependencies
vi.mock('../../../src/lib/config', () => ({
  getApiKey: vi.fn(),
  getDefaultModel: vi.fn(),
}));

// Mock OpenAI - Vitest 4.x requires proper class constructor mocking
vi.mock('openai', () => {
  // Create a mockable constructor function
  const MockOpenAI = vi.fn().mockImplementation(function(this: any) {
    // When called with 'new', 'this' will be the new instance
    this.chat = {
      completions: {
        create: vi.fn(),
      },
    };
    return this;
  });

  // Mock error classes - match OpenAI SDK v6 error structure
  // These need to match the exact constructor signature from the SDK
  class MockAPIError extends Error {
    status?: number;
    error?: any;
    headers?: Headers;
    constructor(status: number | undefined, error: any, message: string | undefined, headers: Headers | undefined) {
      super(message || (error?.message || `API Error ${status}`));
      this.status = status;
      this.error = error;
      this.headers = headers;
      this.name = 'APIError';
    }
  }

  class MockAuthenticationError extends MockAPIError {
    constructor(status: number | undefined = 401, error: any = undefined, message: string | undefined = undefined, headers: Headers | undefined = undefined) {
      super(status, error ?? { message: message || 'Unauthorized' }, message || 'Unauthorized', headers ?? new Headers());
      this.name = 'AuthenticationError';
    }
  }

  class MockRateLimitError extends MockAPIError {
    constructor(status: number | undefined = 429, error: any = undefined, message: string | undefined = undefined, headers: Headers | undefined = undefined) {
      super(status, error ?? { message: message || 'Rate limit exceeded' }, message || 'Rate limit exceeded', headers ?? new Headers());
      this.name = 'RateLimitError';
    }
  }

  return {
    default: MockOpenAI,
    APIError: MockAPIError,
    AuthenticationError: MockAuthenticationError,
    RateLimitError: MockRateLimitError,
  };
});

// Mock global fetch
global.fetch = vi.fn();

import { customizeDocument } from '../../../src/lib/ai';
import * as config from '../../../src/lib/config';
import OpenAI, { AuthenticationError, RateLimitError, APIError } from 'openai';

describe('lib/ai.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('customizeDocument()', () => {
    const baseOptions: CustomizeOptions = {
      template: '# Resume Template',
      jobDescription: '# Job Description',
      documentType: 'resume',
    };

    it('should use specified OpenAI provider when API key available', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Resume' } }],
      });

      // Mock the OpenAI constructor to return an instance with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'openai',
      });

      expect(config.getApiKey).toHaveBeenCalledWith('openai');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.content).toBe('# Customized Resume');
    });

    it('should use specified Anthropic provider when API key available', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '# Customized Cover Letter' }],
        }),
      } as any);

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'anthropic',
        documentType: 'cover-letter',
      });

      expect(config.getApiKey).toHaveBeenCalledWith('anthropic');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-sonnet-4-5');
      expect(result.content).toBe('# Customized Cover Letter');
    });

    it('should fallback to OpenAI if available when no provider specified', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'openai') return 'sk-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Resume' } }],
      });

      // Mock the OpenAI constructor to return an instance with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument(baseOptions);

      expect(result.provider).toBe('openai');
    });

    it('should fallback to Anthropic if OpenAI not available', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '# Customized Resume' }],
        }),
      } as any);

      const result = await customizeDocument(baseOptions);

      expect(result.provider).toBe('anthropic');
    });

    it('should throw error if no API key found', async () => {
      vi.mocked(config.getApiKey).mockReturnValue(undefined);

      await expect(customizeDocument(baseOptions)).rejects.toThrow(
        'No API key found'
      );
    });

    it('should use default model if not specified', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Resume' } }],
      });

      // Mock the OpenAI constructor to return an instance with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument(baseOptions);

      expect(result.model).toBe('gpt-4o');
    });

    it('should use custom model if specified', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Resume' } }],
      });

      // Mock the OpenAI constructor to return an instance with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument({
        ...baseOptions,
        model: 'gpt-4-turbo',
      });

      expect(result.model).toBe('gpt-4-turbo');
    });
  });

  describe('customizeWithOpenAI()', () => {
    const baseOptions: CustomizeOptions = {
      template: '# Resume Template',
      jobDescription: '# Job Description',
      documentType: 'resume',
    };

    it('should call OpenAI API correctly', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Resume' } }],
      });

      // Mock the OpenAI constructor to return an instance with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'openai',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
          temperature: 0.7,
          max_tokens: 2000,
        })
      );
      expect(result.content).toBe('# Customized Resume');
    });

    it('should handle API errors with detailed messages', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockRejectedValue(
        new AuthenticationError(401, { message: '401 Unauthorized' }, '401 Unauthorized', new Headers())
      );

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await expect(
        customizeDocument({ ...baseOptions, provider: 'openai' })
      ).rejects.toThrow('API key is invalid');
    });

    it('should handle rate limit errors', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockRejectedValue(
        new RateLimitError(429, { message: '429 rate limit exceeded' }, '429 rate limit exceeded', new Headers())
      );

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await expect(
        customizeDocument({ ...baseOptions, provider: 'openai' })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle model access errors', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o');

      const mockCreate = vi.fn().mockRejectedValue(
        new APIError(403, { message: 'does not have access to this model' }, 'does not have access to this model', new Headers())
      );

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await expect(
        customizeDocument({ ...baseOptions, provider: 'openai' })
      ).rejects.toThrow('API Key Scoping Issue');
    });

    it('should return formatted result', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Customized Content' } }],
      });

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'openai',
      });

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('model');
      expect(result.provider).toBe('openai');
    });

    it('should throw if no content returned', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: {} }],
      });

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await expect(
        customizeDocument({ ...baseOptions, provider: 'openai' })
      ).rejects.toThrow('No content returned from OpenAI API');
    });
  });

  describe('customizeWithAnthropic()', () => {
    const baseOptions: CustomizeOptions = {
      template: '# Cover Letter Template',
      jobDescription: '# Job Description',
      documentType: 'cover-letter',
    };

    it('should call Anthropic API correctly', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '# Customized Cover Letter' }],
        }),
      } as any);

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'anthropic',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
          }),
          body: expect.stringContaining('claude-sonnet-4-5'),
        })
      );
      expect(result.content).toBe('# Customized Cover Letter');
    });

    it('should handle API errors', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      } as any);

      await expect(
        customizeDocument({ ...baseOptions, provider: 'anthropic' })
      ).rejects.toThrow('Anthropic API error');
    });

    it('should return formatted result', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '# Customized Content' }],
        }),
      } as any);

      const result = await customizeDocument({
        ...baseOptions,
        provider: 'anthropic',
      });

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('model');
      expect(result.provider).toBe('anthropic');
    });

    it('should throw if no content returned', async () => {
      vi.mocked(config.getApiKey).mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test-key';
        return undefined;
      });
      vi.mocked(config.getDefaultModel).mockReturnValue('claude-sonnet-4-5');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [],
        }),
      } as any);

      await expect(
        customizeDocument({ ...baseOptions, provider: 'anthropic' })
      ).rejects.toThrow('No content returned from Anthropic API');
    });
  });

  describe('System and User Prompts', () => {
    it('should include resume-specific instructions for resume', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Resume' } }],
      });

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await customizeDocument({
        template: '# Resume',
        jobDescription: '# Job',
        documentType: 'resume',
        provider: 'openai',
      });

      const systemMessage = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemMessage).toContain('resume');
      expect(systemMessage).toContain('ATS');
    });

    it('should include cover letter-specific instructions for cover letter', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Cover Letter' } }],
      });

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      await customizeDocument({
        template: '# Cover Letter',
        jobDescription: '# Job',
        documentType: 'cover-letter',
        provider: 'openai',
      });

      const systemMessage = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemMessage).toContain('cover letter');
    });

    it('should include template and job description in user prompt', async () => {
      vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
      vi.mocked(config.getDefaultModel).mockReturnValue('gpt-4o-mini');

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: '# Resume' } }],
      });

      // Set up the mock so that new OpenAI() returns an object with our mockCreate
      vi.mocked(OpenAI).mockImplementation(function() {
        return {
          chat: {
            completions: { create: mockCreate },
          },
        };
      });

      const template = '# My Resume Template';
      const jobDescription = '# Senior Engineer Position';

      await customizeDocument({
        template,
        jobDescription,
        documentType: 'resume',
        provider: 'openai',
      });

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain(template);
      expect(userMessage).toContain(jobDescription);
    });
  });
});
