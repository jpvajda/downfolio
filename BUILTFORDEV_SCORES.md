# Built For Dev Scores - SixtyFour AI

## Overview

This document tracks the Built For Dev tool analysis for SixtyFour AI sites to help improve developer adoption and experience.

**Built For Dev Tool**: https://app.builtfor.dev/score  
**Project**: SixtyFour Consulting Engagement  
**Goal**: Drive API adoption, improve developer experience, and establish Sixty-Four as the go-to enrichment API

---

## Docs Site Score

**Site**: https://docs.sixtyfour.ai/introduction  
**Score Report**: https://www.builtfor.dev/score/qi507TjgJX  
**Date**: February 11, 2026

### Overall Score: 67/120 (Needs Work)

**One-Line Verdict**: Solid API foundation with good quick start experience, but broken documentation links and limited developer tooling hold it back.

### Score Breakdown

| Category | Score | Assessment |
|----------|-------|------------|
| **Technical Depth** | 6/10 | Decent API coverage but lacks details on rate limits, error codes, versioning strategy, and edge cases |
| **Product Cohesion** | 7/10 | Generally cohesive experience, though some 404 pages suggest incomplete implementation |
| **Developer Tooling** | 3/10 | ⚠️ **Critical**: Limited tooling - no visible SDKs, CLI tools, or language-specific libraries |
| **Learning Resources** | 6/10 | Good tutorial coverage but could benefit from more comprehensive guides and interactive examples |
| **Trust & Social Proof** | 4/10 | ⚠️ Limited social proof - no visible customer testimonials, GitHub stars, or case studies |
| **Integration Context** | 5/10 | Basic integration info present but lacks workflow diagrams and framework guides |
| **Trial Accessibility** | 8/10 | ✅ **Strong**: Very accessible with clear path to getting started |
| **Documentation Quality** | 7/10 | Good structure and navigation, though some key pages return 404s |
| **Technical Credibility** | 6/10 | Solid technical foundation but lacks performance benchmarks and architecture details |
| **Developer Support Quality** | 5/10 | Basic support channels but no visible community forum or Discord |
| **Value Proposition Clarity** | 7/10 | Good clarity on what it does, but differentiation from competitors could be stronger |
| **Developer Recognition Signals** | 8/10 | ✅ **Strong**: Strong developer focus with immediate technical content |

### Evidence Highlights

**Strengths:**
- Multiple API endpoints documented (enrich-company, enrich-lead, find-email, find-phone, qa-agent)
- Webhooks support for async operations
- Clear request/response structure
- Direct link to generate API key with no apparent credit card requirement
- Quick start example that can be run immediately
- Well-structured navigation with search functionality and 'Ask AI' feature
- Starter Notebooks section with 5 different tutorials
- Consistent branding and design throughout

**Weaknesses:**
- No visible SDKs or language-specific libraries
- Limited social proof (no customer testimonials, GitHub stars, or case studies)
- Missing performance benchmarks and architecture details
- No visible community forum or Discord
- Some documentation pages return 404 errors
- Rate limits and pricing not clearly specified
- Missing error codes and edge case documentation

---

## Red Flags & Critical Issues

### 🚨 Red Flag: Broken or outdated docs (-5 points)

**Issue**: Multiple common developer URLs return 404 (docs, documentation, developers, api, reference, guides, getting-started, quickstart, tutorials, pricing, sdk)

**Developer Impact**: Developers cannot access key resources they expect to find. Will likely abandon evaluation due to broken links and incomplete documentation.

**Fix Priority**: **HIGH**

### 🚨 Critical Issue: No visible SDKs or language-specific tooling

**Impact**: Increases integration friction for developers. May choose competitors with better developer tooling.

**Developer Behavior**: Will look for SDK support and may abandon if not found.

**Fix Priority**: **HIGH**

---

## Quick Wins (Prioritized by Impact)

### 1. Fix all 404 documentation pages
- **Effort**: Low
- **Impact**: Eliminates major friction point for developer evaluation
- **Action**: Audit all common documentation URLs and ensure they redirect properly or have content
- **Expected Outcome**: Reduce bounce rate and improve developer confidence

### 2. Add rate limits and pricing information to API docs
- **Effort**: Low
- **Impact**: Helps developers understand usage constraints upfront
- **Action**: Document rate limits per endpoint, pricing tiers, and free tier limits clearly
- **Expected Outcome**: Improve trial-to-paid conversion, reduce support inquiries

### 3. Add basic Python and JavaScript SDK examples
- **Effort**: Medium
- **Impact**: Reduces integration friction for most common languages
- **Action**: Create code snippets for Python and JavaScript showing common API calls
- **Expected Outcome**: Increase trial activations and reduce time-to-first-API-call

---

## Strategic Opportunities

### 1. Developer Tooling (Highest Priority)

**Current Gap**: No SDKs, CLI tools, or package manager distribution

**Developer Impact**: High integration friction compared to competitors

**Recommended Solution**:
- Build and distribute SDKs for Python, JavaScript/TypeScript, and other popular languages
- Publish to npm (JavaScript), pip (Python), etc.
- Create a CLI tool for quick testing and account management
- Add code generation tools for common use cases

