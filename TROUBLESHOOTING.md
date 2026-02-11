# Troubleshooting Guide

Common issues and solutions for Downfolio.

## Installation Issues

### Command not found: downfolio

**Problem**: After running `pnpm link`, the `downfolio` command is not available.

**Solutions**:
1. **Restart your terminal** - The PATH may need to be refreshed
2. **Check pnpm setup**:
   ```bash
   pnpm setup
   # Then restart terminal
   ```
3. **Verify link was created**:
   ```bash
   which downfolio
   # Should show path to downfolio executable
   ```
4. **Manual linking**:
   ```bash
   cd /path/to/downfolio
   pnpm run build
   pnpm link --global
   ```

### TypeScript compilation errors

**Problem**: `pnpm run build` fails with TypeScript errors.

**Solutions**:
1. **Clean and rebuild**:
   ```bash
   rm -rf dist node_modules
   pnpm install
   pnpm run build
   ```
2. **Check Node.js version**:
   ```bash
   node --version
   # Should be 18 or higher
   ```
3. **Update TypeScript**:
   ```bash
   pnpm update typescript
   ```

## Document Generation Issues

### Pandoc not found

**Problem**: Error message: `Pandoc not found` or `pandoc: command not found`

**Solution**: Install Pandoc:
```bash
# macOS
brew install pandoc

# Linux (Debian/Ubuntu)
sudo apt-get install pandoc

# Linux (Fedora)
sudo dnf install pandoc

# Windows (using Chocolatey)
choco install pandoc

# Or download from: https://pandoc.org/installing.html
```

### PDF generation fails

**Problem**: DOCX generates fine but PDF fails with errors about missing LaTeX.

**Solution**: Install a PDF engine:

**Option 1: BasicTeX (recommended, ~100MB)**
```bash
# macOS
brew install --cask basictex

# Then restart terminal or run:
eval "$(/usr/libexec/path_helper)"

# Linux - Install TeX Live Basic
sudo apt-get install texlive-latex-base texlive-fonts-recommended
```

**Option 2: MacTeX (full distribution, ~4GB)**
```bash
brew install --cask mactex-no-gui
```

**Option 3: wkhtmltopdf (alternative)**
```bash
# macOS
brew install wkhtmltopdf

# Linux
sudo apt-get install wkhtmltopdf

# Then use --pdf-engine=wkhtmltopdf flag
```

### DOCX/PDF output looks wrong

**Problem**: Generated documents have formatting issues.

**Solutions**:
1. **Check Pandoc version**:
   ```bash
   pandoc --version
   # Should be 2.10 or higher
   ```
2. **Update Pandoc**:
   ```bash
   brew upgrade pandoc  # macOS
   ```
3. **Verify markdown syntax**: Use `downfolio validate` on your template
4. **Test with simple markdown**: Try with minimal template first

## AI Generation Issues

### API key not working

**Problem**: Error about invalid or missing API key.

**Solutions**:
1. **Verify API key format**:
   - OpenAI keys start with `sk-`
   - Anthropic keys start with `sk-ant-`
2. **Check API key is set**:
   ```bash
   downfolio config get OPENAI_API_KEY
   # Or
   downfolio config get ANTHROPIC_API_KEY
   ```
3. **Re-set the API key**:
   ```bash
   downfolio config set OPENAI_API_KEY your-key-here
   ```
4. **Use environment variable** (takes precedence):
   ```bash
   export OPENAI_API_KEY=your-key-here
   downfolio generate --job your-job
   ```
5. **Verify key has correct permissions**:
   - Go to https://platform.openai.com/api-keys
   - Check that "Chat Completions" is enabled

### API rate limit errors

**Problem**: Error message about rate limits or quota exceeded.

**Solutions**:
1. **Wait and retry** - Rate limits reset over time
2. **Check your quota**:
   - OpenAI: https://platform.openai.com/usage
   - Anthropic: https://console.anthropic.com/settings/usage
3. **Add payment method** if on free tier
4. **Use different API key** if available
5. **Switch provider**:
   ```bash
   # Configure Anthropic as alternative
   downfolio config set ANTHROPIC_API_KEY your-key
   ```

### Generated content is not relevant

**Problem**: AI-generated resume/cover letter doesn't match the job well.

