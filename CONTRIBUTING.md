# Contributing to Downfolio

Thank you for your interest in contributing to Downfolio! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/jpvajda/downfolio.git
   cd downfolio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm run build
   ```

4. **Link for local testing**
   ```bash
   pnpm link
   ```

5. **Run tests**
   ```bash
   pnpm test
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, concise code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run all tests
   pnpm test
   
   # Run tests in watch mode during development
   pnpm test:watch
   
   # Manual testing
   pnpm run dev <command>
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Use TypeScript strict mode
- Follow existing formatting (2 spaces, semicolons, single quotes)
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing Guidelines

- Write unit tests for all new functionality
- Aim for high test coverage
- Mock external dependencies (APIs, file system)
- Use descriptive test names: `should [expected behavior] when [condition]`
- See `tests/README.md` for detailed testing guidelines

## Project Structure

```
downfolio/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── commands/           # Command implementations
│   ├── lib/                # Core business logic
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper utilities
├── tests/
│   ├── unit/               # Unit tests
│   └── helpers/            # Test utilities
└── dist/                   # Compiled output (gitignored)
```

## Adding New Commands

1. **Create command file**: `src/commands/your-command.ts`
2. **Implement command logic**: Use Clack prompts for interactivity
3. **Add tests**: `tests/unit/commands/your-command.test.ts`
4. **Register in CLI**: Update `src/cli.ts`
5. **Update documentation**: Add to README.md and AGENTS.md

Example command structure:

```typescript
import { intro, outro, text, spinner } from '@clack/prompts';

export async function yourCommand(options: YourOptions) {
  intro('Your Command');
  
  // Interactive prompts if options not provided
  const name = options.name ?? await text({
    message: 'What is your name?',
    placeholder: 'John Doe',
  });
  
  // Command logic
  const s = spinner();
  s.start('Processing...');
  // ... do work ...
  s.stop('Done!');
  
  outro('Success!');
}
```

## Pull Request Process

1. **Ensure CI passes**
   - All tests pass
   - TypeScript compiles without errors
   - No linting issues

2. **Update documentation**
   - Update README.md if user-facing changes
   - Update AGENTS.md for feature documentation
   - Add/update tests

3. **Describe your changes**
   - Clear PR title
   - Description of what changed and why
   - Link to related issues

4. **Request review**
   - Wait for maintainer review
   - Address feedback
   - Merge when approved

## Reporting Issues

### Bug Reports

Include:
- Downfolio version (`downfolio version`)
- Operating system and version
- Node.js version (`node --version`)
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Example of how it would work
- Any relevant examples from other tools

## Questions?

- Open an issue with the `question` label
- Check existing issues and documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

Thank you for contributing to Downfolio! 🎉
