import type { InvestigationStep } from './types';

export interface Scenario {
  keywords: string[];
  steps: InvestigationStep[];
  conclusion: string;
}

const makeId = () => Math.random().toString(36).slice(2, 9);

export const scenarios: Scenario[] = [
  {
    keywords: ['bookings', 'attendance', 'delete', 'latency', 'alert', 'slack', 'deadline'],
    steps: [
      {
        id: makeId(),
        title: 'Alert Triage — Pulling context from multiple sources',
        description: 'Reading the Slack alert, checking service ownership, and pulling recent deployments in parallel',
        status: 'pending',
        thinkingText: 'An alert fired on #bookings-urgent about the DeleteAttendance endpoint. I need to pull the alert details, find who owns this service, and check if there were recent deployments — all in parallel to move fast.',
        toolCalls: [
          {
            tool: 'slack',
            label: 'Find Channel — #bookings-urgent',
            input: 'Find Channel Id(channelName: "bookings-urgent")',
            output: `Channel found: #bookings-urgent (C04N8QXYZ)
Last alert: 10:45 AM today

🚨 DB Alert Bot:
  ALERT: High latency detected on 'bookings_index' in prod-db-3.
  Investigation started.

  Wix AI Assistant:
  Investigation Summary: Recent degradation in artifact
  com.wixpress.bookings.attendance.bookings-attendance
  endpoint: DeleteAttendance seems to be related to
  feature toggle useDataLocality.
  Immediate Remediation: Deactivating Feature toggle useDataLocality`,
            durationMs: 820,
          },
          {
            tool: 'service_registry',
            label: 'Get ownership — bookings-attendance',
            input: 'get_service_ownership(serviceName: "com.wixpress.bookings.attendance.bookings-attendance")',
            output: `Service: bookings-attendance
Artifact: com.wixpress.bookings.attendance.bookings-attendance
Owner Team: bookings-core
Main Contact: maorye@wix.com
Slack: #bookings-core-urgent
Jira Project: SCHED
On-call: orst@wix.com (this week)
Framework: Loom Prime (JVM)`,
            durationMs: 650,
          },
          {
            tool: 'deployments',
            label: 'Get rollout history — last 5 deployments',
            input: 'get_rollout_history(artifactId: "bookings-attendance", limit: 5)',
            output: `Deployment History:
┌──────────┬───────────┬─────────────────────────────────────────┬──────────┐
│ Version  │ Date      │ Message                                 │ Author   │
├──────────┼───────────┼─────────────────────────────────────────┼──────────┤
│ 1.7082.0 │ Feb 11    │ Added validation to reject slot booking  │ orst     │
│          │           │ for course service with feature toggle   │          │
├──────────┼───────────┼─────────────────────────────────────────┼──────────┤
│ 1.7081.0 │ Feb 8     │ Bump dependencies                       │ ci-bot   │
├──────────┼───────────┼─────────────────────────────────────────┼──────────┤
│ 1.7080.0 │ Feb 5     │ Fix attendance count for recurring      │ maorye   │
├──────────┼───────────┼─────────────────────────────────────────┼──────────┤
│ 1.7079.0 │ Feb 2     │ Add useDataLocality feature toggle      │ orst     │
└──────────┴───────────┴─────────────────────────────────────────┴──────────┘

⚠ v1.7082.0 deployed Feb 11 — gradual rollout completed by 13:47 UTC`,
            durationMs: 1100,
          },
        ],
        finding: 'Alert from #bookings-urgent at 10:45 AM. Service owned by bookings-core (maorye@wix.com). Last deploy: v1.7082.0 on Feb 11 by orst — "Added validation to reject slot booking for course service".',
        severity: 'warning',
      },
      {
        id: makeId(),
        title: 'Metrics & Logs — Measuring the blast radius',
        description: 'Querying Prometheus for error rates and latency, pulling error logs, and finding database bindings',
        status: 'pending',
        thinkingText: 'I have the ownership and deployment context. Now I need hard numbers — what does Prometheus say about error rates and latency? What do the logs show? And which database does this service talk to?',
        toolCalls: [
          {
            tool: 'prometheus',
            label: 'Query error rates — gRPC status by method (1h)',
            input: `query_prometheus(expr: "sum by (rpc_method, grpc_status)(increase(rpc_server_duration_count{artifact_id=\\"bookings-attendance\\", grpc_status!=\\"OK\\"}[1h]))")`,
            output: `gRPC Error Rate (last 1h):
┌────────────────────┬─────────────────────┬──────────┐
│ Method             │ Status              │ Count    │
├────────────────────┼─────────────────────┼──────────┤
│ DeleteAttendance   │ DEADLINE_EXCEEDED   │ 1,847    │
│ DeleteAttendance   │ INTERNAL            │ 23       │
│ GetAttendance      │ OK                  │ normal   │
│ SetAttendance      │ OK                  │ normal   │
└────────────────────┴─────────────────────┴──────────┘

⚠ DeleteAttendance: 4.2% error rate (baseline: 0.1%)
✓ Other endpoints: normal, no spike`,
            durationMs: 1400,
          },
          {
            tool: 'prometheus',
            label: 'Query P95 latency — all methods (5m rate)',
            input: `query_prometheus(expr: "histogram_quantile(0.95, sum by (rpc_method, le)(rate(rpc_server_duration_bucket{artifact_id=\\"bookings-attendance\\"}[5m])))")`,
            output: `P95 Latency:
┌────────────────────┬──────────┬───────────┬──────────┐
│ Method             │ Current  │ Baseline  │ Status   │
├────────────────────┼──────────┼───────────┼──────────┤
│ DeleteAttendance   │ 8.5s     │ ~120ms    │ 🔴 70x  │
│ GetAttendance      │ 45ms     │ ~40ms     │ ✓ OK    │
│ SetAttendance      │ 89ms     │ ~80ms     │ ✓ OK    │
│ ListAttendance     │ 110ms    │ ~95ms     │ ✓ OK    │
└────────────────────┴──────────┴───────────┴──────────┘

🔴 DeleteAttendance: 8.5s P95 — 70x degradation from baseline`,
            durationMs: 1600,
          },
          {
            tool: 'app_logs',
            label: 'Query ERROR logs — last 7 hours',
            input: `query_app_logs(sql: "SELECT timestamp, level, message, caller, error_class, stack_trace FROM app_logs WHERE artifact_id = 'bookings-attendance' AND level = 'ERROR' ORDER BY timestamp DESC LIMIT 50", fromTime: "2026-02-17T08:00:00Z", toTime: "2026-02-17T15:00:00Z")`,
            output: `Found 847 ERROR entries (last 7h):

Repeated pattern (98% of errors):
  ERROR | caller=grpc-handler
  error_class: DeadlineExceededException
  message: "Query execution exceeded 5000ms on attendance table"
  stack_trace:
    → deleteBySessionId
    → SDL.delete
    → MySQL timeout (5000ms)

Frequency: ~120 errors/hour, started spiking at 07:23 UTC`,
            durationMs: 2100,
          },
          {
            tool: 'database',
            label: 'List database bindings',
            input: 'list_bindings(artifactId: "com.wixpress.bookings.attendance.bookings-attendance")',
            output: `Database Bindings:
┌──────────────────────┬────────────────┬─────────┬──────────┐
│ Cluster              │ Database       │ Engine  │ Access   │
├──────────────────────┼────────────────┼─────────┼──────────┤
│ bookings_platform    │ attendance     │ MySQL   │ SDL      │
└──────────────────────┴────────────────┴─────────┴──────────┘

Owner: bookings-core
Service: SDL (Structured Data Layer)`,
            durationMs: 780,
          },
        ],
        finding: 'DeleteAttendance is the only affected endpoint — 8.5s P95 latency (70x degradation), 4.2% error rate. Logs show "Query execution exceeded 5000ms" with stack trace pointing to SDL.delete → MySQL timeout. Database: bookings_platform.attendance (MySQL).',
        severity: 'critical',
      },
      {
        id: makeId(),
        title: 'Database Deep Dive — Finding the slow query',
        description: 'Analyzing table sizes, schema, and indexes to understand why the delete query is slow',
        status: 'pending',
        thinkingText: 'The smoking gun is a slow MySQL query in the attendance table. I need to check the table sizes, schema definition, and indexes. If the delete is doing a full table scan on a large table, that would explain the 8.5s latency perfectly.',
        toolCalls: [
          {
            tool: 'database',
            label: 'List tables — bookings_platform.attendance',
            input: 'list_cluster_tables(clusterName: "bookings_platform", dbName: "attendance")',
            output: `Tables in bookings_platform.attendance:
┌─────────────────────────┬─────────────┬───────────┐
│ Table                   │ Rows        │ Size      │
├─────────────────────────┼─────────────┼───────────┤
│ attendance              │ 27,531,842  │ 21.2 GB   │
│ attendance_platform     │ 40,377,394  │ 29.2 GB   │
└─────────────────────────┴─────────────┴───────────┘

⚠ attendance_platform: 40M rows / 29.2 GB — active table`,
            durationMs: 950,
          },
          {
            tool: 'database',
            label: 'Schema analysis — attendance_platform',
            input: 'get_schema_analysis(clusterName: "bookings_platform", dbName: "attendance")',
            output: `Table: attendance_platform

Primary Key: (tenant_id, entity_id)

Indexes:
  bookingId_idx    → (tenant_id, bookingId)
  sessionId_h_idx  → (tenant_id, sessionId_h)     ← hash-based!
  eventId_h_idx    → (tenant_id, eventId_h)

Column Details:
  sessionId stored as HashedString:
    ├── sessionId.s  → raw string value
    └── sessionId.h  → integer hash (used by index!)

⚠ Key insight: sessionId_h_idx indexes the HASH (int),
  NOT the raw string. If delete filters on sessionId.s
  instead of sessionId.h — the index can't be used.`,
            durationMs: 1200,
          },
        ],
        finding: 'attendance_platform table has 40M rows (29.2 GB). sessionId is stored as HashedString — the index uses sessionId_h (integer hash), NOT the raw string. If the delete query filters by sessionId.s, it bypasses the index entirely.',
        severity: 'critical',
      },
      {
        id: makeId(),
        title: 'EXPLAIN Proof — Full table scan confirmed',
        description: 'Running EXPLAIN on both query patterns to prove the index bypass hypothesis',
        status: 'pending',
        thinkingText: 'I have a strong hypothesis: the new code path is filtering by the raw sessionId string instead of the hash integer. Let me prove this with EXPLAIN on both patterns — the indexed path vs the suspected broken path.',
        toolCalls: [
          {
            tool: 'database',
            label: 'EXPLAIN — indexed path (sessionId_h)',
            input: `explain_sql_query(query: "SELECT entity_id FROM attendance_platform WHERE tenant_id = 0x00000000000000000000000000000001 AND sessionId_h = 12345 LIMIT 100")`,
            output: `EXPLAIN — Indexed Query ✓
┌─────────────┬──────────────────┬───────────┬──────┐
│ Access Type │ Key Used         │ Rows Est. │ Cost │
├─────────────┼──────────────────┼───────────┼──────┤
│ ref         │ sessionId_h_idx  │ 1         │ 0.35 │
└─────────────┴──────────────────┴───────────┴──────┘

✓ Uses sessionId_h_idx → scans ~1 row → cost 0.35
✓ This is the correct, fast path`,
            durationMs: 1800,
          },
          {
            tool: 'database',
            label: 'EXPLAIN — broken path (raw sessionId string)',
            input: `explain_sql_query(query: "SELECT entity_id FROM attendance_platform WHERE JSON_UNQUOTE(JSON_EXTRACT(entity, '$.sessionId.s')) = 'some-session-id-string' LIMIT 100")`,
            output: `EXPLAIN — Unindexed Query 🔴
┌─────────────┬──────────────────┬──────────────┬───────────┐
│ Access Type │ Key Used         │ Rows Scanned │ Cost      │
├─────────────┼──────────────────┼──────────────┼───────────┤
│ ALL         │ (none)           │ 40,377,394   │ 4,930,313 │
└─────────────┴──────────────────┴──────────────┴───────────┘

🔴 FULL TABLE SCAN — 40M rows, reading ~29 GB
🔴 No index can be used on JSON_EXTRACT expression
🔴 Estimated cost: 4,930,313 (vs 0.35 for indexed path)

This is 14 MILLION times more expensive than the indexed query.`,
            durationMs: 2200,
          },
        ],
        finding: 'EXPLAIN confirms the hypothesis. Indexed path: 1 row, cost 0.35. Broken path: 40M rows full table scan, cost 4.9M. That\'s 14 MILLION times more expensive — explains the 8.5s latency perfectly.',
        severity: 'critical',
      },
      {
        id: makeId(),
        title: 'Root Cause Confirmation — Finding the offending code',
        description: 'Searching recent commits and source code to find exactly where the query regressed',
        status: 'pending',
        thinkingText: 'I have the database proof. Now I need to confirm in the source code — which commit introduced the broken query path? The Feb 11 deployment (v1.7082.0) is the prime suspect. Let me find the exact code change.',
        toolCalls: [
          {
            tool: 'git',
            label: 'Find commits — scheduler repo (Feb 1–17)',
            input: 'find_commits_by_date_range(repository: "wix-private/scheduler.git", branch: "master", from: "2026-02-01", to: "2026-02-17", limit: 10)',
            output: `Recent commits to scheduler/bookings-attendance:

d0398f8  Feb 17  "align categories docs" (Omer M.)
a1b2c3d  Feb 11  "Added validation to reject slot booking for
                  course service with a feature toggle" (orst)
                  ← THIS IS v1.7082.0
9f8e7d6  Feb 8   "Bump dependencies" (ci-bot)
5c4b3a2  Feb 5   "Fix attendance count for recurring" (maorye)
1a2b3c4  Feb 2   "Add useDataLocality feature toggle" (orst)`,
            durationMs: 1400,
          },
          {
            tool: 'code_search',
            label: 'Search deleteBySessionId implementation',
            input: 'Bash(rg "deleteBySessionId|sessionId" --type scala services/bookings-attendance/)',
            output: `Found in AttendanceDeleteHandler.scala:

  // OLD PATH (before v1.7082.0):
  def deleteBySession(tenantId: UUID, sessionId: String) = {
    val hash = HashedString.hash(sessionId)
    sdlClient.delete(
      "attendance_platform",
      Query.eq("tenant_id", tenantId)
        .and(Query.eq("sessionId_h", hash))  // ✓ Uses hash index
    )
  }

  // NEW PATH (added in v1.7082.0):
  def deleteBySessionForCourse(tenantId: UUID, sessionId: String) = {
    sdlClient.delete(
      "attendance_platform",
      Query.jsonExtract("sessionId.s", sessionId)  // 🔴 Raw string!
        // Missing: .and(Query.eq("tenant_id", tenantId))
        // Missing: hash-based lookup
    )
  }

⚠ New method uses JSON_EXTRACT on raw string — no hash, no tenant_id
  This triggers a full table scan on every call.`,
            durationMs: 2800,
          },
        ],
        finding: 'Found the exact regression in v1.7082.0: new method deleteBySessionForCourse() queries by raw sessionId.s string via JSON_EXTRACT instead of using the hash index. Also missing tenant_id filter — scanning ALL 40M rows across all tenants.',
        severity: 'critical',
      },
    ],
    conclusion: `## Root Cause Identified

**The Feb 11 deployment (v1.7082.0) by orst@wix.com** introduced a new code path \`deleteBySessionForCourse()\` that queries the \`attendance_platform\` table by raw \`sessionId.s\` string instead of using the hash-based index \`sessionId_h_idx\`.

### Evidence Chain

| # | Signal | Finding |
|---|--------|---------|
| 1 | **Deployment** | v1.7082.0 — Feb 11, gradual rollout by orst |
| 2 | **Error spike** | DEADLINE_EXCEEDED on DeleteAttendance, 4.2% error rate |
| 3 | **Latency** | 8.5s P95 — 70x degradation from 120ms baseline |
| 4 | **Logs** | "Query execution exceeded 5000ms on attendance table" |
| 5 | **Schema** | \`sessionId_h_idx(tenant_id, sessionId_h)\` — hash index exists |
| 6 | **EXPLAIN** | Full table scan: 40M rows, cost 4.9M vs indexed: 1 row, cost 0.35 |
| 7 | **Code** | \`deleteBySessionForCourse()\` uses \`JSON_EXTRACT(sessionId.s)\` — bypasses index |

### Immediate Mitigation
Deactivate feature toggle \`useDataLocality\` to disable the new code path. No deployment needed.

### Permanent Fix
\`\`\`scala
// Fix: Use hash-based lookup with tenant_id
def deleteBySessionForCourse(tenantId: UUID, sessionId: String) = {
  val hash = HashedString.hash(sessionId)
  sdlClient.delete(
    "attendance_platform",
    Query.eq("tenant_id", tenantId)
      .and(Query.eq("sessionId_h", hash))
  )
}
\`\`\`

**Impact**: Query cost drops from **4,930,313 → 0.35** (14 million times faster).`,
  },
];

export function getDefaultScenario(): Scenario {
  return scenarios[0];
}

export function matchScenario(_prompt: string): Scenario {
  return scenarios[0];
}
