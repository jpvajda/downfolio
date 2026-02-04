# Downfolio

AI-powered CLI tool for generating customized resumes and cover letters from markdown templates.

## Installation

```bash
pnpm install
pnpm run build
pnpm link  # Makes 'downfolio' command available globally when testing
```

## Quick Start

1. **Initialize the project:**
   ```bash
   downfolio init
   ```
   This creates `~/Downfolio/` directory with the following structure:
   ```
   ~/Downfolio/
   ├── config.yaml      # API keys and settings
   ├── Templates/       # Your resume and cover letter templates
   ├── Jobs/            # Job descriptions you're applying to
   └── Output/          # Generated customized documents
   ```

### Creating Templates

Templates are versions of your cover letters or resumes. Use different templates based on your job search needs.

```text
Examples: Engineering_Resume.md, Product_Manager_Cover_Letter,md, VP_of_Marketing_Resume.md, etc
```

1. **Create template files:**
   - Create your resume or cover letter templates as markdown files directly in `~/Downfolio/Templates/`
   - Example: `~/Downfolio/Templates/my_resume_template.md`

2. **Register a template:**
   ```bash
   downfolio template add
   ```
   - Selects from markdown files already in `~/Downfolio/Templates/`
   - Registers it so you can use it for generation
   - Templates are reusable across all job applications

## Creating Jobs

Jobs are specific descriptions about a job you are applying for.  This is usually found at the beginning of a Job post. This metadata is used to customize each output file.

Example:

```text
Role Overview:
- We’re looking for a Senior Product Manager to help build and scale agentic AI systems at ABC Co. In this role, you will work closely with Engineering, Applied AI/ML, Design, and customer-facing teams to ship production-ready agentic capabilities and make them successful in real customer environments.This role emphasizes execution, customer impact, and production rigor, with opportunities to grow into broader platform ownership over time.

What You’ll Do:
- Define and execute product initiatives for agentic AI systems, with a focus on measurable customer and business outcomesOwn significant parts of the agentic system lifecycle, including orchestration, decisioning, evaluation, and iteration.
- Contribute to building a repeatable framework for launching, evaluating, and improving agentic capabilities across customers
- Help define how agentic systems are measured and improved in production, balancing autonomy with safety and reliability
- Partner closely with Engineering, Applied AI/ML, Design, and Solutions teams to ship production-ready systemsWork directly with customers to understand workflows, requirements, and success criteria
- Drive customer-informed prioritization by staying close to live deployments and real usage patternsSupport best practices for agent evaluation, iteration, and safe rolloutRepresent the product in customer conversations, demos, and feedback sessions
```

4. **Create job description files:**
   - Copy/paste job descriptions from job posts into a new markdown files directly in `~/Downfolio/Jobs/`
   - Example: `~/Downfolio/Jobs/netflix_engineer_job.md`

5. **Register a job:**
   ```bash
   downfolio job add
   ```
   - **Interactive prompts**:
     - Select from markdown files already in `~/Downfolio/Jobs/`
     - Registers it so you can use it for generation
     - Jobs are reusable across all job applications

6. **Generate new documents:**
   ```bash
   downfolio generate
   ```
   - **Interactive prompts**:
     - Select which job to use (from registered jobs)
     - Select which template(s) to use (resume and/or cover letter)
     - Choose output formats (markdown, docx, pdf)
   - AI will customize the template(s) based on the job description
   - Customized documents are saved to `~/Downfolio/Output/<output-name>/`

### Best practices

- Review AI-generated content before submitting
- Edit markdown files and regenerate if needed
- Keep outputs organized by company/role
- Version control the markdown files if desired

## Using API Keys

### Open AI

1. Go to https://platform.openai.com/api-keys
2. Create a new API key

**Set minimal permissions!**
- Select "Restricted" and enable only:
- Under Model Capabilities select Chat Completions - Request
- You don't need any other permissions.

### Anthropic
1. Go to https://platform.claude.com/
2. Create a new API key


## Development

```bash
# Build TypeScript
pnpm run build

# Run in development mode
pnpm run dev

# Watch for changes
pnpm run watch
```

## Testing

TBD

## CLI Commands

- `downfolio init` - Initialize project
- `downfolio config` - Manage configuration
- `downfolio template` - Manage templates
- `downfolio job` - Manage job descriptions
- `downfolio generate` - Generate documents
- `downfolio validate` - Validate markdown files
- `downfolio preview` - Preview markdown files

All commands support interactive mode with Clack prompts when flags are omitted.
