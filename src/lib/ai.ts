import OpenAI from 'openai';
import { APIError, AuthenticationError, RateLimitError } from 'openai';
import { getApiKey, getDefaultModel } from './config';
import { OpenAIModel, AnthropicModel } from '../types';

export type AIProvider = 'openai' | 'anthropic';

export interface CustomizeOptions {
  template: string;
  jobDescription: string;
  documentType: 'resume' | 'cover-letter';
  provider?: AIProvider;
  model?: OpenAIModel | AnthropicModel;
}

export interface CustomizeResult {
  content: string;
  provider: AIProvider;
  model: string;
}

/**
 * Customize a resume or cover letter template based on a job description
 */
export async function customizeDocument(options: CustomizeOptions): Promise<CustomizeResult> {
  const provider = options.provider || 'openai';

  // Determine which provider to use based on available API keys
  const openaiKey = getApiKey('openai');
  const anthropicKey = getApiKey('anthropic');

  if (provider === 'openai' && openaiKey) {
    const model = options.model || getDefaultModel('openai') || 'gpt-4o-mini';
    return customizeWithOpenAI(options, openaiKey, model as OpenAIModel);
  } else if (provider === 'anthropic' && anthropicKey) {
    const model = options.model || getDefaultModel('anthropic') || 'claude-sonnet-4-5';
    return customizeWithAnthropic(options, anthropicKey, model as AnthropicModel);
  } else if (openaiKey) {
    // Fallback to OpenAI if available
    const model = options.model || getDefaultModel('openai') || 'gpt-4o-mini';
    return customizeWithOpenAI(options, openaiKey, model as OpenAIModel);
  } else if (anthropicKey) {
    // Fallback to Anthropic if available
    const model = options.model || getDefaultModel('anthropic') || 'claude-sonnet-4-5';
    return customizeWithAnthropic(options, anthropicKey, model as AnthropicModel);
  } else {
    throw new Error('No API key found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in config or environment variables.');
  }
}

/**
 * Customize document using OpenAI API
 */
