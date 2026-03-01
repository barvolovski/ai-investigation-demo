# Section 3: Setup ↔ Discovery Loop

> How migration setup and target discovery depend on each other

## The Problem

Setup and Discovery have a **chicken-and-egg relationship**:

| If you start with... | You face this problem... |
|---------------------|--------------------------|
| **Planning/Setup** | Can't test without targets |
| **Defining scope** | Don't know how many cases exist without discovery |
| **Finding targets** | Don't know exactly what to look for without setup |

This is **circular and dynamic** - you often need to go back and forth.

## Examples

### Example 1: Scope Changes Strategy
1. Start with setup: "Replace OldLib with NewLib"
2. Discovery finds: 3 different usage patterns across 50 repos
3. Realization: Need different strategies per pattern
4. Setup changes: Split into 3 sub-migrations

### Example 2: Discovery Reveals Complexity
1. Start with discovery: Find all uses of deprecated API
2. Find: Some repos use it directly, some through wrappers
3. Setup needs: Different prompts for each case
4. Iteration: Refine setup based on what discovery revealed

### Example 3: Testing Requires Targets
1. Write migration prompt
2. Need to test: Does it work?
3. Problem: No targets defined yet
4. Can't validate setup without something to run against

---

## Options for Handling This

### Option 1: Sample-Based Iteration

```
Start with 3-5 example targets (manual/quick search)
        ↓
Build and test initial setup on samples
        ↓
Expand discovery using what you learned
        ↓
Refine setup as you find new patterns
        ↓
Repeat until stable
```

**Pros:**
- Simple to start
- Quick feedback loop
- Works well for simple migrations

**Cons:**
- Might miss major patterns early
- Samples may not be representative
- Could require significant rework later

---

### Option 2: Parallel Exploration

```
AI explores codebase broadly
        ↓
Reports: "I see 3 main patterns across ~50 repos"
        ↓
User and AI decide strategy based on full picture
        ↓
Then commit to setup approach
```

**Pros:**
- Better overview upfront
- Fewer surprises later
- Informed strategy decisions

**Cons:**
- Takes longer to start
- May be overkill for simple migrations
- Analysis paralysis risk

---

### Option 3: Unified Fluid Session

```
Single interactive session
        ↓
AI switches between discovery and setup as needed
        ↓
"Found new pattern - update spec or treat separately?"
        ↓
Natural flow based on what you find
```

**Pros:**
- Most flexible
- Natural workflow
- Adapts to complexity

**Cons:**
- Needs sophisticated AI orchestration
- Harder to track progress
- May feel chaotic

---

## Decision: TBD

> We need to fully understand all requirements before deciding on approach.

Factors to consider:
- Migration complexity varies widely
- User skill level varies
- Some migrations are urgent, some can take time
- May need different approaches for different migration types

---

## Questions to Answer

1. Should the approach vary by migration complexity?
2. How much upfront exploration is valuable vs. slowing things down?
3. Can the AI learn to recommend the right approach?
4. What's the minimum viable loop for simple migrations?
5. What's the full-featured loop for complex migrations?

---

## Notes

- This is a core UX problem to solve
- The interaction model here affects both Setup and Discovery design
- Consider: Can user choose their preferred approach?
- Consider: Can AI recommend approach based on initial signals?
