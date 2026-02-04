# Downfolio Test Suite

Comprehensive unit tests for the Downfolio CLI application.

## Test Framework

- **Framework**: Vitest 1.6.1 (TypeScript-native, Jest-compatible)
- **Coverage**: @vitest/coverage-v8
- **Mocking**: Vitest built-in mocking

## Test Structure

```
tests/
├── helpers/
│   ├── mocks.ts           # Reusable mock factories
│   └── test-utils.ts      # Test utilities and helpers
└── unit/
    ├── lib/               # Core library tests
    │   ├── ai.test.ts         (20 tests, 96% coverage)
    │   ├── config.test.ts     (28 tests, 96% coverage)
    │   ├── files.test.ts      (36 tests, 100% coverage)
    │   └── pandoc.test.ts     (19 tests, 98% coverage)
    ├── utils/             # Utility function tests
    │   ├── banner.test.ts     (6 tests, 100% coverage)
    │   └── paths.test.ts      (17 tests, 100% coverage)
    └── commands/          # Command tests
        ├── init.test.ts       (10 tests, 100% coverage)
        ├── preview.test.ts    (12 tests, 100% coverage)
        └── validate.test.ts   (10 tests, 100% coverage)
```

## Coverage Summary

### Overall Statistics
- **Total Tests**: 158 tests passing
- **Test Execution Time**: <1 second
- **Core Modules Coverage**: 97.72% (lib/) | 100% (utils/)

### Module Breakdown

#### Library Modules (src/lib/) - 97.72% Coverage
- `ai.ts`: 96.32% - AI provider integration (OpenAI, Anthropic)
- `config.ts`: 96.35% - Configuration management and API key handling
- `files.ts`: 100% - Template and job file operations
- `pandoc.ts`: 98.51% - Document format conversion

#### Utility Modules (src/utils/) - 100% Coverage
- `banner.ts`: 100% - CLI banner display
- `paths.ts`: 100% - Path management and directory operations

#### Command Modules (src/commands/) - Partial Coverage
- `init.ts`: 100% - Initialization command
- `preview.ts`: 100% - Document preview command
- `validate.ts`: 100% - Markdown validation command
- Other commands: Not yet tested (config, generate, job, template)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Test Coverage Goals

✅ **Core library modules**: >95% coverage achieved  
✅ **Utility modules**: 100% coverage achieved  
✅ **Fast execution**: <30s total (currently <1s)  
✅ **All tests passing**: 158/158 tests pass  
⚠️ **Overall coverage**: 46% (prioritized core functionality over commands)

## Key Testing Patterns

### 1. Mock Factories (tests/helpers/mocks.ts)
Reusable mock factories for common dependencies:
- File system operations (`createMockFs`)
- Path utilities (`createMockPath`)
- OpenAI client (`createMockOpenAI`)
- Anthropic API (`createMockAnthropicResponse`)
- Clack prompts (`createMockPrompts`)

### 2. Test Fixtures
Pre-defined test data for consistent testing:
- Mock configurations
- Template and job objects
- Markdown content samples
- YAML and JSON test data

### 3. Isolation
All external dependencies are mocked:
- File system (fs)
- API calls (OpenAI, Anthropic)
- CLI prompts (@clack/prompts)
- External processes (Pandoc via execa)

## Test Examples

### Testing File Operations
```typescript
it('should add template successfully', () => {
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readFileSync).mockReturnValue('[]');
  
  addTemplate(mockTemplate, filePath);
  
  expect(fs.writeFileSync).toHaveBeenCalled();
});
```

### Testing AI Integration
```typescript
it('should use OpenAI provider when API key available', async () => {
  vi.mocked(config.getApiKey).mockReturnValue('sk-test-key');
  vi.mocked(OpenAI).mockImplementation(() => mockOpenAIClient);
  
  const result = await customizeDocument(options);
  
  expect(result.provider).toBe('openai');
  expect(result.content).toBeDefined();
});
```

### Testing CLI Commands
```typescript
it('should initialize with API key from options', async () => {
  await initCommand({ apiKey: 'sk-test-key' });
  
  expect(paths.ensureDirectoryExists).toHaveBeenCalledTimes(4);
  expect(config.saveConfig).toHaveBeenCalled();
});
```

## Mock Utilities

### File System State
```typescript
const state = createMockFileSystem();
state.files.set('/path/to/file.md', 'content');
state.directories.add('/path/to/dir');
```

### Console Capture
```typescript
const { output, restore } = captureConsole();
// ... run code that logs
expect(output.log).toContain('expected message');
restore();
```

## CI/CD Integration

Tests are designed to run in CI/CD environments:
- No interactive prompts (all mocked)
- Fast execution (<1 second)
- Deterministic results
- No external dependencies required

## Testing Best Practices

1. **Arrange-Act-Assert**: Clear test structure
2. **One assertion per test**: Focus on single behavior
3. **Descriptive names**: `should [expected behavior] when [condition]`
4. **Mock external dependencies**: Isolate unit under test
5. **Test edge cases**: Empty inputs, errors, cancellations
6. **Clean up**: Restore mocks after each test

## Future Improvements

- [ ] Add tests for remaining commands (config, generate, job, template)
- [ ] Add integration tests for end-to-end workflows
- [ ] Add snapshot tests for generated documents
- [ ] Increase overall coverage to >80%
- [ ] Add performance benchmarks

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Aim for >80% coverage
3. Follow existing test patterns
4. Update this README if needed

## Troubleshooting

### Tests fail with "module not found"
```bash
pnpm install
```

### Coverage reports not generating
```bash
pnpm install @vitest/coverage-v8
```

### Tests timing out
- Check for unresolved promises
- Ensure all async operations are awaited
- Mock any long-running operations

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Mocking](https://testing-library.com/docs/guiding-principles/)
