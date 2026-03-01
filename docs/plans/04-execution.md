# Section 4: Execution & Triggering

> How migrations run - local, CI, rules, standards

## Current State

### What Exists Today
- [ ] Agents run in CI (Buildkite)
- [ ] Supports Claude Code and Codex CLI
- [ ] Can trigger locally or remotely
- [ ] (More details needed)

### How Triggering Works
- (To be documented)

### Execution Flow
- (To be documented)

### User Controls
- (To be documented)

---

## Desired State

### Planned Improvements
- Additional options for users to define rules/standards
- (More details needed)

---

## Questions to Answer

1. How does a user trigger a migration run today?
2. What happens during execution step by step?
3. What control does the user have (pause, cancel, retry)?
4. How are rules/standards defined and enforced?
5. How does batching/parallelism work?
6. What are the failure modes and how are they handled?
7. How does local vs. CI execution differ?

---

## Complete Execution Structure

### Trigger Configuration
- [ ] **Trigger method** - Manual, scheduled, event-based
- [ ] **Environment** - Local, CI (Buildkite), other
- [ ] **Agent selection** - Claude Code, Codex CLI, other

### Execution Rules
- [ ] **Standards to enforce** - Lint, format, test requirements
- [ ] **Failure handling** - Retry, skip, abort
- [ ] **Concurrency** - Parallel execution limits
- [ ] **Ordering** - Dependencies between targets

### Monitoring During Execution
- [ ] **Progress visibility** - Real-time status
- [ ] **Logs access** - What's happening
- [ ] **Intervention options** - Pause, cancel, modify

---

## Gaps to Address

(To be identified)

---

## Options to Explore

(To be identified after understanding current state)

---

## Notes

- Section needs more input from user about current state
- Execution is downstream of Setup and Discovery
