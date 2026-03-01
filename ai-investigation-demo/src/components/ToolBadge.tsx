import {
  MessageSquare, Building2, Rocket, Activity, ScrollText,
  Database, GitCommit, Search, Brain,
} from 'lucide-react';
import type { ToolType } from '../types';
import { TOOL_META } from '../types';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  MessageSquare, Building: Building2, Rocket, Activity, ScrollText,
  Database, GitCommit, Search, Brain,
};

interface ToolBadgeProps {
  tool: ToolType;
  size?: 'sm' | 'md';
}

export function ToolBadge({ tool, size = 'md' }: ToolBadgeProps) {
  const meta = TOOL_META[tool];
  if (!meta) return <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{tool}</span>;
  const Icon = iconMap[meta.icon];
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium
        ${isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color}15, ${meta.color}08)`,
        border: `1px solid ${meta.color}40`,
        color: meta.color,
      }}
    >
      {Icon && <Icon size={isSmall ? 10 : 12} />}
      {meta.label}
    </span>
  );
}