async function customizeWithOpenAI(
  options: CustomizeOptions,
  apiKey: string,
  model: OpenAIModel
): Promise<CustomizeResult> {
  const openai = new OpenAI({ apiKey });

  const systemPrompt = getSystemPrompt(options.documentType);
  const userPrompt = getUserPrompt(options.template, options.jobDescription, options.documentType);

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }

    // Strip code block markers if AI wrapped the response in ```
    content = stripCodeBlockMarkers(content);

    return {
      content,
      provider: 'openai',
      model,
    };
  } catch (error) {
    // Use OpenAI SDK v6 specific error types for better error handling
    if (error instanceof AuthenticationError) {
      throw new Error(
        `OpenAI API authentication error: ${error.message}\n\n` +
        `This usually means your API key is invalid or expired. Please check your OPENAI_API_KEY.`
      );
    }

    if (error instanceof RateLimitError) {
      throw new Error(
        `OpenAI API rate limit error: ${error.message}\n\n` +
        `Rate limit exceeded. Please wait a moment and try again.`
      );
    }

    if (error instanceof APIError) {
      let errorMessage = `OpenAI API error: ${error.message}`;

      // Check for specific error scenarios
      if (error.status === 401) {
        errorMessage += '\n\nThis usually means your API key is invalid or expired. Please check your OPENAI_API_KEY.';
      } else if (error.status === 429) {
        errorMessage += '\n\nRate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('does not have access') || error.message.includes('does not exist or you do not have access')) {
        errorMessage += `\n\n⚠️  API Key Scoping Issue: Your API key doesn't have access to the model "${model}".\n\n` +
          `This usually happens when:\n` +
          `1. Your API key has restricted permissions (not "All" permissions)\n` +
          `2. Your account doesn't have access to GPT-4o models yet\n` +
          `3. The API key belongs to a different organization\n\n` +
          `Solutions:\n` +
          `- Check your API key permissions at https://platform.openai.com/api-keys\n` +
          `- Ensure your key has "All" permissions or "Write" access to models endpoint\n` +
          `- Generate a new API key with full permissions`;
      } else if (error.message.includes('model')) {
        errorMessage += '\n\nThe model name may be invalid. Available models: gpt-4o-mini, gpt-4o, gpt-4-turbo';
      }

      throw new Error(errorMessage);
    }

    // Fallback for non-OpenAI errors
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Customize document using Anthropic API
 */
async function customizeWithAnthropic(
  options: CustomizeOptions,
  apiKey: string,
  model: AnthropicModel
): Promise<CustomizeResult> {
  // Note: Anthropic SDK would be imported here when available
  // For now, we'll use fetch API as Anthropic SDK might not be in dependencies

  const systemPrompt = getSystemPrompt(options.documentType);
  const userPrompt = getUserPrompt(options.template, options.jobDescription, options.documentType);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } })) as { error?: { message?: string } };
      throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as { content?: Array<{ text?: string }> };
    let content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content returned from Anthropic API');
    }

    // Strip code block markers if AI wrapped the response in ```
    content = stripCodeBlockMarkers(content);

    return {
      content,
      provider: 'anthropic',
      model,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Strip code block markers (```) from AI response if present
 * Note: OpenAI models tend to wrap markdown responses in code blocks more often than Anthropic,
 * but we strip them from both providers as a defensive measure.
 */
function stripCodeBlockMarkers(content: string): string {
  // Remove leading ```markdown or ``` if present
  content = content.replace(/^```(?:markdown)?\s*\n?/i, '');
  // Remove trailing ``` if present
  content = content.replace(/\n?```\s*$/i, '');
  return content.trim();
}

/**
 * Get system prompt based on document type
 */
function getSystemPrompt(documentType: 'resume' | 'cover-letter'): string {
  if (documentType === 'resume') {
    return `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization and keyword matching.
Your task is to customize resume templates to match specific job descriptions while maintaining authenticity and accuracy.

Guidelines:
- Match keywords from the job description naturally throughout the resume
- Optimize for ATS systems by using standard section headers and formatting
- Highlight relevant skills and experiences that align with the job requirements
- Maintain truthful representation of the candidate's background
- Use action verbs and quantifiable achievements where possible
- Keep the same structure and sections as the template
- Return ONLY the customized markdown content, no explanations or meta-commentary
- Do NOT wrap the response in code blocks (no triple backticks)
- Return raw markdown text only`;
  } else {
    return `You are an expert cover letter writer specializing in personalized, compelling cover letters that connect candidate experiences to specific job opportunities.

Guidelines:
- Address the specific company and role mentioned in the job description
- Connect the candidate's background to the job requirements naturally
- Show genuine interest and research about the company/role
- Use a professional but personable tone
- Highlight 2-3 key experiences or skills that directly relate to the job
- Keep the same structure and style as the template
- Return ONLY the customized markdown content, no explanations or meta-commentary
- Do NOT wrap the response in code blocks (no triple backticks)
- Return raw markdown text only`;
  }
}

/**
 * Get user prompt with template and job description
 */
function getUserPrompt(
  template: string,
  jobDescription: string,
  documentType: 'resume' | 'cover-letter'
): string {
  if (documentType === 'resume') {
    return `Please customize the following resume template to match the job description provided.

Job Description:
${jobDescription}

Resume Template:
${template}

Instructions:
1. Analyze the job description for key requirements, skills, and keywords
2. Customize the resume template to emphasize relevant experiences and skills
3. Match keywords naturally throughout the resume
4. Optimize for ATS systems
5. Maintain the markdown format and structure
6. Return the complete customized resume in markdown format`;
  } else {
    return `Please customize the following cover letter template to match the job description provided.

Job Description:
${jobDescription}

Cover Letter Template:
${template}

Instructions:
1. Extract the company name and role from the job description
2. Customize the cover letter to address this specific opportunity
3. Connect the candidate's background to the job requirements
4. Show genuine interest and understanding of the role
5. Maintain the markdown format and structure
6. Return the complete customized cover letter in markdown format`;
  }
}