**Success Metrics**:
- SDK downloads per week
- Time-to-first-API-call reduction
- Developer NPS improvement

### 2. Social Proof & Trust Building

**Current Gap**: No visible customer testimonials, case studies, or community metrics

**Developer Impact**: Harder to build trust and confidence in the product

**Recommended Solution**:
- Add customer case studies with technical details (architecture, scale, problems solved)
- Display GitHub stars and contributor metrics if available
- Create developer testimonials focusing on DX improvements
- Show integration counts or API call volume (if appropriate)
- Build community presence (Discord, Stack Overflow, Reddit)

**Success Metrics**:
- Conversion rate improvement
- Time spent on site increase
- Reduced evaluation cycle time

### 3. Technical Depth & Credibility

**Current Gap**: Missing performance benchmarks, architecture details, and comprehensive error handling

**Developer Impact**: Developers can't assess if the API meets their technical requirements

**Recommended Solution**:
- Add technical blog posts about architecture decisions and challenges
- Document performance metrics (response times, uptime SLA)
- Create detailed error codes reference with retry strategies
- Publish architecture documentation showing how the enrichment engine works
- Add migration guides from competitors

**Success Metrics**:
- Enterprise evaluation success rate
- Support ticket reduction
- Developer confidence scores

### 4. Enhanced Learning Resources

**Current Gap**: Limited comprehensive guides and interactive examples

**Recommended Solution**:
- Create interactive API playground (similar to Stripe's API explorer)
- Add more real-world use case tutorials
- Create video walkthroughs for common integrations
- Build Postman/Insomnia collection
- Add troubleshooting guides

**Success Metrics**:
- Tutorial completion rate
- Time-to-first-successful-call
- Support ticket reduction for basic questions

---

## What AI Can't Tell You (Requires Manual Testing)

The Built For Dev tool provides static analysis. The following areas require manual testing:

1. **Data Accuracy**: Whether the API actually returns accurate and up-to-date business data as claimed
2. **Rate Limiting**: How the rate limiting works in practice and if it's sufficient for real applications
3. **Performance**: The actual response times and reliability of the enrichment endpoints under load
4. **QA Agent Quality**: How well the 'QA Agent' endpoint performs at evaluating data quality
5. **Webhook Reliability**: Whether the webhook delivery is reliable and handles failures gracefully
6. **Developer Support**: Response times and quality of support when issues arise
7. **Onboarding Experience**: Complete trial-to-production journey from a developer's perspective

---

## Marketing Site Analysis

**Note**: The Linear issue mentions both a "Marketing Site" and "Docs Site" but provides the same URL for both. If there is a separate marketing site (e.g., https://sixtyfour.ai), it should be analyzed separately.

### Action Items:
- [ ] Identify if there's a separate marketing site
- [ ] Run Built For Dev tool on marketing site if it exists
- [ ] Compare scores between marketing and docs sites
- [ ] Ensure consistent messaging and experience across both properties

---

## Next Steps

### Immediate Actions (This Week)
1. Fix all 404 documentation pages
2. Add rate limits and pricing to API docs
3. Audit and fix broken internal links
4. Add basic code examples for Python and JavaScript inline in docs

### Short-Term (This Month)
1. Create basic Python SDK and publish to pip
2. Create basic JavaScript/TypeScript SDK and publish to npm
3. Add customer testimonials and case studies to docs site
4. Create interactive API playground
5. Set up Discord community for developers

### Medium-Term (Next Quarter)
1. Build comprehensive SDK suite (Python, JavaScript, Go, Ruby, Java)
2. Create CLI tool for account management and testing
3. Publish technical blog posts about architecture
4. Add performance benchmarks and SLA documentation
5. Create video tutorial series
6. Build community program (developer advocates, office hours)

### Long-Term (6+ Months)
1. Establish SixtyFour as category leader in enrichment APIs
2. Build robust developer community with active participation
3. Create certification program for integrations
4. Develop extensive template library for common use cases
5. Launch partner ecosystem program

---

## Success Metrics to Track

- **Developer Adoption Score**: Current 67/120, Target: 90+/120
- **Trial Activation Rate**: % of signups that make first API call
- **Time to First API Call**: Minutes from signup to first successful call
- **Documentation 404 Rate**: Current: High, Target: 0%
- **SDK Adoption**: % of API traffic from SDKs vs raw HTTP
- **Developer NPS**: Net Promoter Score from developer users
- **Community Engagement**: Discord members, GitHub stars, forum posts
- **Support Ticket Reduction**: % decrease in basic integration questions

---

## Resources

- **Built For Dev Score**: https://www.builtfor.dev/score/qi507TjgJX
- **SixtyFour Docs**: https://docs.sixtyfour.ai/introduction
- **SixtyFour Dashboard**: https://app.sixtyfour.ai/
- **SixtyFour GitHub**: https://github.com/sixtyfour (mentioned in analysis)
- **Support Email**: team@sixtyfour.ai

---

*Last Updated: February 11, 2026*
*Next Review: TBD (recommend monthly reviews after implementing fixes)*
