# Downfolio Test Plan

## Overview

This test plan covers manual testing for the Downfolio CLI tool. For unit testing see `/tests`.

### Manual End-to-End Tests

#### 3.1 Complete Workflow Test
**Setup:**
1. [x] Initialize project (`downfolio init`)
2. [x] Add resume template (`downfolio template add`)
3. [x] Add cover letter template (`downfolio template add`)
4. [x] Add job description (`downfolio job add`)

**Generation:**
5. [x] Generate documents (`downfolio generate --job <name>`)
6. [x] Verify output files created
7. [x] Verify markdown output exists
8. [x] Verify docx output exists (if selected)
9. [x] Verify pdf output exists (if selected)

**Convert:**
10. [x] Convert markdown to docx (`downfolio convert <file> --format docx`)
11. [x] Convert markdown to pdf (`downfolio convert <file> --format pdf`)
12. [x] Convert markdown to both formats (`downfolio convert <file> --format docx pdf`)
13. [x] Interactive file selection (run `downfolio convert` without file argument)
14. [x] Verify file list shows markdown files from output directory
15. [x] Verify recursive search finds files in subdirectories
16. [x] Verify overwrite confirmation prompt appears for existing files
17. [x] Verify conversion cancels when overwrite declined
18. [x] Verify custom output directory works (`--output-dir`)
19. [x] Verify custom output name works (`--output-name`)
20. [x] Verify output directory is created if it doesn't exist
21. [x] Verify error when file not found
22. [x] Verify error when file is not markdown (.md)
23. [x] Verify error when Pandoc not installed
24. [x] Verify error when invalid format provided
25. [x] Verify error when no markdown files in output directory

**Cleanup:**
1.  [x] Remove job (`downfolio job remove`)
2.  [x] Remove templates (`downfolio template remove`)
3.  [x] Verify cleanup successful

#### 3.2 Multiple Jobs Workflow
1. [x] Initialize project
2. [x] Add multiple jobs
3. [x] Generate documents for each job
4. [x] Verify separate output folders created
5. [x] Verify no conflicts between outputs

#### 3.3 Global vs Project Config
1. [x] Initialize global config
2. [x] Initialize project config
3. [x] Verify project config takes precedence
4. [x] Verify templates/jobs stored in correct location

### 4. Manual Testing Checklist

#### 4.1 Installation & Setup
- [x] `npm install` completes successfully
- [x] `npm run build` compiles TypeScript
- [x] `npm link` makes command globally available
- [x] `downfolio --version` shows correct version
- [x] `downfolio --help` shows help text

#### 4.2 Interactive Prompts (Clack)
- [x] All prompts display correctly
- [x] Keyboard navigation works (arrow keys, Enter)
- [x] Cancellation (Ctrl+C) works gracefully
- [x] Spinners animate correctly
- [x] Success/error messages display correctly
- [x] Colors and formatting render properly

#### 4.3 Error Handling
- [x] Invalid commands show helpful error messages
- [x] Missing required flags show helpful prompts
- [x] File not found errors are clear
- [x] Permission errors are handled gracefully
- [x] Network errors (for future AI calls) are handled

#### 4.4 File Operations
- [x] Files are created in correct locations
- [x] File permissions are correct
- [x] Directory structure is created correctly
- [x] Config files are readable/writable
- [x] Storage files persist correctly

### 5. Security Tests

- [x] API keys are masked in output
- [x] Config files have appropriate permissions
- [x] No sensitive data in logs
- [x] File paths are validated (no directory traversal)
- [x] Input sanitization for user-provided data

## Test Execution

### Automated Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Manual Tests
1. Follow the manual testing checklist above
2. Test each command in both interactive and non-interactive modes
3. Test error scenarios
4. Test on different platforms if available


