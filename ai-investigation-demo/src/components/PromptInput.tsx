import { Send, Sparkles, AlertTriangle, Hash } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
}

const ALERT_SCENARIO = {
  channel: '#bookings-urgent',
  title: 'SLO error rate on propertyListing endpoint',
  service: 'bookings-real-estate-webapp',
  detail: 'propertyListing P95 latency spiked to 8.5s (baseline: 120ms). DEADLINE_EXCEEDED errors at 4.2% rate.',
  prompt: 'Alert on #bookings-urgent: High latency on bookings-real-estate-webapp propertyListing endpoint. P95 at 8.5s, DEADLINE_EXCEEDED errors spiking. Investigate root cause.',
};

export function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/20 mb-6">
          <Sparkles size={12} className="text-[var(--color-accent-cyan)]" />
          <span className="text-[11px] font-mono text-[var(--color-accent-cyan)]">AI Investigation Agent</span>
        </div>
        
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 tracking-tight">
          What should I investigate?
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
          Describe a production issue or click the alert below to watch the AI agent
          investigate it step by step using real production tools.
        </p>
      </div>

      <div className="w-full glass-card rounded-2xl p-1 ring-1 ring-[var(--color-border-active)]/20 focus-within:ring-[var(--color-accent-cyan)]/40 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Describe the issue to investigate..."
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/50
            px-4 py-3 resize-none outline-none min-h-[80px] max-h-[200px]"
          rows={3}
        />
        
        <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-border)]/30">
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
            Enter to send, Shift+Enter for new line
          </span>
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-cyan)] text-[var(--color-bg-primary)]
              text-xs font-semibold hover:bg-[var(--color-accent-cyan)]/90 disabled:opacity-30 disabled:cursor-not-allowed
              transition-all active:scale-95"
          >
            <Send size={12} />
            Investigate
          </button>
        </div>
      </div>

      {/* Slack Alert Card */}
      <div className="mt-10 w-full">
        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-3 text-center">
          Incoming Alert
        </p>
        
        <button
          onClick={() => {
            setValue(ALERT_SCENARIO.prompt);
            setTimeout(() => onSubmit(ALERT_SCENARIO.prompt), 300);
          }}
          className="w-full text-left group"
        >
          <div className="rounded-xl border border-[var(--color-accent-red)]/30 bg-[var(--color-accent-red)]/5
            hover:border-[var(--color-accent-red)]/50 hover:bg-[var(--color-accent-red)]/8
            transition-all duration-300 overflow-hidden">
            
            {/* Slack-style header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-accent-red)]/15 bg-[var(--color-accent-red)]/5">
              <div className="w-5 h-5 rounded bg-[#4A154B] flex items-center justify-center">
                <Hash size={11} className="text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--color-accent-red)]">
                {ALERT_SCENARIO.channel}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Today at 10:45 AM</span>
            </div>

            {/* Alert body */}
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-red)]/15 border border-[var(--color-accent-red)]/25
                  flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={15} className="text-[var(--color-accent-red)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                    {ALERT_SCENARIO.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">
                    Service: <span className="font-mono text-[var(--color-text-secondary)]">{ALERT_SCENARIO.service}</span>
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {ALERT_SCENARIO.detail}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/25
                  text-[11px] font-semibold text-[var(--color-accent-cyan)]
                  group-hover:bg-[var(--color-accent-cyan)]/15 transition-colors">
                  <Sparkles size={11} />
                  Investigate with AI Agent
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
