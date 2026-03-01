import { useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare, Building2, Rocket, Activity, ScrollText,
  Database, GitCommit, Search, Brain,
  Loader2, CheckCircle2, Clock,
} from 'lucide-react';
import type { ToolType, ToolCall, InvestigationStep } from '../types';
import { TOOL_META } from '../types';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  MessageSquare, Building: Building2, Rocket, Activity, ScrollText,
  Database, GitCommit, Search, Brain,
};

interface ToolsSidebarProps {
  steps: InvestigationStep[];
  currentStepIndex: number;
  visibleToolCallsPerStep: Record<string, number>;
  showThinkingPerStep: Record<string, boolean>;
  investigationStatus: 'idle' | 'running' | 'completed';
  elapsedTime: number;
}

interface TimelineEntry {
  toolCall: ToolCall;
  isCurrent: boolean;
}

export function ToolsSidebar({
  steps,
  currentStepIndex,
  visibleToolCallsPerStep,
  showThinkingPerStep,
  investigationStatus,
  elapsedTime,
}: ToolsSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length
    ? steps[currentStepIndex] : null;

  const isThinking = currentStep
    ? showThinkingPerStep[currentStep.id] && (visibleToolCallsPerStep[currentStep.id] || 0) === 0
    : false;

  const currentVisibleCount = currentStep
    ? visibleToolCallsPerStep[currentStep.id] || 0 : 0;

  const currentToolCall = currentStep && currentVisibleCount > 0
    ? currentStep.toolCalls[currentVisibleCount - 1] : null;

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
      const step = steps[i];
      const visible = visibleToolCallsPerStep[step.id] || 0;
      for (let j = 0; j < visible && j < step.toolCalls.length; j++) {
        const isLatest = i === currentStepIndex && j === visible - 1;
        entries.push({
          toolCall: step.toolCalls[j],
          isCurrent: isLatest && investigationStatus === 'running',
        });
      }
    }
    return entries;
  }, [steps, currentStepIndex, visibleToolCallsPerStep, investigationStatus]);

  const usedTools = useMemo(() => {
    const map = new Map<ToolType, { count: number; lastLabel: string }>();
    for (const entry of timeline) {
      const prev = map.get(entry.toolCall.tool);
      map.set(entry.toolCall.tool, {
        count: (prev?.count || 0) + 1,
        lastLabel: entry.toolCall.label,
      });
    }
    return map;
  }, [timeline]);

  const isRunning = investigationStatus === 'running';
  const isComplete = investigationStatus === 'completed';

  useEffect(() => {
    if (!scrollRef.current || !currentToolCall) return;
    const activeEl = scrollRef.current.querySelector('[data-tool-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentToolCall]);

  const productionTools = (Object.entries(TOOL_META) as [ToolType, typeof TOOL_META[ToolType]][])
    .filter(([type]) => type !== 'reasoning');

  return (
    <div className="h-full flex flex-col">
      {/* ── LIVE BANNER ── */}
      <div className="px-5 py-3 border-b border-[var(--color-border)]/50 shrink-0">
        {isRunning && currentStep ? (
          <div className="flex items-center gap-3">
            <div className="live-dot shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent-cyan)]">
                Step {currentStepIndex + 1}/{steps.length}
              </div>
              <p className="text-xs text-[var(--color-text-primary)] font-semibold truncate mt-0.5">
                {currentStep.title}
              </p>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0">
              {formatTime(elapsedTime)}
            </span>
          </div>
        ) : isComplete ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-[var(--color-accent-green)] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent-green)]">
                Complete
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                {steps.length} steps · {timeline.length} tool calls · {formatTime(elapsedTime)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
            Initializing agent...
          </div>
        )}
      </div>

      {/* ── TOOLS — MAIN CONTENT ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {productionTools.map(([type, meta]) => {
          const usage = usedTools.get(type);
          const count = usage?.count || 0;
          const isActive = count > 0;
          const isCurrent = currentToolCall?.tool === type && isRunning;
          const Icon = iconMap[meta.icon];

          return (
            <div
              key={type}
              data-tool-active={isCurrent ? 'true' : undefined}
              className={`tool-card rounded-xl transition-all duration-500 overflow-hidden
                ${isCurrent ? 'tool-card-executing' : ''}
                ${isActive && !isCurrent ? 'tool-card-used' : ''}
                ${!isActive ? 'tool-card-idle' : ''}`}
              style={{
                '--tool-color': meta.color,
                borderColor: isCurrent ? meta.color + '50' : isActive ? meta.color + '25' : 'transparent',
              } as React.CSSProperties}
            >
              {/* Header row */}
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Big icon */}
                <div
                  className="tool-icon-box w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${meta.color}25, ${meta.color}10)`
                      : `${meta.color}08`,
                    border: `1.5px solid ${isActive ? meta.color + '50' : meta.color + '15'}`,
                    boxShadow: isCurrent
                      ? `0 0 20px ${meta.color}30, inset 0 0 12px ${meta.color}10`
                      : isActive ? `0 0 8px ${meta.color}10` : 'none',
                  }}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      style={{
                        color: meta.color,
                        opacity: isActive ? 1 : 0.35,
                        filter: isCurrent ? `drop-shadow(0 0 6px ${meta.color})` : 'none',
                      }}
                    />
                  )}
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold transition-colors duration-300
                      ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]/60'}`}>
                      {meta.label}
                    </span>
                    {isCurrent && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin" style={{ color: meta.color }} />
                        <span className="live-dot-sm" />
                      </div>
                    )}
                    {count > 0 && !isCurrent && (
                      <span
                        className="text-[10px] font-mono font-bold rounded-full px-2 py-0.5"
                        style={{
                          background: `${meta.color}20`,
                          color: meta.color,
                        }}
                      >
                        {count}×
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed mt-0.5 transition-colors duration-300
                    ${isActive ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]/40'}`}>
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Sub-tools row */}
              <div className={`px-4 pb-3 flex flex-wrap gap-1.5 transition-opacity duration-500
                ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                {meta.subTools.map((sub, i) => (
                  <span
                    key={i}
                    className="subtool-chip text-[9px] font-mono px-2 py-1 rounded-md transition-all duration-300"
                    style={{
                      background: isActive ? `${meta.color}12` : `${meta.color}05`,
                      color: isActive ? meta.color : `${meta.color}60`,
                      border: `1px solid ${isActive ? meta.color + '25' : meta.color + '10'}`,
                    }}
                  >
                    {sub}
                  </span>
                ))}
              </div>

              {/* Currently executing: show what it's doing */}
              {isCurrent && currentToolCall && (
                <div
                  className="mx-4 mb-3 px-3 py-2 rounded-lg animate-fade-in"
                  style={{
                    background: `linear-gradient(135deg, ${meta.color}08, transparent)`,
                    border: `1px solid ${meta.color}20`,
                  }}
                >
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: meta.color }}>
                    Now executing
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    {currentToolCall.label}
                  </p>
                </div>
              )}

              {/* Last usage label (when completed, not current) */}
              {isActive && !isCurrent && usage?.lastLabel && (
                <div className="mx-4 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={10} style={{ color: meta.color }} className="shrink-0 opacity-60" />
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                    {usage.lastLabel}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Reasoning card (separate since it's not a "production tool") */}
        {(() => {
          const meta = TOOL_META.reasoning;
          const Icon = iconMap[meta.icon];
          return (
            <div
              className={`tool-card rounded-xl transition-all duration-500 overflow-hidden
                ${isThinking ? 'tool-card-executing' : 'tool-card-idle'}`}
              style={{
                '--tool-color': meta.color,
                borderColor: isThinking ? meta.color + '40' : 'transparent',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isThinking ? `${meta.color}20` : `${meta.color}08`,
                    border: `1.5px solid ${isThinking ? meta.color + '40' : meta.color + '15'}`,
                  }}
                >
                  {Icon && <Icon size={16} style={{ color: meta.color, opacity: isThinking ? 1 : 0.35 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isThinking ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]/50'}`}>
                      Reasoning Engine
                    </span>
                    {isThinking && <span className="live-dot-sm" />}
                  </div>
                  {isThinking && currentStep?.thinkingText && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-relaxed line-clamp-2 italic">
                      {currentStep.thinkingText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── STATS FOOTER ── */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border)]/50 bg-[var(--color-bg-secondary)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-lg font-bold font-mono text-[var(--color-accent-cyan)]">{usedTools.size}</span>
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] ml-1 uppercase">tools</span>
            </div>
            <div>
              <span className="text-lg font-bold font-mono text-[var(--color-accent-green)]">{timeline.length}</span>
              <span className="text-[9px] font-mono text-[var(--color-text-muted)] ml-1 uppercase">calls</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
            <Clock size={10} />
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
