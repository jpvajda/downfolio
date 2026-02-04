# Downfolio Test Plan

## Overview

This test plan covers manual testing for the Downfolio CLI tool. For unit testing see `/tests`.

### Manual End-to-End Tests

#### 3.1 Complete Workflow Test
**Setup:**
1. [x] Initialize project (`downfolio init`)
2. [ ] Add resume template (`downfolio template add`)
3. [ ] Add cover letter template (`downfolio template add`)
4. [ ] Add job description (`downfolio job add`)

**Generation:**
5. [ ] Generate documents (`downfolio generate --job <name>`)
6. [ ] Verify output files created
7. [ ] Verify markdown output exists
8. [ ] Verify docx output exists (if selected)
9. [ ] Verify pdf output exists (if selected)

**Cleanup:**
10. [ ] Remove job (`downfolio job remove`)
11. [ ] Remove templates (`downfolio template remove`)
12. [ ] Verify cleanup successful

#### 3.2 Multiple Jobs Workflow
1. [ ] Initialize project
2. [ ] Add multiple jobs
3. [ ] Generate documents for each job
4. [ ] Verify separate output folders created
5. [ ] Verify no conflicts between outputs

#### 3.3 Global vs Project Config
1. [x] Initialize global config
2. [x] Initialize project config
3. [ ] Verify project config takes precedence
4. [ ] Verify templates/jobs stored in correct location

### 4. Manual Testing Checklist

#### 4.1 Installation & Setup
- [x] `npm install` completes successfully
- [x] `npm run build` compiles TypeScript
- [x] `npm link` makes command globally available
- [x] `downfolio --version` shows correct version
- [x] `downfolio --help` shows help text

#### 4.2 Interactive Prompts (Clack)
- [ ] All prompts display correctly
- [ ] Keyboard navigation works (arrow keys, Enter)
- [ ] Cancellation (Ctrl+C) works gracefully
- [ ] Spinners animate correctly
- [ ] Success/error messages display correctly
- [ ] Colors and formatting render properly

#### 4.3 Error Handling
- [ ] Invalid commands show helpful error messages
- [ ] Missing required flags show helpful prompts
- [ ] File not found errors are clear
- [ ] Permission errors are handled gracefully
- [ ] Network errors (for future AI calls) are handled

#### 4.4 File Operations
- [ ] Files are created in correct locations
- [ ] File permissions are correct
- [ ] Directory structure is created correctly
- [ ] Config files are readable/writable
- [ ] Storage files persist correctly

### 5. Edge Cases

- [ ] Very long file paths
- [ ] Special characters in file names
- [ ] Empty files
- [ ] Very large files (>10MB)
- [ ] Concurrent operations (multiple CLI instances)
- [ ] Missing dependencies (Pandoc, etc.)
- [ ] Corrupted config files
- [ ] Corrupted storage files
- [ ] Disk full scenarios
- [ ] Read-only file system

### 6. Security Tests

- [ ] API keys are masked in output
- [ ] Config files have appropriate permissions
- [ ] No sensitive data in logs
- [ ] File paths are validated (no directory traversal)
- [ ] Input sanitization for user-provided data

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


