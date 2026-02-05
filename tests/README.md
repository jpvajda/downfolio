# Downfolio Test Suite

Comprehensive unit tests for the Downfolio CLI application.

## Test Framework

- **Framework**: Vitest 1.6.1 (TypeScript-native, Jest-compatible)
- **Mocking**: Vitest built-in mocking

## Test Structure

```
tests/
├── helpers/
│   ├── mocks.ts           # Reusable mock factories
│   └── test-utils.ts      # Test utilities and helpers
└── unit/
    ├── lib/               # Core library tests
    │   ├── ai.test.ts         (20 tests)
    │   ├── config.test.ts     (28 tests)
    │   ├── files.test.ts      (36 tests)
    │   └── pandoc.test.ts     (19 tests)
    ├── utils/             # Utility function tests
    │   ├── banner.test.ts     (6 tests)
    │   └── paths.test.ts      (17 tests)
    └── commands/          # Command tests
        ├── config.test.ts     (16 tests)
        ├── generate.test.ts   (22 tests)
        ├── init.test.ts       (10 tests)
        ├── job.test.ts        (19 tests)
        ├── preview.test.ts    (12 tests)
        ├── template.test.ts   (20 tests)
        └── validate.test.ts   (10 tests)
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Key Testing Patterns

### 1. Mocking Strategy
Tests use Vitest's `vi.mock()` for module-level mocking:
- File system operations (`fs`)
- Path utilities (`path`, `os`)
- API clients (`openai`, `fetch`)
- CLI prompts (`@clack/prompts`)
- External processes (`execa` for Pandoc)

### 2. Test Fixtures
Pre-defined test data for consistent testing:
- Mock configurations
- Template and job objects
- Markdown content samples
- YAML and JSON test data

**Note**: Test fixtures are defined inline in each test file. The `fixtures` object in `tests/helpers/mocks.ts` is available but not currently used.

### 3. Isolation
All external dependencies are mocked:
- File system (fs)
- API calls (OpenAI, Anthropic)
- CLI prompts (@clack/prompts)
- External processes (Pandoc via execa)

### 4. Helper Utilities (Available but Not Currently Used)
The `tests/helpers/` directory contains utility functions that could be used to reduce duplication:
- `mocks.ts`: Mock factories (`createMockFs`, `createMockOpenAI`, `createMockPrompts`, etc.)
- `test-utils.ts`: Test utilities (`setupTest`, `setupMockFs`, `captureConsole`, etc.)

These helpers are available for future refactoring or new tests, but current tests use direct `vi.mock()` calls for simplicity and clarity.

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

**Note**: The following utilities are available in `tests/helpers/` but are not currently used in tests. They can be imported and used for future refactoring:

### File System State (from `test-utils.ts`)
```typescript
import { createMockFileSystem, setupMockFs } from '../helpers/test-utils';

const state = createMockFileSystem();
state.files.set('/path/to/file.md', 'content');
state.directories.add('/path/to/dir');
setupMockFs(state);
```

### Console Capture (from `test-utils.ts`)
```typescript
import { captureConsole } from '../helpers/test-utils';

const { output, restore } = captureConsole();
// ... run code that logs
expect(output.log).toContain('expected message');
restore();
```

### Mock Factories (from `mocks.ts`)
```typescript
import { createMockOpenAI, fixtures } from '../helpers/mocks';

const { mockInstance, mockCreate } = createMockOpenAI();
mockCreate.mockResolvedValue({ choices: [...] });
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

- [ ] Add integration tests for end-to-end workflows
- [ ] Add snapshot tests for generated documents
- [ ] Add performance benchmarks

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Follow existing test patterns
3. Update this README if needed

## Troubleshooting

### Tests fail with "module not found"
```bash
pnpm install
```

### Tests timing out
- Check for unresolved promises
- Ensure all async operations are awaited
- Mock any long-running operations

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Mocking](https://testing-library.com/docs/guiding-principles/)
