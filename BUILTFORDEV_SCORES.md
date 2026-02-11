# Built For Dev Score Report - SixtyFour AI

**Analysis Date**: February 11, 2026  
**Report Links**:
- Marketing Site: https://www.builtfor.dev/score/scyKTNhnh-
- Docs Site: https://www.builtfor.dev/score/qi507TjgJX

---

## Executive Summary

SixtyFour AI has **two separate digital properties** with distinct developer experience scores:

| Property | URL | Score | Classification | Previous Score |
|----------|-----|-------|----------------|----------------|
| **Marketing Site** | sixtyfour.ai | **57/120** | Needs Work | -8 (+65 improvement) |
| **Docs Site** | docs.sixtyfour.ai | **67/120** | Needs Work | N/A |

### Key Insight
The **docs site scores higher (67/120)** than the marketing site (57/120), indicating that while the technical documentation is solid, the marketing site fails to communicate that this is a developer-first product. This creates a **broken funnel** where developers may bounce from the homepage before discovering the well-documented API.

---

## Marketing Site Analysis (sixtyfour.ai)

### Overall Score: 57/120 - "Needs Work"

**One-Line Verdict**: *"Solid API with good documentation but positioned as a business tool rather than a developer product, lacking essential developer tooling and clear trial access."*

### Score Breakdown

| Category | Score | Status | Key Issue |
|----------|-------|--------|-----------|
| **Documentation Quality** | 8/10 | ✅ Good | Well-structured docs |
| **Technical Credibility** | 7/10 | ✅ Good | Working API examples |
| **Technical Depth** | 7/10 | ✅ Good | Comprehensive endpoints |
| **Product Cohesion** | 6/10 | ⚠️ Fair | Marketing disconnected from dev experience |
| **Value Proposition Clarity** | 6/10 | ⚠️ Fair | Not developer-specific |
| **Trial Accessibility** | 6/10 | ⚠️ Fair | Unclear pricing/limits |
| **Learning Resources** | 5/10 | ⚠️ Fair | Basic tutorials only |
| **Trust & Social Proof** | 5/10 | ⚠️ Fair | Limited community metrics |
| **Integration Context** | 4/10 | ⚠️ Fair | No architecture guidance |
| **Developer Support Quality** | 4/10 | ⚠️ Fair | Email only, no community |
| **Developer Tooling** | 3/10 | 🔴 Poor | No SDKs or CLI |
| **Developer Recognition Signals** | 3/10 | 🔴 Poor | Positioned as B2B SaaS |

**Total Base Score**: 64/120  
**Deductions**: -7 points  
**Final Score**: 57/120

### Red Flags (-7 points total)

1. **No code examples on homepage** (-5 points)
   - **Developer thinking**: *"Homepage is purely marketing-focused with no indication this is a developer product until you dig into docs"*
   - **Impact**: Developers bounce without exploring API capabilities

2. **Confusing pricing page** (-2 points)
   - **Developer thinking**: *"Only 'Talk to Sales' option makes it unclear what API usage will cost, creating friction for developers"*
   - **Impact**: Prevents developers from starting integration

### Critical Issues

#### 1. Developer-First Positioning Missing
- **Impact**: Developers may not recognize this as a tool for them
- **Developer Behavior**: Will likely bounce from homepage without exploring the API capabilities
- **Evidence**:
  - Homepage uses generic business language like "AI Recruiters" and "intelligence agents"
  - Primary CTA is "Deploy Now" but leads to app, not developer-focused onboarding
  - No code examples or technical language on homepage
  - Positioned as business solution rather than developer tool

#### 2. No SDK or Language-Specific Tooling
- **Impact**: Higher integration friction
- **Developer Behavior**: Developers expect SDKs for production use; REST-only increases implementation time
- **Evidence**:
  - Only REST API available
  - cURL examples provided but no language-specific SDKs
  - No CLI tools referenced
  - No package manager distributions mentioned

#### 3. Unclear Pricing and Trial Limitations
- **Impact**: Prevents developers from starting
- **Developer Behavior**: Won't begin integration without understanding costs and limits
- **Evidence**:
  - API key generation available at app.sixtyfour.ai/keys
  - Quick start guide shows immediate API usage
  - No mention of free tier limits or pricing
  - Pricing page only shows "Talk to Sales" form

