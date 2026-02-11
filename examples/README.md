# Example Templates

This directory contains example templates to help you get started with Downfolio.

## 📁 Files

- **resume_template.md** - Example resume template with standard sections
- **cover_letter_template.md** - Example cover letter template
- **job_description.md** - Example job description format

## 🚀 Quick Start

### 1. Copy Templates to Your Downfolio Directory

After running `downfolio init`, copy these templates to your `~/Downfolio/Templates/` directory:

```bash
# Copy resume template
cp examples/resume_template.md ~/Downfolio/Templates/

# Copy cover letter template
cp examples/cover_letter_template.md ~/Downfolio/Templates/
```

### 2. Customize the Templates

Edit the templates to reflect YOUR actual experience:

```bash
# Edit with your favorite editor
vim ~/Downfolio/Templates/resume_template.md
vim ~/Downfolio/Templates/cover_letter_template.md
```

**Important**: Replace all example content with your real career experience. Don't use AI-generated base templates!

### 3. Register the Templates

```bash
downfolio template add
# Select resume_template.md and choose "Resume"

downfolio template add
# Select cover_letter_template.md and choose "Cover letter"
```

### 4. Add a Job Description

Copy a job description from a job posting:

```bash
# Create job file
echo "Your job description here" > ~/Downfolio/Jobs/company_role.md

# Register it
downfolio job add
```

### 5. Generate Customized Documents

```bash
downfolio generate
```

## 💡 Tips for Creating Your Templates

### Resume Template

- **Be specific**: Include actual metrics, technologies, and accomplishments
- **Use bullet points**: Easier for both humans and AI to parse
- **Include dates**: Show career progression
- **List technologies**: AI can match these to job requirements
- **Quantify achievements**: Numbers make impact clear

### Cover Letter Template

- **Keep it modular**: Separate paragraphs for different aspects (intro, experience, why company, closing)
- **Include examples**: Real project examples the AI can reference
- **Show personality**: Your authentic voice helps AI maintain it
- **Be concise**: 3-4 paragraphs is ideal

### Job Description

- **Include full posting**: More context = better customization
- **Include company info**: Helps tailor the cover letter
- **Include required skills**: AI will emphasize matching skills
- **Include preferred qualifications**: AI will highlight these if you have them

## 📝 Markdown Tips

### Headings

```markdown
# Main Heading (H1)
## Section (H2)
### Subsection (H3)
```

### Lists

```markdown
- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Second item
```

### Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic***
```

### Links

```markdown
[Link text](https://example.com)
Email: [email@example.com](mailto:email@example.com)
```

### Code (for technical resumes)

```markdown
Inline code: `JavaScript`

Code block:
\`\`\`javascript
const example = "code";
\`\`\`
```

## 🔄 Iteration Workflow

1. **Generate documents** for a job
2. **Review output** in `~/Downfolio/Output/<job-name>/`
3. **Edit markdown output** if needed
4. **Regenerate** if you want to try a different AI variation
5. **Convert to final format**: DOCX or PDF

## 🎯 Customization Strategy

The AI customization works best when:

1. **Base template is comprehensive**: Include all your real experience
2. **Job description is detailed**: More info = better matching
3. **You review and edit**: AI is a starting point, not the final product

## 📚 Additional Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [Resume Best Practices](https://www.indeed.com/career-advice/resumes-cover-letters/resume-best-practices)
- [Cover Letter Tips](https://www.indeed.com/career-advice/cover-letter/cover-letter-tips)

## 🤔 Need Help?

- Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues
- See [README.md](../README.md) for full documentation
- Open an issue on GitHub for questions
