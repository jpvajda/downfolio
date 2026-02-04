---
name: Downfolio
overview: Build an open-source TypeScript CLI that automates resume and cover letter creation from local markdown files with AI customization. Personal use first, then open source with donation model.
todos: []
isProject: false
---

# Downfolio


## Overview

An open-source command-line tool that automates resume and cover letter creation using AI-powered template customization.

**Positioning**: Use AI to generate custom resume & cover letters from Markdown for any job.


## Core Features & Commands

### 1. Initialize & Configuration

```bash
# Interactive mode (recommended) - Clack prompts guide you through setup
downfolio init

# Non-interactive mode - specify options via flags
downfolio init --project --api-key sk-...
```

**Interactive Flow**:
``` bash
┌  Downfolio - Initialize Project
│
◆  Configuration scope?
│  ○ Project (current directory)
│  ● Global (~/.downfolio)
│
◆  OpenAI API Key?
│  sk-... (paste or press Enter to skip)
│
◆  Anthropic API Key? (optional)
│  sk-... (paste or press Enter to skip)
│
✓ Creating directory structure...
✓ Generating config.yaml...
│
└  Project initialized! → .downfolio/
```

```bash
# Config management - interactive prompts when flags omitted
downfolio config set OPENAI_API_KEY sk-...  # Non-interactive
downfolio config set                        # Interactive: prompts for key and value
downfolio config get OPENAI_API_KEY         # Get specific key
downfolio config list                       # List all config
```

**Interactive Config Flow**:
``` bash
┌  Downfolio - Configuration
│
◆  What would you like to do?
│  ○ Set a config value
│  ○ Get a config value
│  ● List all config
│
◆  Config key?
│  OPENAI_API_KEY
│
◆  Config value?
│  sk-... (masked)
│
✓ Config updated!
│
└  Configuration saved
```

- Creates `.downfolio/` directory in current folder
- Generates `config.yaml` for API keys and preferences
- Creates folder structure: `templates/`, `job_descriptions/`, `output/`
- Supports per-project or global configuration
- **Interactive prompts via Clack** guide setup and config management
- Environment variable support (takes precedence over config file)
- Supports any model provider (Anthropic, OpenAI, Grok)

### 2. Template Management

```bash
# Interactive mode (recommended) - Clack prompts guide you
downfolio template add
downfolio template list
downfolio template remove

# Non-interactive mode - specify all options via flags
downfolio template add resume base_resume.md --name base_resume
downfolio template add cover-letter base_cover_letter.md --name base_cover_letter
downfolio template remove --name base_resume
```

**Interactive Template Add Flow**:
``` bash
┌  Downfolio - Add Template
│
◆  Template type?
│  ○ Resume
│  ● Cover letter
│
◆  Template file path?
│  base_cover_letter.md
│
◆  Template name?
│  base_cover_letter (default from filename)
│
✓ Template added!
│
└  Template saved: base_cover_letter
```

**Interactive Template List Flow**:
``` bash
┌  Downfolio - Templates
│
│  Resume Templates:
│  ● base_resume
│  ○ technical_resume
│
│  Cover Letter Templates:
│  ● base_cover_letter
│  ○ impact
│
└  x templates found
```

**Interactive Template Remove Flow**:
```bash
┌  Downfolio - Remove Template
│
◆  Which template to remove?
│  ○ base_resume (Resume)
│  ○ base_cover_letter (Cover letter)
│
◆  Are you sure?
│  ● Yes
│  ○ No
│
✓ Template removed!
│
└  Template deleted
```

- Store base resume and cover letter templates locally
- Support multiple cover letter templates
- Templates are standard markdown files with optional variables
- **Interactive prompts via Clack** guide template management
- Easy to add, list, and remove templates

### 3. Job Management

```bash
# Interactive mode (recommended) - Clack prompts guide you
downfolio job add
downfolio job list
downfolio job remove

# Non-interactive mode - specify all options via flags
downfolio job add senior_engineer.md --name senior_engineering
downfolio job remove --name senior_engineering
```

**Interactive Job Add Flow**:
``` bash
┌  Downfolio - Add Job
│
◆  Job file path?
│  senior_engineer.md
│
◆  Job name (for reference)?
│  senior_engineering (default from filename)
│
✓ Reading job description...
✓ Job added!
│
└  Job saved: senior_engineering
```

**Interactive Job List Flow**:
``` bash
┌  Downfolio - Job List
│
│  - senior_engineering
│  - netflix_dx
│  - figma_product
│
└
```


