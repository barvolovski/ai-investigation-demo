import { Clock, Zap } from 'lucide-react';
import type { Investigation } from '../types';

interface ProgressHeaderProps {
  investigation: Investigation;
  elapsedTime: number;
}

export function ProgressHeader({ investigation, elapsedTime }: ProgressHeaderProps) {
  const totalSteps = investigation.steps.length;
  const completedSteps = investigation.steps.filter(s => s.status === 'completed').length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isComplete = investigation.status === 'completed';

  return (
    <div className="px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-bg-secondary)]/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-mono ${
            isComplete ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-cyan)]'
          }`}>
            <Zap size={12} />
            {isComplete ? 'Investigation Complete' : 'Investigating...'}
          </div>
          
          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
            {completedSteps}/{totalSteps} steps
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
          <Clock size={11} />
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div className="h-1 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isComplete 
              ? 'bg-gradient-to-r from-[var(--color-accent-green)] to-[var(--color-accent-cyan)]'
              : 'bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-cyan)]'
          }`}
          style={{ width: `${progress}%` }}
        />
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