**Solutions**:
1. **Improve your base template**:
   - Include more specific details about your experience
   - Use concrete examples and metrics
   - Avoid generic statements
2. **Improve job description**:
   - Include full job posting
   - Include company context
   - Include required skills and qualifications
3. **Regenerate with different prompt**:
   - The AI output varies between runs
   - Try generating 2-3 times and pick the best
4. **Edit the output**: Always review and customize the generated content

## Configuration Issues

### Can't find .downfolio directory

**Problem**: Commands fail with "Configuration not found" or similar.

**Solution**: Initialize the project:
```bash
downfolio init
# This creates ~/Downfolio/ directory structure
```

### Config changes not taking effect

**Problem**: After changing config, behavior doesn't change.

**Solutions**:
1. **Verify config was saved**:
   ```bash
   downfolio config list
   ```
2. **Check for environment variables** (they override config):
   ```bash
   echo $OPENAI_API_KEY
   # If set, it overrides config file
   ```
3. **Restart terminal** if using environment variables

### Lost templates or jobs

**Problem**: Previously added templates or jobs don't show up.

**Solutions**:
1. **Check correct directory**:
   ```bash
   ls ~/Downfolio/Templates
   ls ~/Downfolio/Jobs
   ```
2. **Verify registry files**:
   ```bash
   cat ~/Downfolio/.templates.json
   cat ~/Downfolio/.jobs.json
   ```
3. **Re-add if needed**:
   ```bash
   downfolio template add
   downfolio job add
   ```

## Template Issues

### Markdown validation fails

**Problem**: `downfolio validate` reports errors in template.

**Common Issues**:
1. **Invalid frontmatter**:
   ```markdown
   ---
   name: My Template
   type: resume
   ---
   ```
   Must be valid YAML between `---` delimiters

2. **Unclosed formatting**:
   - Missing closing `*` or `**` for emphasis
   - Unclosed code blocks (\`\`\`)
   - Unclosed links `[text](url)`

3. **Invalid heading structure**:
   ```markdown
   # Main Heading
   ### Subheading (missing level 2)
   ```
   Should progress in order (h1 → h2 → h3)

**Solution**: Use `downfolio validate your-template.md` to identify specific issues.

### Variables not replaced

**Problem**: Template variables like `{{company_name}}` appear in output.

**Solution**: This feature is not yet implemented. Currently, AI customization happens at the content level, not via template variables.

## Performance Issues

### Generation is very slow

**Problem**: `downfolio generate` takes a long time.

**Expected Times**:
- Resume only: 10-30 seconds
- Cover letter only: 10-30 seconds
- Both: 20-60 seconds

**If slower**:
1. **Check internet connection** - API calls require internet
2. **Check API provider status**:
   - OpenAI: https://status.openai.com
   - Anthropic: https://status.anthropic.com
3. **Try different provider**:
   ```bash
   downfolio config set ANTHROPIC_API_KEY your-key
   ```
4. **Check template size** - Very long templates take longer to process

## Permission Issues

### Can't write to ~/Downfolio/

**Problem**: Permission denied when writing to output directory.

**Solutions**:
1. **Check directory permissions**:
   ```bash
   ls -la ~/Downfolio
   ```
2. **Fix permissions**:
   ```bash
   chmod -R u+w ~/Downfolio
   ```
3. **Check disk space**:
   ```bash
   df -h ~
   ```

## Still Having Issues?

1. **Check existing issues**: https://github.com/jpvajda/downfolio/issues
2. **Enable debug mode** (if available):
   ```bash
   DEBUG=* downfolio generate --job your-job
   ```
3. **Create a new issue** with:
   - Downfolio version: `downfolio version`
   - Operating system and version
   - Node.js version: `node --version`
   - Full error message
   - Steps to reproduce
   - What you expected vs what happened

4. **Common debugging steps**:
   ```bash
   # Check version
   downfolio version
   
   # Check configuration
   downfolio config list
   
   # Verify dependencies
   which pandoc
   pandoc --version
   which pdflatex  # If using PDF
   
   # Clean reinstall
   cd /path/to/downfolio
   rm -rf dist node_modules
   pnpm install
   pnpm run build
   pnpm link --global
   ```
