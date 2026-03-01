# Migration AI Product - Overview

> Status: Discovery Phase - Documenting current state and desired state

## What This Product Does

A migration system for large-scale code migrations across many repositories. Helps teams migrate frameworks, libraries, language versions, internal APIs, and code patterns.

## Migration Types Supported

- Framework upgrades (React, Angular, Spring Boot, etc.)
- Language version upgrades (Java 8→17, Python 2→3, Node versions)
- Library replacements (Moment.js → date-fns, etc.)
- Internal API changes (shared library signature changes)
- Pattern/convention changes (class → hooks, callbacks → async/await)

## Migration Complexity Spectrum

| Level | Description | Example |
|-------|-------------|---------|
| Simple | Single pattern, clear transformation | Rename import |
| Medium | Multiple patterns, some variations | Library replacement |
| Complex | Many variations, framework-specific | Major framework upgrade |
| Multi-step | Requires phases, dependencies | Full architecture migration |

## Users

- **Migration Owners** - Define and manage migrations
- **End Users (Engineers)** - Receive PRs, review and merge
- Any engineer can trigger migrations (current state)

## Document Structure

| Document | Purpose |
|----------|---------|
| [01-migration-setup.md](./01-migration-setup.md) | How migrations are defined |
| [02-target-discovery.md](./02-target-discovery.md) | How targets are found |
| [03-setup-discovery-loop.md](./03-setup-discovery-loop.md) | How setup and discovery interact |
| [04-execution.md](./04-execution.md) | How migrations run |
| [05-pr-delivery.md](./05-pr-delivery.md) | PR creation and quality |
| [06-tracking-dashboard.md](./06-tracking-dashboard.md) | Progress visibility |

## Key Themes

### Current Pain Points
1. **Setup is hard** - Users struggle to write effective migration prompts
2. **Discovery is fragmented** - Multiple tools, nothing works well, miss targets
3. **Iteration is difficult** - Hard to understand failures and improve
4. **Setup ↔ Discovery interdependency** - Chicken-and-egg problem

### Desired Direction
1. **Interactive AI guidance** - AI walks users through setup and discovery
2. **Collaborative refinement** - AI and human work together iteratively
3. **Broad AI access** - Agent has access to codebase, history, standards, tools
4. **Unified experience** - Seamless flow between setup and discovery

## Open Questions

- [ ] How to handle Setup ↔ Discovery interdependency (3 options proposed)
- [ ] Execution flow details (to be documented)
- [ ] PR delivery challenges (to be documented)
- [ ] Dashboard/tracking details (to be documented)
