export type TemplateType = 'resume' | 'cover-letter';

export type DocumentType = 'resume' | 'cover-letter' | 'both';

export type OutputFormat = 'markdown' | 'docx' | 'pdf';

export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';

export type AnthropicModel = 'claude-sonnet-4-5' | 'claude-haiku-4-5' | 'claude-opus-4-5';

export type AIModel = OpenAIModel | AnthropicModel;

export interface Config {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_MODEL?: OpenAIModel;
  ANTHROPIC_MODEL?: AnthropicModel;
  [key: string]: string | undefined;
}

export interface Template {
  name: string;
  type: TemplateType;
  filePath: string;
}

export interface Job {
  name: string;
  filePath: string;
}

export interface GenerateOptions {
  job?: string;
  type?: DocumentType;
  resumeTemplate?: string;
  coverLetterTemplate?: string;
  formats?: OutputFormat[];
  output?: string;
  provider?: 'openai' | 'anthropic';
  model?: AIModel;
}
