import { useRef, useEffect } from 'react';
import { RotateCcw, Sparkles, MessageSquare } from 'lucide-react';
import { PromptInput } from './components/PromptInput';
import { InvestigationStepCard } from './components/InvestigationStep';
import { ConclusionPanel } from './components/ConclusionPanel';
import { ToolsSidebar } from './components/ToolsSidebar';
import { ProgressHeader } from './components/ProgressHeader';
import { useInvestigation } from './hooks/useInvestigation';

function App() {
  const { investigation, animation, elapsedTime, startInvestigation, reset } =
    useInvestigation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [animation.currentStepIndex, animation.visibleToolCallsPerStep, investigation.conclusion]);

  if (investigation.status === 'idle') {
    return <PromptInput onSubmit={startInvestigation} disabled={false} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--color-accent-cyan)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              AI Investigation Agent
            </span>
          </div>
          <span className="text-[var(--color-text-muted)]">|</span>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            {investigation.status === 'running' ? 'Investigating' : 'Complete'}
          </span>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)]
            hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={12} />
          New Investigation
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <ProgressHeader investigation={investigation} elapsedTime={elapsedTime} />
          
          {/* Prompt display */}
          <div className="px-5 py-4 border-b border-[var(--color-border)]/30">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-purple)]/10 border border-[var(--color-accent-purple)]/20
                flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare size={13} className="text-[var(--color-accent-purple)]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                  Investigation Prompt
                </span>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5 leading-relaxed">
                  {investigation.prompt}
                </p>
              </div>
            </div>
          </div>

          {/* Steps scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {investigation.steps.map((step, index) => {
              if (index > animation.currentStepIndex && step.status === 'pending') {
                return null;
              }
              return (
                <InvestigationStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={index === animation.currentStepIndex}
                  visibleToolCalls={animation.visibleToolCallsPerStep[step.id] || 0}
                  showFinding={animation.showFindingPerStep[step.id] || false}
                  showThinking={animation.showThinkingPerStep[step.id] || false}
                />
              );
            })}

            {investigation.conclusion && (
              <ConclusionPanel conclusion={investigation.conclusion} />
            )}

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </div>

        {/* Right Sidebar — Tools */}
        <div className="w-96 border-l border-[var(--color-border)]/50 bg-[var(--color-bg-secondary)]/30 shrink-0 hidden lg:block">
          <ToolsSidebar
            steps={investigation.steps}
            currentStepIndex={animation.currentStepIndex}
            visibleToolCallsPerStep={animation.visibleToolCallsPerStep}
            showThinkingPerStep={animation.showThinkingPerStep}
            investigationStatus={investigation.status}
            elapsedTime={elapsedTime}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
