# Section 2: Target Discovery

> How migration owners find and define where changes are needed

## Current State

### Target Definition
- A target = **repo + path**
- API exists to define targets once identified
- Target roughly maps to a PR

### Discovery Methods Used Today

| Method | Description |
|--------|-------------|
| **Manual search** | Grep/search across repos |
| **Code search tools** | Internal tools, GitHub search, Sourcegraph |
| **Custom scripts** | Scripts that scan for patterns |
| **Prior knowledge** | Migration owner knows which repos |
| **Dependency analysis** | What depends on the library/API |
| **Grafana/observability** | Runtime data showing usage |
| **Internal tools** | Company-specific discovery tools |

**Key problem:** Combination of methods, but **nothing works well**.

### Current Challenges

| Challenge | Description |
|-----------|-------------|
| **Incomplete** | Miss targets, find them later after migration "finished" |
| **False positives** | Find things that look like targets but aren't |
| **Scale** | Too many repos to search effectively |
| **Variety** | Same thing appears differently across repos (naming, patterns) |
| **Dynamic** | New targets appear during migration (new code, new repos) |
| **No single source of truth** | Different tools give different answers |

---

## Desired State

### Vision: Interactive Discovery Agent
An AI agent that works with the user to find and define targets:
- Has access to all discovery tools (code search, dependency graphs, etc.)
- Iterative refinement loop with user feedback
- Gets smarter about this specific migration as it learns

### Iterative Refinement Loop

```
┌─────────────────────────────────────────────┐
│  1. AI searches/finds some targets          │
│              ↓                              │
│  2. Shows user: "Is this correct?"          │
│              ↓                              │
│  3. User gives feedback:                    │
│     - "Yes, that's a target"               │
│     - "No, not relevant" (AI learns why)   │
│     - "Different type" (categorize)        │
│     - "You missed X" (point to new areas)  │
│     - "Same pattern as Y" (help recognize) │
│              ↓                              │
│  4. AI refines search based on feedback     │
│              ↓                              │
│  5. Repeat until complete                   │
└─────────────────────────────────────────────┘
```

### What Makes It "Smart"

- **Proactive suggestions** - Notices things user didn't think to ask
- **Pattern recognition** - Identifies different patterns automatically
- **Risk assessment** - Warns about tricky areas
- **Cross-referencing** - Connects code search with runtime data, dependencies
- **Learning from feedback** - Improves understanding during session
- **Context awareness** - Understands the migration purpose

---

## Complete Discovery Structure

### Search Criteria
- [ ] **What to look for** - Imports, patterns, usages, signatures
- [ ] **Where to search** - Repos, paths, file types
- [ ] **Exclusions** - What to ignore (tests, deprecated, etc.)

### Target Definition (per target)
- [ ] **Repo + path** - Location
- [ ] **Target type/category** - Classification
- [ ] **Complexity estimate** - Simple/medium/complex
- [ ] **Pattern variant** - Which pattern it matches

### Validation Info
- [ ] **Confidence level** - Definite / Probable / Maybe
- [ ] **Discovery method** - How it was found
- [ ] **Verification status** - Confirmed by user or not

### Context per Target
- [ ] **Related files/dependencies** - What else is involved
- [ ] **Ownership/team** - Who owns this code
- [ ] **Current state** - Tests passing? Active development?
- [ ] **Special considerations** - Known issues, complexity

### Grouping & Batching
- [ ] **Relationships** - How targets relate to each other
- [ ] **Suggested order** - Execution sequence
- [ ] **Dependencies** - Target A must complete before B

### Progress Tracking
- [ ] **Discovery status** - Searching / Found / Verified
- [ ] **Coverage estimate** - How much searched
- [ ] **Known gaps** - Areas not yet explored

---

## Gaps to Address

1. **No unified discovery tool** - Multiple fragmented methods
2. **No learning loop** - Discovery doesn't improve from feedback
3. **No confidence scoring** - All targets treated equally
4. **No coverage tracking** - Don't know what's been searched
5. **No smart suggestions** - AI doesn't proactively find things
6. **Poor pattern recognition** - Same thing looks different across repos

---

## Options to Explore

### Option A: AI-Powered Search
- Natural language: "Find everywhere we use OldLibrary"
- AI translates to searches across all sources
- Returns unified results with confidence

### Option B: Guided Discovery Wizard
- Step-by-step questions about what to find
- AI builds search strategy from answers
- Executes across all sources

### Option C: Exploratory Agent (Recommended to explore)
- AI explores codebase proactively
- Reports findings: "I see X patterns across Y repos"
- User validates and guides
- Iterative refinement

### Option D: Hybrid Based on Complexity
- Simple migrations: quick search
- Complex migrations: full exploratory agent

---

## Notes & Considerations

- Discovery depends on Setup (need to know what to find)
- Setup depends on Discovery (need to know scope to plan)
- See [03-setup-discovery-loop.md](./03-setup-discovery-loop.md) for handling this
- Consider continuous discovery (new targets appear over time)
