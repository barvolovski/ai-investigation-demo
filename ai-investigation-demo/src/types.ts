export type ToolType =
  | 'slack'
  | 'service_registry'
  | 'deployments'
  | 'prometheus'
  | 'app_logs'
  | 'database'
  | 'git'
  | 'code_search'
  | 'reasoning';

export interface ToolCall {
  tool: ToolType;
  label: string;
  input: string;
  output: string;
  durationMs: number;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface InvestigationStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  toolCalls: ToolCall[];
  finding?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  thinkingText?: string;
}

export interface Investigation {
  id: string;
  prompt: string;
  status: 'idle' | 'running' | 'completed';
  steps: InvestigationStep[];
  conclusion?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ToolMetaEntry {
  icon: string;
  color: string;
  label: string;
  description: string;
  subTools: string[];
}

export const TOOL_META: Record<ToolType, ToolMetaEntry> = {
  slack: {
    icon: 'MessageSquare',
    color: '#e01e5a',
    label: 'Slack',
    description: 'Read alerts, messages, and threads from Slack channels',
    subTools: ['Find Channel', 'Read Messages', 'Thread Search', 'Alert History'],
  },
  service_registry: {
    icon: 'Building',
    color: '#8b5cf6',
    label: 'Service Registry',
    description: 'Query service ownership, team contacts, and topology',
    subTools: ['Get Ownership', 'Team Contacts', 'Service Topology', 'On-call Schedule'],
  },
  deployments: {
    icon: 'Rocket',
    color: '#f59e0b',
    label: 'Deployments',
    description: 'Rollout history, version diffs, and deployment status',
    subTools: ['Rollout History', 'Version Diff', 'Rollback Status', 'Feature Toggles'],
  },
  prometheus: {
    icon: 'Activity',
    color: '#ef4444',
    label: 'Prometheus',
    description: 'Query production metrics — error rates, latency, throughput',
    subTools: ['Error Rate Query', 'Latency Percentiles', 'Rate Aggregation', 'Histogram Quantile'],
  },
  app_logs: {
    icon: 'ScrollText',
    color: '#10b981',
    label: 'App Logs',
    description: 'Search structured application logs and stack traces',
    subTools: ['SQL Log Query', 'Error Aggregation', 'Stack Trace Decoder', 'Time-range Filter'],
  },
  database: {
    icon: 'Database',
    color: '#06b6d4',
    label: 'Database Inspector',
    description: 'Explore schemas, table sizes, indexes, and run EXPLAIN',
    subTools: ['List Bindings', 'Table Sizes', 'Schema Analysis', 'EXPLAIN Query', 'Index Analysis'],
  },
  git: {
    icon: 'GitCommit',
    color: '#a855f7',
    label: 'Git History',
    description: 'Browse commits, diffs, blame, and branch history',
    subTools: ['Find Commits', 'Diff Viewer', 'Blame Analysis', 'Branch Compare'],
  },
  code_search: {
    icon: 'Search',
    color: '#3b82f6',
    label: 'Code Search',
    description: 'Search source code across all repositories',
    subTools: ['Regex Search', 'Symbol Lookup', 'Cross-repo References', 'File Contents'],
  },
  reasoning: {
    icon: 'Brain',
    color: '#64748b',
    label: 'Reasoning',
    description: 'Internal analysis, hypothesis building, and evidence correlation',
    subTools: ['Hypothesis Builder', 'Evidence Correlation', 'Root Cause Ranking'],
  },
};
