import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Terminal } from 'lucide-react';
import type { ToolCall } from '../types';
import { ToolBadge } from './ToolBadge';

interface ToolCallCardProps {
  toolCall: ToolCall;
  index: number;
  animated: boolean;
}

export function ToolCallCard({ toolCall, index, animated }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 
        overflow-hidden transition-all duration-300 hover:border-[var(--color-border-active)]/30
        ${animated ? 'animate-slide-up' : ''}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="text-[var(--color-text-muted)]">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        
        <ToolBadge tool={toolCall.tool} size="sm" />
        
        <span className="flex-1 text-sm text-[var(--color-text-secondary)] truncate">
          {toolCall.label}
        </span>
        
        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] font-mono">
          <Clock size={10} />
          {(toolCall.durationMs / 1000).toFixed(1)}s
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)]/50 animate-fade-in">
          <div className="px-4 py-2 bg-[var(--color-bg-primary)]/40">
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal size={10} className="text-[var(--color-accent-cyan)]" />
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                Input
              </span>
            </div>
            <pre className="text-xs font-mono text-[var(--color-accent-cyan)]/80 whitespace-pre-wrap leading-relaxed">
              {toolCall.input}
            </pre>
          </div>
          
          <div className="px-4 py-2 bg-[var(--color-bg-primary)]/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal size={10} className="text-[var(--color-accent-green)]" />
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                Output
              </span>
            </div>
            <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
              {toolCall.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