---

## Docs Site Analysis (docs.sixtyfour.ai)

### Overall Score: 67/120 - "Needs Work"

*(Note: Detailed breakdown not yet documented - available at https://www.builtfor.dev/score/qi507TjgJX)*

### Key Differences from Marketing Site

The docs site scores **10 points higher** than the marketing site, suggesting:
- ✅ Better technical documentation structure
- ✅ More developer-focused content
- ⚠️ Still missing critical developer tooling (SDKs, CLI)
- ⚠️ Documentation has broken pages (404 errors reported in previous analysis)

### Known Issues (from previous analysis)
- Multiple 404 pages for common developer URLs (docs, documentation, developers, api, reference, guides, getting-started, quickstart, tutorials, pricing, sdk)
- Missing rate limits in API docs
- Missing pricing information
- No free tier limits displayed clearly

---

## Quick Wins (Prioritized by Effort/Impact)

### Low Effort, High Impact ⚡

#### 1. Add Code Examples to Homepage Hero Section
- **Effort**: Low (2-4 hours)
- **Impact**: Immediately signals to developers this is for them
- **Implementation**:
  ```javascript
  // Show a simple cURL or JavaScript example above the fold
  curl https://api.sixtyfour.ai/enrich-lead \
    -H "x-api-key: YOUR_API_KEY" \
    -d '{"email": "jane@example.com"}'
  ```

#### 2. Add Developer-Focused Navigation and Messaging
- **Effort**: Low (4 hours)
- **Impact**: Better developer recognition and engagement
- **Implementation**:
  - Add "Developers" or "API Docs" link to main navigation
  - Change hero copy to include "API" or "Developer Platform"
  - Add "API Reference" CTA alongside "Deploy Now"

#### 3. Fix All 404 Documentation Pages
- **Effort**: Low (1-2 hours)
- **Impact**: Prevents developer abandonment
- **Implementation**:
  - Create redirects for: /docs, /documentation, /developers, /api, /reference, /guides, /getting-started, /quickstart, /tutorials, /sdk
  - Point all to appropriate docs.sixtyfour.ai pages

#### 4. Add Rate Limits and Pricing to API Docs
- **Effort**: Low (2-3 hours)
- **Impact**: Removes friction for developers to start
- **Implementation**:
  - Document rate limits per endpoint
  - Show free tier: "X requests/month free"
  - Link to clear pricing page

### Medium Effort, High Impact 💪

#### 5. Create Clear API Pricing Tiers with Usage Limits
- **Effort**: Medium (1-2 days with stakeholder alignment)
- **Impact**: Removes friction for developers to start testing
- **Implementation**:
  - Replace "Talk to Sales" with transparent pricing
  - Show tiers: Free (1K requests/month), Starter ($49/month), Pro ($199/month), Enterprise (custom)
  - Self-service signup for Free/Starter tiers

#### 6. Build Python SDK (Most Critical SDK)
- **Effort**: Medium (1 week)
- **Impact**: Dramatically reduces integration friction
- **Implementation**:
  - Create `sixtyfour-python` package
  - Publish to PyPI
  - Add to docs with installation instructions
  - Include examples for all endpoints

#### 7. Build JavaScript/TypeScript SDK
- **Effort**: Medium (1 week)
- **Impact**: Covers web and Node.js developers
- **Implementation**:
  - Create `@sixtyfour/sdk` package
  - Publish to npm
  - TypeScript-first with full type definitions
  - Include examples for all endpoints

---

## Strategic Opportunities (Long-term)

### 1. Developer Tooling Ecosystem
- **Current Gap**: Only REST API, no SDKs or CLI tools
- **Developer Impact**: High integration friction limits adoption
- **Solution Approach**:
  - ✅ Build SDKs for popular languages (Python, JavaScript, Go)
  - ✅ Distribute via package managers (PyPI, npm, Go modules)
  - Create CLI tool for testing and debugging
  - Provide Postman/Insomnia collections
  - Create OpenAPI/Swagger spec

### 2. Developer Community
- **Current Gap**: No visible community presence or support channels
- **Developer Impact**: Developers can't get help or share knowledge
- **Solution Approach**:
  - Create Discord or Slack community
  - Build Stack Overflow presence
  - Hire developer advocates
  - Create GitHub organization with examples repo
  - Host developer events/webinars

### 3. Integration Guidance
- **Current Gap**: No architecture diagrams or workflow examples
- **Developer Impact**: Unclear how to integrate into existing systems
- **Solution Approach**:
  - Create integration guides for common use cases
  - Show architecture patterns (batch processing, real-time enrichment, data pipelines)
  - Provide sample apps/repositories
  - Document "works with" integrations (Zapier, n8n, Make)

### 4. Advanced Learning Resources
- **Current Gap**: Only basic getting started docs
- **Developer Impact**: Developers can't learn advanced patterns
- **Solution Approach**:
  - Create video tutorials
  - Build interactive examples/playground
  - Write cookbook with common patterns
  - Document edge cases and error handling
  - Create migration guides from competitors

---

## What AI Can't Tell You (Requires Manual Testing)

1. **API Performance**: Whether the API rate limits are reasonable for typical use cases and how they compare to competitors
2. **Data Quality**: How accurate and fresh the people/company data actually is compared to other data enrichment APIs
3. **Reliability**: The actual API response times and reliability under load
4. **Data Accuracy**: How well the structured data extraction works with edge cases and incomplete profiles
5. **Value Proposition**: Whether the "AI agents" provide significantly better results than traditional data enrichment services

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (Week 1)
1. ✅ Add code examples to homepage
2. ✅ Fix all 404 documentation pages
3. ✅ Add developer-focused navigation
4. ✅ Document rate limits in API docs
5. ✅ Add pricing information to docs

**Expected Impact**: Score increase to ~65-70/120

### Phase 2: Core Developer Experience (Weeks 2-4)
1. ✅ Create transparent pricing tiers
2. ✅ Build Python SDK
3. ✅ Build JavaScript/TypeScript SDK
4. ✅ Create integration guides
5. ✅ Add architecture examples

**Expected Impact**: Score increase to ~75-85/120

### Phase 3: Community & Growth (Months 2-3)
1. ✅ Launch developer community (Discord/Slack)
2. ✅ Create sample apps repository
3. ✅ Build CLI tool
4. ✅ Create video tutorials
5. ✅ Hire developer advocate

**Expected Impact**: Score increase to ~85-95/120

---

## Comparison to Industry Standards

For a developer-focused API product, typical score distribution:

| Score Range | Classification | What It Means |
|-------------|----------------|---------------|
| 90-120 | Excellent | Stripe, Twilio, OpenAI level |
| 70-89 | Good | Solid developer experience, minor gaps |
| 50-69 | Needs Work | **← SixtyFour is here** |
| 30-49 | Poor | Significant friction, high abandonment |
| 0-29 | Very Poor | Not ready for developer adoption |

**SixtyFour's current position**: Below the "Good" threshold, primarily due to:
- Missing developer tooling (SDKs, CLI)
- Marketing positioning as B2B SaaS instead of developer platform
- Unclear pricing and trial access

---

## Conclusion

SixtyFour AI has **strong technical fundamentals** (good API, solid documentation) but is **losing developers at the top of the funnel** due to poor positioning and missing developer tooling.

### The Good ✅
- Well-documented API with working examples
- Multiple useful endpoints
- Technical credibility established
- YC backing and SOC 2 compliance

### The Gaps ⚠️
- Homepage doesn't speak to developers
- No SDKs or language-specific tooling
- Unclear pricing creates friction
- No developer community or support channels

### The Priority 🎯
**Fix the positioning first** (Quick Wins 1-4) to stop losing developers at the homepage, then **build the tooling** (Python/JS SDKs) to reduce integration friction for those who make it to the docs.

With focused execution on the recommended action plan, SixtyFour could realistically achieve a **80-85/120 score within 60 days**, putting it in the "Good" category and dramatically improving developer adoption.
