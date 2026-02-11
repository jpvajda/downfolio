# Changelog

All notable changes to Downfolio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CONTRIBUTING.md - Comprehensive contributing guidelines
- TROUBLESHOOTING.md - Common issues and solutions guide
- CHANGELOG.md - Version history tracking
- GitHub issue templates (bug report and feature request)
- Pull request template for contributors
- Enhanced README with badges, FAQ, and better structure
- BUILT_FOR_DEV_ANALYSIS.md - Developer experience assessment tracking

### Changed
- README.md now includes table of contents and feature highlights
- Improved documentation structure for better developer onboarding

## [0.1.0] - 2026-02-11

### Added
- Initial release of Downfolio
- CLI commands: init, config, template, job, generate, validate, preview
- AI-powered document customization using OpenAI and Anthropic
- Support for multiple output formats (markdown, DOCX, PDF)
- Interactive prompts using Clack
- Comprehensive test suite with Vitest
- Template and job management system
- Configuration management (project and global)

### Features
- Markdown-based resume and cover letter templates
- AI customization based on job descriptions
- ATS-friendly output generation
- Local-first data storage
- Support for multiple AI providers
- Beautiful CLI with progress indicators
- Document validation and preview

## Release Notes

### [0.1.0] - Initial Release

First public release of Downfolio, an AI-powered CLI tool for generating customized resumes and cover letters.

**Key Features:**
- Markdown-first approach for creating templates
- AI-powered customization for each job application
- Multiple export formats (Markdown, DOCX, PDF)
- Interactive CLI with beautiful prompts
- Local data storage for privacy
- Support for OpenAI (GPT-4) and Anthropic (Claude)

**Requirements:**
- Node.js 18+
- Pandoc (for DOCX/PDF export)
- OpenAI or Anthropic API key

**Getting Started:**
```bash
pnpm install
pnpm run build
pnpm link
downfolio init
```

See README.md for full documentation.

---

[Unreleased]: https://github.com/jpvajda/downfolio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jpvajda/downfolio/releases/tag/v0.1.0