**Interactive Job Remove Flow**:
``` bash
┌  Downfolio - Remove Job
│
◆  Which job to remove?
│  ○ senior_engineering
│  ● netflix_dx
│  ○ figma_product
│
◆  Are you sure?
│  ● Yes
│  ○ No
│
✓ Job removed!
│
└  Job 'netflix_dx' deleted
```

- Store job descriptions locally
- Supports multiple jobs
- **Interactive prompts via Clack** guide job management
- Easy to add, list, and remove jobs


### 4. AI-Powered Generation

```bash
# Interactive mode (recommended) - Clack prompts guide you through options
downfolio generate --job senior_engineering

# Non-interactive mode - specify all options via flags
downfolio generate --job senior_engineering --type resume --template base_resume --format docx --output resume_1
downfolio generate --job senior_engineering --type cover-letter --template base_cover_letter --format docx --output cover_letter_1
```

**Interactive Flow**:
``` bash
┌  Downfolio - Generate Documents
│
◆  What would you like to generate?
│  ○ Resume only
│  ● Both resume and cover letter
│  ○ Cover letter only
│
◆  Which resume template?
│  ● base_resume
│  ○ technical_resume
│
◆  Which cover letter template?
│  ● base_cover_letter
│  ○ dx
│  ○ impact
│
◆  Output format(s)?
│  ◼ markdown
│  ◼ docx
│  ◼ pdf
│
◆  Output name?
│  senior_engineering (default)
│
●  Generating documents...
│  ✓ AI customizing resume...
│  ✓ AI customizing cover letter...
│  ✓ Generating Word documents...
│  ✓ Generating PDFs...
│
└  Documents ready! → output/senior_engineering/
```

- AI customizes resume and cover letter based on job description
- Keyword matching and ATS optimization
- **Interactive prompts via Clack** guide you through all options (type, template, format, output name)
- **Optional flags** skip prompts for non-interactive/scripted use
- Generates both resume and cover letter
- Outputs to Word (.docx) and PDF formats via Pandoc
- Saves customized markdown for version control

### 5. Utility Commands

```bash
# Interactive mode - prompts for file selection
downfolio validate
downfolio preview

# Non-interactive mode - specify file directly
downfolio validate resume.md         # Validate markdown format
downfolio preview resume.md          # Preview in terminal
downfolio version                    # Show version
downfolio help                       # Show help
```

**Interactive Validate Flow**:
```bash
┌  Downfolio - Validate Markdown
│
◆  File to validate?
│  resume.md (type path or select from list)
│
✓ Validating markdown...
│  ✓ Syntax valid
│  ✓ Frontmatter valid
│  ✓ No errors found
│
└  Validation complete!
```

**Interactive Preview Flow**:
``` bash
┌  Downfolio - Preview Document
│
◆  File to preview?
│  resume.md (type path or select from list)
│
┌  Preview: resume.md ────────────────╮
│                                     │
│  # John Doe                         │
│  Senior Software Engineer           │
│                                     │
│  ## Experience                      │
│  ...                                │
│                                     │
└─────────────────────────────────────┘
```

- Validate markdown files before generation
- Preview documents in terminal with formatted output
- **Interactive prompts via Clack** for file selection when path omitted
- Easy access to help and version info


## Technical Architecture

### CLI Framework

**Language**: TypeScript (Node.js)
- **Why TypeScript**:
  - Beautiful CLI tools ecosystem (Clack, OpenTUI)
  - Excellent OpenAI SDK
  - Type safety and great DX
  - Easy npm distribution
  - Large contributor base
  - Future-proof for potential web companion

**CLI Framework**: **Clack** (@clack/prompts)
- Modern, beautiful interactive prompts
- 7.3k GitHub stars, 2.67M weekly npm downloads
- Built by the Astro team
- Provides:
  - Beautiful intro/outro messages
  - Interactive text, select, confirm, multi-select prompts
  - Progress bars and spinners
  - Cancellation handling
  - Consistent, modern UI

**Key Dependencies**:
- `@clack/prompts` - Beautiful CLI prompts
- `commander` - Command-line argument parsing
- `openai` - AI integration (official TypeScript SDK)
- `js-yaml` - Config file handling
- `gray-matter` - Parse markdown frontmatter
- `marked` - Markdown parsing
- `picocolors` or `chalk` - Terminal colors (if needed beyond Clack)
- `ora` - Loading spinners
- `execa` - Execute Pandoc commands
- `dotenv` - Environment variable management