import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { isInitialized, getOutputPath } from '../utils/paths';
import { getJob, listJobs, listTemplates, readTemplateFile, readJobFile } from '../lib/files';
import { customizeDocument } from '../lib/ai';
import { convertMarkdownToFormats } from '../lib/pandoc';
import { getApiKey, getDefaultModel } from '../lib/config';
import { DocumentType, OutputFormat, OpenAIModel, AnthropicModel, AIModel } from '../types';

interface GenerateOptions {
  job?: string;
  type?: string;
  resumeTemplate?: string;
  coverLetterTemplate?: string;
  format?: string[];
  output?: string;
  provider?: 'openai' | 'anthropic';
  model?: AIModel;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  p.intro('Downfolio - Generate Documents');

  try {
    if (!isInitialized()) {
      p.cancel('Downfolio not initialized. Run "downfolio init" first.');
      process.exit(1);
    }

    // Get job - interactive if not provided
    let jobName: string;
    if (options.job) {
      jobName = options.job;
    } else {
      const availableJobs = listJobs();
      if (availableJobs.length === 0) {
        p.cancel('No jobs found. Add one with "downfolio job add"');
        process.exit(1);
      }

      const selected = await p.select({
        message: 'Which job?',
        options: availableJobs.map((j) => ({ value: j.name, label: j.name })),
      });

      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      jobName = selected as string;
    }

    const job = getJob(jobName);
    if (!job) {
      p.cancel(`Job "${jobName}" not found. Use "downfolio job list" to see available jobs.`);
      process.exit(1);
    }

    // Determine document type
    let documentType: DocumentType;
    if (options.type) {
      documentType = options.type as DocumentType;
    } else {
      const selected = await p.select({
        message: 'What would you like to generate?',
        options: [
          { value: 'resume', label: 'Resume only' },
          { value: 'both', label: 'Both resume and cover letter' },
          { value: 'cover-letter', label: 'Cover letter only' },
        ],
      });

      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      documentType = selected as DocumentType;
    }

    // Get templates
    const allTemplates = listTemplates();
    let resumeTemplate: string | undefined;
    let coverLetterTemplate: string | undefined;

    if (documentType === 'resume' || documentType === 'both') {
      const resumeTemplates = allTemplates.filter((t) => t.type === 'resume');
      if (resumeTemplates.length === 0) {
        p.cancel('No resume templates found. Add one with "downfolio template add"');
        process.exit(1);
      }

      if (options.resumeTemplate) {
        resumeTemplate = options.resumeTemplate;
      } else {
        const selected = await p.select({
          message: 'Which resume template?',
          options: resumeTemplates.map((t) => ({ value: t.name, label: t.name })),
        });

        if (p.isCancel(selected)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }
        resumeTemplate = selected as string;
      }
    }

    if (documentType === 'cover-letter' || documentType === 'both') {
      const coverLetterTemplates = allTemplates.filter((t) => t.type === 'cover-letter');
      if (coverLetterTemplates.length === 0) {
        p.cancel('No cover letter templates found. Add one with "downfolio template add"');
        process.exit(1);
      }

      if (options.coverLetterTemplate) {
        coverLetterTemplate = options.coverLetterTemplate;
      } else {
        const selected = await p.select({
          message: 'Which cover letter template?',
          options: coverLetterTemplates.map((t) => ({ value: t.name, label: t.name })),
        });

        if (p.isCancel(selected)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }
        coverLetterTemplate = selected as string;
      }
    }

    // Get output formats
    let formats: OutputFormat[];
    if (options.format && options.format.length > 0) {
      formats = options.format as OutputFormat[];
    } else {
      const selected = await p.multiselect({
        message: 'Output format(s)?',
        options: [
          { value: 'markdown', label: 'Markdown' },
          { value: 'docx', label: 'Word (.docx)' },
          { value: 'pdf', label: 'PDF' },
        ],
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      formats = selected as OutputFormat[];
    }

    // Get output name
    let outputName: string;
    if (options.output) {
      outputName = options.output;
    } else {
      const input = await p.text({
        message: 'Output name?',
        placeholder: jobName,
        initialValue: jobName,
      });

      if (p.isCancel(input)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      outputName = (input as string) || jobName;
    }

    // Get provider - check available API keys
    const openaiKey = getApiKey('openai');
    const anthropicKey = getApiKey('anthropic');

    let provider: 'openai' | 'anthropic';
    if (options.provider) {
      provider = options.provider;
      // Validate provider has API key
      if (provider === 'openai' && !openaiKey) {
        p.cancel('OpenAI API key not found. Set OPENAI_API_KEY in config or environment variables.');
        process.exit(1);
      }
      if (provider === 'anthropic' && !anthropicKey) {
        p.cancel('Anthropic API key not found. Set ANTHROPIC_API_KEY in config or environment variables.');
        process.exit(1);
      }
    } else {
      const availableProviders: Array<{ value: 'openai' | 'anthropic'; label: string }> = [];
      if (openaiKey) {
        availableProviders.push({ value: 'openai', label: 'OpenAI' });
      }
      if (anthropicKey) {
        availableProviders.push({ value: 'anthropic', label: 'Anthropic' });
      }

      if (availableProviders.length === 0) {
        p.cancel('No API keys found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in config or environment variables.');
        process.exit(1);
      }

      if (availableProviders.length === 1) {
        provider = availableProviders[0].value;
      } else {
        const selected = await p.select({
          message: 'Which AI provider?',
          options: availableProviders,
        });

        if (p.isCancel(selected)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }
        provider = selected as 'openai' | 'anthropic';
      }
    }

    // Get model based on provider
    let model: AIModel;
    if (options.model) {
      model = options.model;
      // Validate model matches provider
      if (provider === 'openai' && !['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'].includes(model)) {
        p.cancel(`Model "${model}" is not a valid OpenAI model.`);
        process.exit(1);
      }
      if (provider === 'anthropic' && !['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5'].includes(model)) {
        p.cancel(`Model "${model}" is not a valid Anthropic model.`);``
        process.exit(1);
      }
    } else {
      const defaultModel = getDefaultModel(provider);

      if (provider === 'openai') {
        const openAIModels: Array<{ value: OpenAIModel; label: string }> = [
          { value: 'gpt-4o-mini', label: 'gpt-4o-mini (fastest, smallest)' },
          { value: 'gpt-4o', label: 'gpt-4o (balanced, recommended)' },
          { value: 'gpt-4-turbo', label: 'gpt-4-turbo (highest quality)' },
        ];

        const selected = await p.select({
          message: 'Which OpenAI model?',
          options: openAIModels,
          initialValue: defaultModel as OpenAIModel,
        });

        if (p.isCancel(selected)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }
        model = selected as OpenAIModel;
      } else {
        const anthropicModels: Array<{ value: AnthropicModel; label: string }> = [
          { value: 'claude-haiku-4-5', label: 'claude-haiku-4-5 (fastest, smallest)' },
          { value: 'claude-sonnet-4-5', label: 'claude-sonnet-4-5 (balanced)' },
          { value: 'claude-opus-4-5', label: 'claude-opus-4-5 (highest quality)' },
        ];

        const selected = await p.select({
          message: 'Which Anthropic model?',
          options: anthropicModels,
          initialValue: defaultModel as AnthropicModel,
        });

        if (p.isCancel(selected)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }
        model = selected as AnthropicModel;
      }
    }

    // Generate documents
    const spinner = p.spinner();
    spinner.start('Generating documents...');

    // Read job description
    spinner.message('Reading job description...');
    const jobDescription = readJobFile(jobName);

    // Create output directory
    const outputDir = path.join(getOutputPath(), outputName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let resumeContent: string | undefined;
    let coverLetterContent: string | undefined;

    // Generate resume if needed
    if (documentType === 'resume' || documentType === 'both') {
      if (!resumeTemplate) {
        throw new Error('Resume template not selected');
      }

      spinner.message('AI customizing resume...');
      const templateContent = readTemplateFile(resumeTemplate, 'resume');

      const result = await customizeDocument({
        template: templateContent,
        jobDescription,
        documentType: 'resume',
        provider,
        model,
      });

      resumeContent = result.content;

      // Save and convert resume
      const resumeFormats = formats.filter(f => f === 'markdown' || f === 'docx' || f === 'pdf');
      if (resumeFormats.length > 0) {
        const conversionFormats = resumeFormats.filter(f => f !== 'markdown') as ('docx' | 'pdf')[];

        if (conversionFormats.length > 0) {
          spinner.message('Converting resume to Word/PDF...');
        }

        await convertMarkdownToFormats(
          resumeContent,
          'resume.md',
          outputDir,
          conversionFormats
        );
      }
    }

    // Generate cover letter if needed
    if (documentType === 'cover-letter' || documentType === 'both') {
      if (!coverLetterTemplate) {
        throw new Error('Cover letter template not selected');
      }

      spinner.message('AI customizing cover letter...');
      const templateContent = readTemplateFile(coverLetterTemplate, 'cover-letter');

      const result = await customizeDocument({
        template: templateContent,
        jobDescription,
        documentType: 'cover-letter',
        provider,
        model,
      });

      coverLetterContent = result.content;

      // Save and convert cover letter
      const coverLetterFormats = formats.filter(f => f === 'markdown' || f === 'docx' || f === 'pdf');
      if (coverLetterFormats.length > 0) {
        const conversionFormats = coverLetterFormats.filter(f => f !== 'markdown') as ('docx' | 'pdf')[];

        if (conversionFormats.length > 0) {
          spinner.message('Converting cover letter to Word/PDF...');
        }

        await convertMarkdownToFormats(
          coverLetterContent,
          'cover_letter.md',
          outputDir,
          conversionFormats
        );
      }
    }

    spinner.stop('Documents generated');

    p.outro(`Documents ready! → ${outputDir}/`);
  } catch (error) {
    p.cancel(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
