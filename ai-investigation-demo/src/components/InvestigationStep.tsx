import { CheckCircle2, Loader2, Circle, XCircle, AlertTriangle, Info, Zap, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { InvestigationStep as StepType } from '../types';
import { ToolCallCard } from './ToolCallCard';

const statusConfig = {
  pending: { icon: Circle, color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-text-muted)]/10' },
  running: { icon: Loader2, color: 'text-[var(--color-accent-cyan)]', bg: 'bg-[var(--color-accent-cyan)]/10' },
  completed: { icon: CheckCircle2, color: 'text-[var(--color-accent-green)]', bg: 'bg-[var(--color-accent-green)]/10' },
  failed: { icon: XCircle, color: 'text-[var(--color-accent-red)]', bg: 'bg-[var(--color-accent-red)]/10' },
};

const severityConfig = {
  info: { icon: Info, color: 'text-[var(--color-accent-blue)]', bg: 'bg-[var(--color-accent-blue)]/10', border: 'border-[var(--color-accent-blue)]/20' },
  warning: { icon: AlertTriangle, color: 'text-[var(--color-accent-amber)]', bg: 'bg-[var(--color-accent-amber)]/10', border: 'border-[var(--color-accent-amber)]/20' },
  critical: { icon: Zap, color: 'text-[var(--color-accent-red)]', bg: 'bg-[var(--color-accent-red)]/10', border: 'border-[var(--color-accent-red)]/20' },
  success: { icon: CheckCircle2, color: 'text-[var(--color-accent-green)]', bg: 'bg-[var(--color-accent-green)]/10', border: 'border-[var(--color-accent-green)]/20' },
};

interface InvestigationStepProps {
  step: StepType;
  index: number;
  isActive: boolean;
  visibleToolCalls: number;
  showFinding: boolean;
  showThinking: boolean;
}

export function InvestigationStepCard({
  step,
  index,
  isActive,
  visibleToolCalls,
  showFinding,
  showThinking,
}: InvestigationStepProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sConfig = statusConfig[step.status];
  const StatusIcon = sConfig.icon;

  useEffect(() => {
    if (step.status === 'completed' && !isActive) {
      const timer = setTimeout(() => setCollapsed(true), 800);
      return () => clearTimeout(timer);
    }
  }, [step.status, isActive]);

  return (
    <div
      className={`relative animate-slide-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Connection line to next step */}
      {index > 0 && (
        <div className="absolute -top-4 left-6 w-px h-4 bg-gradient-to-b from-[var(--color-border)] to-[var(--color-border)]/0" />
      )}

      <div
        className={`glass-card rounded-xl overflow-hidden transition-all duration-500
          ${isActive ? 'ring-1 ring-[var(--color-accent-cyan)]/30 shadow-lg shadow-[var(--color-accent-cyan)]/5' : ''}
          ${step.status === 'pending' ? 'opacity-40' : ''}`}
      >
        {/* Step Header */}
        <button
          onClick={() => step.status === 'completed' && setCollapsed(!collapsed)}
          className="w-full flex items-start gap-3 px-5 py-4 text-left group"
        >
          <div className={`mt-0.5 ${sConfig.color} ${step.status === 'running' ? 'animate-spin' : ''}`}>
            <StatusIcon size={18} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                Step {index + 1}
              </span>
              {step.status === 'running' && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-accent-cyan)] animate-pulse-glow">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)]" />
                  investigating
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
              {step.title}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {step.description}
            </p>
          </div>

          {step.status === 'completed' && (
            <div className="text-[var(--color-text-muted)] mt-1">
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </div>
          )}
        </button>

        {/* Thinking bubble */}
        {showThinking && step.thinkingText && (
          <div className="mx-5 mb-3 animate-fade-in">
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-[var(--color-bg-primary)]/60 border border-[var(--color-border)]/30">
              <Brain size={14} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">
                {step.thinkingText}
              </p>
            </div>
          </div>
        )}

        {/* Tool Calls */}
        {!collapsed && (step.status === 'running' || step.status === 'completed') && (
          <div className="px-5 pb-3 space-y-2">
            {step.toolCalls.slice(0, visibleToolCalls).map((tc, i) => (
              <ToolCallCard
                key={i}
                toolCall={tc}
                index={i}
                animated={isActive}
              />
            ))}
          </div>
        )}

        {/* Finding */}
        {showFinding && step.finding && step.severity && (
          <div className="px-5 pb-4 animate-slide-up">
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg ${severityConfig[step.severity].bg} border ${severityConfig[step.severity].border}`}>
              {(() => {
                const SevIcon = severityConfig[step.severity!].icon;
                return <SevIcon size={14} className={`${severityConfig[step.severity!].color} mt-0.5 shrink-0`} />;
              })()}
              <div>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${severityConfig[step.severity].color}`}>
                  Finding
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                  {step.finding}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
