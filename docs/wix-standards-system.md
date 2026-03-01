# Wix Standards (CI Police) — Complete System Reference

> Focusing on: Rules, Checks, Fixes, and the full enforcement lifecycle.

---

## 1. What Is This System?

Wix Standards (internally called "CI Police") is a **policy enforcement platform** that runs during CI builds. It ensures all Wix projects comply with company-wide decisions — new libraries, API migrations, security fixes, deprecations, platform updates, etc.

The system provides:
- **Rules**: Packaged checks that validate a project against a specific standard
- **Checks**: Automated execution of rules during CI builds
- **Fixes**: Automatic code modifications + PR creation for fixable violations
- **Enforcement**: Build breaking, rollout blocking, deadlines, opt-outs, escalations
- **Visibility**: Dashboard, Slack bot (Robocop), email reports, BI tracking

---

## 2. How Rules Work

### 2.1 Rule Definition

A rule is an npm package (`@wix/ci-police-rule-{name}`) that exports a class extending `Rule`.

**Minimal rule** (`src/index.ts`):
```typescript
import { Rule, RuleCheckResult } from '@wix/wix-standards-runtime';

export default class extends Rule {
  async check(cwd: string): Promise<RuleCheckResult> {
    // cwd = absolute path to the project being checked
    // Return pass, error, warning, ignore, or violations
  }
}
```

Source: `packages/wix-standards-runtime/src/types/rule.ts`

### 2.2 Check Results — What a Rule Can Return

A rule's `check()` must return one of these shapes:

