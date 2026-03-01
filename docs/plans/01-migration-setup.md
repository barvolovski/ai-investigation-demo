# Section 1: Migration Setup

> How migration owners define what to change

## Current State

### How It Works Today
- Migration owner creates a `task.md` file
- Describes what they want to change in natural language
- Iterates by trial and error - test, see results, improve prompt
- No structured format or guidance

### Current Challenges

| Challenge | Description |
|-----------|-------------|
| **Not AI-minded users** | Many users don't know how to write effective prompts |
| **Scoping difficulty** | Hard to include the right info and define boundaries |
| **Debugging is hard** | When migration fails, unclear why or how to fix |
| **Missing use cases** | Users don't realize they have edge cases until they fail |
| **No guided experience** | Users are on their own to figure it out |

### Current Tooling/Help
- Limited documentation
- No structured templates
- No AI-assisted prompt creation
- Human support from core team when stuck

---

## Desired State

### Vision: Interactive AI Guide
An AI that walks the migration owner through setup step-by-step:
- Asks questions to understand the migration
- Has access to many areas (see below)
- Suggests approaches based on what it finds
- Explores together with the user
- Helps identify edge cases and gaps

### AI Access Requirements

The setup AI should have access to:

| Area | Purpose |
|------|---------|
| **Target codebase(s)** | Understand current patterns, frameworks, conventions |
| **Past migrations** | Learn from what worked before |
| **Company standards** | Coding guidelines, approved libraries, patterns |
| **Build/test systems** | Validate changes work |
| **Documentation** | Internal docs about systems being migrated |
| **Migration owner's intent** | Through conversation |
| **Runtime data** | Grafana, observability (sometimes relevant) |

### Interaction Model
- Step-by-step guidance
- AI asks questions, suggests, explores
- Collaborative - not fully automated
- Iterative refinement based on feedback

---

## Complete Setup Structure

What a migration setup should contain:

### Core Definition
- [ ] **Description** - What to change (natural language)
- [ ] **Motivation** - Why this migration is happening
- [ ] **Before/After examples** - Clear transformation examples
- [ ] **Scope boundaries** - What's in scope, what's explicitly out

### Technical Details
- [ ] **Patterns to detect** - What code patterns indicate a target
- [ ] **Transformation rules** - How to change the code
- [ ] **Edge cases** - Known variations and how to handle them
- [ ] **Framework-specific variations** - Different handling per framework

### Quality Criteria
- [ ] **Success definition** - How to know the migration worked
- [ ] **Required tests** - What tests must pass
- [ ] **Build requirements** - Build must succeed
- [ ] **Lint/format rules** - Code style requirements

### Constraints
- [ ] **Do not change** - Explicit exclusions
- [ ] **Dependencies/prerequisites** - What must exist first
- [ ] **Breaking change handling** - How to deal with breaking changes

### Context
- [ ] **Relevant documentation** - Links to related docs
- [ ] **Related past migrations** - Similar migrations to learn from
- [ ] **Codebase conventions** - Team/repo specific patterns
- [ ] **Owner/team info** - Who owns this migration

### Execution Config
- [ ] **Target splitting strategy** - How to batch/split targets
- [ ] **Priority/ordering** - What order to process
- [ ] **Review requirements** - Manual review needs
- [ ] **Batch size** - How many at once

---

## Gaps to Address

1. **No guided setup experience** - Users write task.md alone
2. **No access to context** - AI doesn't see codebase, history, standards
3. **No iteration support** - Hard to debug and improve prompts
4. **No structured format** - Freeform text, missing important elements
5. **No validation** - Can't verify setup is complete before running

---

## Options to Explore

### Option A: AI-Assisted Wizard
- Chat-based interview process
- AI asks questions one by one
- Builds structured setup from answers
- Validates completeness

### Option B: AI Reviews Draft
- User writes initial task.md
- AI analyzes and critiques
- Suggests improvements and gaps
- Iterative refinement

### Option C: AI Explores First
- AI analyzes codebase before questions
- Identifies patterns and variations
- Asks targeted questions based on findings
- Builds setup with codebase knowledge

### Option D: Hybrid (Recommended to explore)
- Combination based on migration complexity
- Simple migrations: quick wizard
- Complex migrations: exploration + guided refinement

---

## Notes & Considerations

- Setup and Discovery are interdependent (see [03-setup-discovery-loop.md](./03-setup-discovery-loop.md))
- AI capabilities have evolved - explore new approaches
- Balance automation with human control
- Different migration types may need different setup flows
