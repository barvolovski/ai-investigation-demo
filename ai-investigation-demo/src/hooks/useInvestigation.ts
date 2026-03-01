import { useState, useRef, useCallback, useEffect } from 'react';
import type { Investigation, InvestigationStep } from '../types';
import { matchScenario } from '../scenarios';

interface StepAnimation {
  currentStepIndex: number;
  visibleToolCallsPerStep: Record<string, number>;
  showThinkingPerStep: Record<string, boolean>;
  showFindingPerStep: Record<string, boolean>;
}

export function useInvestigation() {
  const [investigation, setInvestigation] = useState<Investigation>({
    id: '',
    prompt: '',
    status: 'idle',
    steps: [],
  });

  const [animation, setAnimation] = useState<StepAnimation>({
    currentStepIndex: -1,
    visibleToolCallsPerStep: {},
    showThinkingPerStep: {},
    showFindingPerStep: {},
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const animationQueueRef = useRef<(() => void)[]>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current || animationQueueRef.current.length === 0) return;
    processingRef.current = true;
    const next = animationQueueRef.current.shift();
    if (next) next();
  }, []);

  const enqueue = useCallback((fn: () => void, delayMs: number) => {
    animationQueueRef.current.push(() => {
      setTimeout(() => {
        fn();
        processingRef.current = false;
        processQueue();
      }, delayMs);
    });
  }, [processQueue]);

  const startInvestigation = useCallback((prompt: string) => {
    const scenario = matchScenario(prompt);
    const steps: InvestigationStep[] = scenario.steps.map(s => ({
      ...s,
      status: 'pending' as const,
    }));

    const id = Math.random().toString(36).slice(2);
    
    setInvestigation({
      id,
      prompt,
      status: 'running',
      steps,
      startedAt: Date.now(),
    });

    setAnimation({
      currentStepIndex: -1,
      visibleToolCallsPerStep: {},
      showThinkingPerStep: {},
      showFindingPerStep: {},
    });

    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);

    animationQueueRef.current = [];
    processingRef.current = false;

    steps.forEach((step, stepIdx) => {
      // Show thinking
      enqueue(() => {
        setAnimation(prev => ({
          ...prev,
          currentStepIndex: stepIdx,
          showThinkingPerStep: { ...prev.showThinkingPerStep, [step.id]: true },
        }));
        setInvestigation(prev => {
          const newSteps = [...prev.steps];
          newSteps[stepIdx] = { ...newSteps[stepIdx], status: 'running' };
          return { ...prev, steps: newSteps };
        });
      }, stepIdx === 0 ? 600 : 1200);

      // Show tool calls one by one
      step.toolCalls.forEach((_, tcIdx) => {
        enqueue(() => {
          setAnimation(prev => ({
            ...prev,
            visibleToolCallsPerStep: {
              ...prev.visibleToolCallsPerStep,
              [step.id]: tcIdx + 1,
            },
          }));
        }, 800 + Math.random() * 600);
      });

      // Show finding
      enqueue(() => {
        setAnimation(prev => ({
          ...prev,
          showFindingPerStep: { ...prev.showFindingPerStep, [step.id]: true },
        }));
      }, 600);

      // Complete step
      enqueue(() => {
        setInvestigation(prev => {
          const newSteps = [...prev.steps];
          newSteps[stepIdx] = { ...newSteps[stepIdx], status: 'completed' };
          return { ...prev, steps: newSteps };
        });
      }, 400);
    });

    // Show conclusion
    enqueue(() => {
      setInvestigation(prev => ({
        ...prev,
        status: 'completed',
        conclusion: scenario.conclusion,
        completedAt: Date.now(),
      }));
      if (timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    setTimeout(processQueue, 300);
  }, [enqueue, processQueue]);

  const reset = useCallback(() => {
    animationQueueRef.current = [];
    processingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    setInvestigation({
      id: '',
      prompt: '',
      status: 'idle',
      steps: [],
    });
    setAnimation({
      currentStepIndex: -1,
      visibleToolCallsPerStep: {},
      showThinkingPerStep: {},
      showFindingPerStep: {},
    });
    setElapsedTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    investigation,
    animation,
    elapsedTime,
    startInvestigation,
    reset,
  };
}