| Result Type | Shape | Meaning |
|---|---|---|
| **Pass** | `{ severity: 'pass' }` | Project complies |
| **Error** | `{ severity: 'error', message: string }` | Project violates (breaks build) |
| **Warning** | `{ severity: 'warning', message: string }` | Project violates (doesn't break yet) |
| **Ignore** | `{ severity: 'ignore', message?: string }` | Rule not applicable to this project |
| **Violations** | `{ violations: RuleViolation[] }` | Granular per-violation reporting |

**Violation structure:**
```typescript
interface RuleViolation {
  id: string;              // Unique ID for this specific violation
  title: string;           // Human-readable title
  severity: 'error' | 'warning';
  message?: string;        // Additional details
  deadline?: Date;         // Custom deadline for this violation
}
```

The `violations` result type allows **per-violation tracking**: each violation has its own ID, can have its own opt-out, its own deadline, and its own regression tracking.

Source: `packages/wix-standards-runtime/src/types/rule.ts:151-225`

### 2.3 Fixable Rules

A rule can also implement `fix()` to enable automatic fixing:

```typescript
import { Rule, Fixable, FixableRuleCheckResult } from '@wix/wix-standards-runtime';

export default class extends Rule implements Fixable {
  async check(cwd: string): Promise<FixableRuleCheckResult> {
    return {
      severity: 'error',
      message: 'Using deprecated API',
      isFixable: true,     // <-- signals this can be auto-fixed
    };
  }

  async fix(cwd: string): Promise<void> {
    // Modify files in-place at cwd
    // No need to commit — the autofix system handles git
  }
}
```

The `isFixable: boolean` field on the result tells the system whether auto-fixing is available.

Source: `packages/wix-standards-runtime/src/types/rule.ts:121-124`

### 2.4 Plugin System

Rules can use plugins for common capabilities via `Rule.WithPlugins([...])`:

```typescript
export default class extends Rule.WithPlugins([FileReaderPlugin]) {
  async check(cwd: string): Promise<RuleCheckResult> {
    // this.plugins.getSourceFilePaths, this.plugins.getSourceFilesThatInclude, etc.
    const files = await this.plugins.getSourceFilesThatInclude(
      ['oldApiCall'], ['ts', 'js']
    );
    // ...
  }
}
```

**How plugins work internally:**
1. When `Rule.WithPlugins([Plugin1, Plugin2])` is called, it creates a subclass
2. In the constructor, all plugins are instantiated
3. `exportsV2()` is called immediately (sync exports)
4. Before `check()` runs, each plugin's `shouldCheck(cwd)` is called — if any returns `{ shouldCheck: false, reason }`, the rule returns `{ severity: 'ignore', reason }`
5. Then `exports(cwd)` is called on each plugin (async exports)
6. All exported methods are merged into `this.plugins`
7. Duplicate property names between plugins throw an error

Source: `packages/wix-standards-runtime/src/types/rule.ts:8-70`

**Available Plugins:**

| Plugin | Exports | Purpose |
|---|---|---|
| `FileReaderPlugin` | `getSourceFilePaths(extensions)`, `getSourceFilesThatInclude(strings, extensions)`, `getFilesThatInclude(paths, strings)` | Find and search source files, respects `.gitignore` |
| `LoggerPlugin` | `setBaseParams(data)` | Structured logging with Panorama integration |
| `OoiPlugin` | `isOoi` | Check if artifact is "Out of Infrastructure" |
| `HadCdnTrafficPlugin` | `hadCdnTraffic` | Check if artifact had CDN traffic |

Source: `packages/wix-standards-plugins/src/`

**Plugin base class:**
```typescript
abstract class Plugin {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly ownershipTag: string;

  async shouldCheck(cwd: string): Promise<{ shouldCheck: true } | { shouldCheck: false; reason: string }> {
    return { shouldCheck: true }; // default: always check
  }

  async exports(cwd: string) { return {}; }  // async exports
  exportsV2() { return {}; }                   // sync exports
}
```

Source: `packages/wix-standards-runtime/src/types/plugins/Plugin.ts`

### 2.5 Rule Registration

Rules are registered on the server with this data model:

```
RuleRegistration {
  rule_name: string              // e.g. "@wix/ci-police-rule-no-legacy-api"
  promoted: { version: string }  // null = DEV mode, set = PRODUCTION
  disabled: boolean              // Completely disable execution
  regression_disabled: boolean   // Disable regression tracking
  auto_autofix_enabled: boolean  // Enable automatic autofix

  metadata: {
    description: string
    ownership_tag: string        // Team that owns this rule
    support_channel: string      // Slack channel for help
    rule_group: RuleGroups       // GENERAL, FED, MOBILE, CI, etc.
    optout_review_sla: number    // Days to review opt-out requests
  }

  resources: {
    check_method: CheckMethod              // NPM_PACKAGE | REQUEST | STANDALONE
    enforcement_method: EnforcementMethod  // BREAK_BUILD | BLOCK_ROLLOUT
    subject: Subject                       // PROJECT | REPOSITORY
    metadata: {
      npm_metadata: {
        dev_mode_exposure_percentage: number  // % of projects to run in dev mode
      }
    }
  }

  escalation_configuration: {
    escalation_period: number    // Days before escalation
  }
}
```

**Rule lifecycle:**
1. **DEV mode**: `promoted = null` — runs for a random percentage of projects (default 50%)
2. **PRODUCTION**: `promoted.version = "1.2.3"` — runs for all projects matching preset

### 2.6 Rule Groups and Presets

**Rule Groups** — every rule belongs to one:
```
GENERAL, BUSINESS_MANAGER, VIEWER, NODE_PLATFORM, CI, BI, SLED,
MOBILE, SCOPED_MIGRATION, DESIGN_SYSTEMS, PERFORMANCE, CORE_SERVICES,
CONTACTS, BAZEL, FLYNT, ACCESSIBILITY, TEST, QUALITY
```

Source: `packages/wix-standards-runtime/src/proto/index.ts`

**Presets** — filter which rules run for a project:

| Preset | Type | Groups |
|---|---|---|
| `fed` | exclude | MOBILE, BAZEL, TEST, FLYNT (runs everything except these) |
| `mobile` | only | MOBILE, SCOPED_MIGRATION |
| `bazel` | only | BAZEL |
| `test` | only | TEST |
| `api` | only | CI, FLYNT |
| `nsr` | only | NODE_PLATFORM |

A `Preset` has shape: `{ type: 'only' | 'exclude', groups: RuleGroups[] }`

- `type: 'only'` — run ONLY rules in these groups
- `type: 'exclude'` — run all rules EXCEPT those in these groups

Source: `packages/wix-standards-runtime/src/presets/`

---

## 3. How Checks Work

### 3.1 The Check Flow (Step by Step)

The CLI command `ci-police check [path] [options]` executes this flow:

**Step 1: Parse Options**
```
--preset fed           # Which preset to filter rules
--report               # Whether to report results to server
--project-name <name>  # Project identifier
--project-github <url> # GitHub URL
--project-tc <url>     # Build URL (Buildkite/TeamCity)
--tag <tag>            # Result tag (e.g. "PR #123")
--concurrency <n>      # Parallel rule execution (default: 4)
--rule-timeout <ms>    # Timeout per rule
--download-to <path>   # Rule cache directory
--results-to-json <p>  # Write results to JSON file
```

Source: `packages/ci-police-cli/src/commands/check/handler.ts`

**Step 2: Fetch Rules List**
```
CLI → RuleRegistryService.ListRules({}) → all registered rules
  → filter by runnableRule:
      - check_method === NPM_PACKAGE
      - subject === PROJECT
      - not disabled
  → filter by preset (include/exclude groups)
  → filter dev mode rules by random percentage
```

Source: `packages/ci-police-cli/src/api/registry.ts`

**Step 3: Download Rules**

For each rule, download the npm package:
```
1. Check cache: downloadTo/{ruleName} exists? → use cached
2. Fetch package metadata: GET /ci-police-npm-proxy/rule/{name}/{version}
3. Download tarball from npm registry
4. Extract ONLY dist/index.js (via tar stream, strip 1 level)
5. Save to: downloadTo/{ruleName}/dist/index.js
```

Source: `packages/ci-police-cli/src/commands/helpers/get-rules/download-rule-bundle.ts`

**Step 4: Run Rules**

Uses `RulesRunner` with a promise queue (concurrency-limited):
```
For each runnable rule (in parallel, up to concurrency limit):
  1. Download rule bundle (Step 3)
  2. require(pathToRule).default → RuleClass
  3. new RuleClass()
  4. Set up logger if plugin supports it
  5. Promise.race([
       rule.check(projectPath),       // actual check
       timeout(ruleTimeout)           // timeout guard
     ])
  6. Collect result + running time
  7. On error: return error result (doesn't fail the whole run)
```

Source: `packages/ci-police-cli/src/commands/helpers/check/runner.ts:151-186`
Source: `packages/ci-police-cli/src/commands/check/rule-runners/rule-in-band-runner.ts`

**Step 5: Report to Station Server**
```
CLI → RuleResultsService.SubmitProjectResultsV3({
  project: { name, gitUrl, tcUrl, artifactId },
  tag,
  fingerprint,
  results: {
    [ruleName]: {
      result: { severity, message, isFixable }
      // OR
      resultWithViolations: { isFixable, violations: [...] }
    }
  },
  submissionType: PARTIAL
})

Server returns: ProjectReport {
  isBreaking: boolean        // Should the build fail?
  isFixable: boolean         // Any auto-fixable violations?
  results: {
    breaking: [...]          // Rules breaking the build NOW
    future: [...]            // Rules that WILL break (in grace period)
    passing: [...]           // Rules that pass
    irrelevant: [...]        // Ignored, opted-out, dev mode
  }
}
```

Note: Messages are trimmed to 512 chars max before sending.

Source: `packages/ci-police-cli/src/commands/check/api/police-station.ts`

**Step 6: Report to Console**
```
🚨 CI Police Results 🚨
-----------------------
3 rules are breaking your build       (red)
2 rules will break your build soon    (yellow)
45 rules passed                       (green)
5 rules are irrelevant                (gray)
-----------------------
💡 Full report: https://bo.wix.com/wix-standards/projects?projectName=...
```

If breaking or DEBUG mode: also prints per-rule breakdown grouped by RuleGroup.

Source: `packages/ci-police-cli/src/commands/helpers/reporters/console.ts`

**Step 7: Exit**
```
Exit codes:
  0 (SUCCESS)       — all rules passed
  7 (RULE_FAILURE)  — some rules are breaking
  1 (EXCEPTION)     — CLI error
```

Source: `packages/wix-standards-runtime/src/types/exit-codes.ts`

### 3.2 CI Integration: Falcon Plugin

For monorepo builds, the Falcon plugin integrates Wix Standards:

**Phase 1: Initialize**
- Download CLI to storage
- Find available port, start daemon
- Fetch Petri experiments
- Save plugin state

**Phase 2: shouldValidatePackage** (per package in monorepo)
- Check if package has `wix.artifact` key in package.json
- If yes → get fingerprint from server (for deduplication) → `Validate({ fingerprint })`
- If no → `NoValidate()`

**Phase 3: run** (per validated package)
- Determine preset from artifact description
- Determine tag: `"PR #123"` or `"Branch: feature-x"` or `null` (master)
- Run check via daemon (avoids CLI startup overhead)
- On success → `ValidationResult.Success()`
- On failure → `ValidationResult.Failure({ reason })` with detailed breakdown
- On exception → `ValidationResult.Success()` (silent failure, doesn't block build)

Skipped repos: `metro-packages`, `bi-schema-loggers`, `auto-sdk-packages`

Source: `packages/ci-police-falcon-plugin/src/index.ts`

### 3.3 Daemon Mode

`ci-police daemon` runs a persistent HTTP server. The Falcon plugin uses this instead of launching a new CLI process per package — significantly faster for monorepos with many packages.

Source: `packages/ci-police-cli/src/commands/daemon/`

---

## 4. How Fixes Work

### 4.1 Fix Command (Single Rule)

`ci-police fix <ruleName> <projectPath> [options]`

```
1. Fetch rule registration from server
2. Download rule npm package
3. require(rule).default → RuleClass
4. rule = new RuleClass()
5. Check if 'fix' in rule — if not, throw RuleIsNotFixableError
6. await rule.fix(projectPath)
   → Rule modifies files in-place
   → No git operations here
```

Source: `packages/ci-police-cli/src/commands/fix/fix.ts`

### 4.2 Autofix CLI (Full PR Flow)

`autofix-cli` orchestrates the entire fix-and-PR lifecycle:

**Step 1: Fetch Current Results**
```
GET RuleResultsService.GetProjectReport({ projectName, tag? })
→ Get all breaking/future/passing/irrelevant results
```

**Step 2: Filter Fixable Rules**
```
Filter where:
  result.isFixable === true
  AND result.severity in requested severities (ERROR, WARNING)
  AND (if --rule-name: matches specific rule)
```

**Step 3: Download CI Police CLI**
```
downloadCIPoliceFromArtifactory({ npmRegistryBaseUrl })
→ Downloads the full CLI binary
```

**Step 4: Setup Git**
```
Parse GitHub URL → org, repo, originalBranch, projectPath
Add HTTPS remote if needed (for token-based push)
Create branch: wix-standards-autofix/{projectName}-{timestamp}
Checkout branch
```

**Step 5: Fix Each Rule Sequentially**
```
for each fixable rule:
  Run: ci-police fix {ruleName} {path} --download-to {tmp} ...

  if failed:
    git reset --hard  (undo any partial changes)
    record: FAILURE

  else if working tree has changes:
    git add .
    git commit "Fix rule {ruleName}" (author: wix-standards-autofix)
    record: SUCCESS

  else (fix ran but no changes):
    record: SUCCESS
```

Rules are fixed **sequentially** — they can't run in parallel because they may modify the same files.

Source: `apps/autofix-cli/src/runner.ts:229-319`

**Step 6: Push + Create PR**
```
if hasChanges:
  git push {remote} {branch}

  if --pr-number (existing PR):
    POST comment to PR with fix results

  else:
    Create new PR via githug service:
      title: "[Wix Standards - Autofix] {projectName}"
      body: Summary table of fixed rules
```

**Step 7: Report Results**
```
AutofixService.SubmitAutofixResults({
  autofixResults: { [ruleName]: { fixResultStatus: SUCCESS | FAILURE } },
  prNumber, prBranch, githubOrg, githubRepo
})
```

Source: `apps/autofix-cli/src/runner.ts`

### 4.3 Auto-Autofix

Rules with `auto_autofix_enabled = true` in their registration can be automatically fixed without human trigger. The system detects violations and runs the autofix flow automatically.

---

## 5. Enforcement: How Rules Break Builds

### 5.1 Server-Side Decision

When results are submitted, the **server** decides what's breaking:

```
ProjectReport.isBreaking = true when:
  - Any rule has severity ERROR
  - AND the rule is promoted (not DEV mode)
  - AND no active opt-out covers it
  - AND the grace period (milestone) has ended
  - AND the violation deadline has passed
```

Results are categorized into 4 buckets:

| Bucket | Meaning | Breaks Build? |
|---|---|---|
| `breaking` | Active violations past deadline | Yes |
| `future` | Active violations still in grace period / before deadline | No (yet) |
| `passing` | Rule passes | No |
| `irrelevant` | Ignored, opted-out, dev mode, disabled | No |

### 5.2 Enforcement Methods

Rules declare their enforcement method:

| Method | Behavior |
|---|---|
| `BREAK_BUILD` | Fails the CI build when check fails |
| `BLOCK_ROLLOUT` | Doesn't break CI, but blocks deployment to production (GA) |

### 5.3 Deadlines and Grace Periods

**Milestones**: A rule can have a milestone with `startDate` and `endDate`. During the grace period (between start and end), violations are categorized as `future` instead of `breaking`.

**Grace period check:**
```typescript
isInGracePeriod = milestone exists
  && rule is promoted
  && milestone.startDate < now
  && milestone.endDate > now
```

**Deadline calculation priority:**
```
1. If violation has opt-out with expiry → use opt-out expiry
2. If violation has custom deadline → max(violationDeadline, milestoneEndDate)
3. If opt-out exists → max(optOutExpiry, calculated deadline)
4. Otherwise → milestone endDate
```

Source: `packages/ci-police-common-logic/src/deadline-utils.ts`

### 5.4 Opt-Outs

Projects can request exemptions from rules:

**Opt-out types:**

| Type | Purpose |
|---|---|
| `EXTENSION` | Temporary deadline extension |
| `COMMITMENT` | Commitment to fix by a specific date |
| `EMERGENCY` | Emergency bypass (tracked, requires justification) |
| `SELF_SERVICE` | Self-service opt-out |

**Opt-out data:**
```
OptOutProject {
  project_name, rule_name (or violation_id for per-violation)
  approved_by, requested_by
  reason
  approved_at, expires_at (null = permanent)
  type: EXTENSION | COMMITMENT | EMERGENCY | SELF_SERVICE
}
```

**Opt-out statuses:**
- Original Deadline
- Committed to new deadline
- Has an extension
- Under emergency opt out
- Has an extension while request is processed
- Has permanent opt-out

Source: `packages/ci-police-common-logic/src/optout-status.ts`

### 5.5 Regressions

The server tracks **regressions** — when a rule that previously passed starts failing. Regressions can be:
- Displayed with special emphasis in console output ("regressed")
- Used to trigger immediate alerts via Robocop (Slack bot)
- Regression tracking can be disabled per rule (`regression_disabled`)

### 5.6 Escalation

Rules can configure an `escalation_period` (days). When opt-out requests exceed the escalation period beyond the current deadline, the request is flagged as **escalated** and may require higher-level approval.

Source: `packages/ci-police-common-logic/src/optout-utils.ts`

---

## 6. System Architecture

### 6.1 Core Components

```
┌─────────────────────────────────────────────────────┐
│                    CI BUILD                          │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────┐       │
│  │ ci-police    │    │ Falcon Plugin         │       │
│  │ CLI          │    │ (monorepo builds)     │       │
│  └──────┬───────┘    └──────────┬───────────┘       │
│         │                       │                    │
│         │    ┌──────────────┐   │                    │
│         └───►│ Daemon       │◄──┘                    │
│              │ (HTTP server)│                         │
│              └──────┬───────┘                        │
└─────────────────────┼────────────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │  CI Police Station      │
         │  (gRPC Server)          │
         │                         │
         │  - RuleRegistryService  │
         │  - RuleResultsService   │
         │  - AutofixService       │
         │  - MilestonesService    │
         │  - OptOutService        │
         │  - FingerprintService   │
         └────────────┬────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
│ Dashboard  │  │ Robocop   │  │ Autofix   │
│ (Next.js)  │  │ (Slackbot)│  │ CLI       │
└────────────┘  └───────────┘  └───────────┘
```

### 6.2 Packages Summary

| Package | Purpose |
|---|---|
| `ci-police-cli` | Main CLI: `check`, `fix`, `daemon`, `pre-download` commands |
| `wix-standards-runtime` | Core SDK: `Rule`, `Plugin`, types, presets, exit codes |
| `wix-standards-plugins` | Reusable plugins: FileReader, Logger, OOI, CDN traffic |
| `wix-standards-toolkit` | Developer toolkit: build, test, lint rules |
| `wix-standards-autofix-logic` | PR title/body generation for autofix |
| `ci-police-falcon-plugin` | Falcon (monorepo build system) integration |
| `ci-police-common-logic` | Shared: deadlines, opt-outs, GitHub utils, escalation |
| `ci-police-cli-downloader` | Download CLI binary from Artifactory |
| `create-wix-standards-rule` | Scaffolding tool for new rules |

### 6.3 Services

| Service | Purpose |
|---|---|
| `ci-police-station-server` | Main backend: rule registry, results, milestones, opt-outs, autofix |
| `ci-police-informant-service` | Reporting and metrics aggregation |
| `robocop` | Slack bot: weekly reports, degradation alerts, engagement |

### 6.4 Serverless Functions

| Function | Purpose |
|---|---|
| `ci-police-npm-proxy` | Proxy for npm registry (rule downloads) |
| `ci-police-cdn-proxy` | Proxy for CDN endpoints |
| `ci-police-statistics` | Collect rule result statistics |
| `ci-police-reports` | Send periodic reports |
| `ci-police-block-ga` | Expose artifact blocking status (BLOCK_ROLLOUT) |
| `ci-police-codeowners` | CODEOWNERS management |
| `ci-police-organization` | Organization structure |
| `ci-police-daily-rule-result-report` | Daily BI reporting |
| `ci-police-skip-on-master` | Handle skip-on-master Kafka events |
| `ci-police-sync-request-rule-results` | Sync stale request-type rule results |
| `autofix-merged-bi-reporter` | Report autofix merge events to BI |

---

## 7. Complete Lifecycle — End to End

```
1. RULE CREATION
   Developer creates rule → publishes @wix/ci-police-rule-{name} to npm

2. RULE REGISTRATION
   RegisterRule() → starts in DEV mode (runs for ~50% of projects)

3. PROMOTION
   After review → PromoteRule() → runs for ALL matching projects

4. CI CHECK (every build)
   ci-police check → fetch rules → download from npm → run check()
   → submit results → server categorizes: breaking/future/passing/irrelevant
   → exit code: 0 (pass) or 7 (fail)

5. SERVER PROCESSING
   Receives results → checks regressions → checks opt-outs → checks deadlines
   → returns ProjectReport with isBreaking flag

6. ENFORCEMENT
   BREAK_BUILD: CI fails if isBreaking=true
   BLOCK_ROLLOUT: Blocks production deployment via ci-police-block-ga

7. VISIBILITY
   Dashboard: full breakdown per project
   Robocop: Slack notifications (weekly + regression alerts)
   BI: daily result reporting

8. OPT-OUT (if needed)
   Developer requests → review → approved with deadline → non-breaking until expiry

9. AUTOFIX (if rule implements fix())
   Manual or automatic trigger → autofix-cli:
     fetch results → filter fixable → checkout branch → run fix per rule
     → commit per rule → push → create PR → submit results

10. ITERATION
    Rule owner monitors adoption → adjusts deadlines → disables if needed
```

---

## 8. Key Concepts for Migration Context

Understanding this system is critical for agentic migrations because:

1. **Migrations ARE rules**: Many migrations are enforced as Wix Standards rules (rule group: `SCOPED_MIGRATION`). The migration creates a rule that checks whether a project has completed the migration.

2. **Checks tell us status**: The rule results for a project tell us whether it still needs migration — `ERROR` means not migrated, `PASS` means done.

3. **Autofix IS the migration**: For simple migrations, the `fix()` method IS the migration logic. Autofix-cli runs it and creates the PR.

4. **Opt-outs block us**: Projects with opt-outs won't show as breaking, so the agentic flow needs to be aware of opt-out status.

5. **Presets determine scope**: The preset (`fed`, `mobile`, `bazel`, etc.) determines which projects a migration rule will run against.

6. **Violations = granularity**: Using the violations result type (instead of simple pass/error), a migration rule can track individual items that need migration within a project.

7. **Grace periods = timeline**: Milestones define when a migration becomes mandatory. Before the milestone ends, violations are `future` (warning). After, they're `breaking`.

8. **Falcon plugin = monorepo**: For monorepo migrations, the Falcon plugin runs checks per-package, not per-repo.
