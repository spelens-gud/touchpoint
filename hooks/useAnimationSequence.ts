import { useState, useEffect, useCallback, useRef } from 'react';
import type { AnimationSequenceState, ColumnPhase } from '../types';

const BOOT_SESSION_KEY = 'touchpoint:bootSeen:v1';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function useAnimationSequence(): AnimationSequenceState {
  const [isLoading, setIsLoading] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [linesAnimated, setLinesAnimated] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [leftPanelAnimated, setLeftPanelAnimated] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [leversVisible, setLeversVisible] = useState(false);
  const [columnPhase, setColumnPhase] = useState<ColumnPhase>('idle');

  // Vertical line pulse animation states
  const [pulsingNormalIndices, setPulsingNormalIndices] = useState(null);
  const [pulsingReverseIndices, setPulsingReverseIndices] = useState(null);
  const sequenceTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearSequenceTimers = useCallback(() => {
    sequenceTimersRef.current.forEach(clearTimeout);
    sequenceTimersRef.current = [];
  }, []);

  useEffect(() => clearSequenceTimers, [clearSequenceTimers]);

  const handleLoadingComplete = useCallback(() => {
    clearSequenceTimers();
    setIsLoading(false);
    setMainVisible(true);

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const reducedMotion = prefersReducedMotion();
    const returningVisitor = typeof window !== 'undefined' && window.sessionStorage.getItem(BOOT_SESSION_KEY) === '1';

    if (reducedMotion) {
      setLeftPanelAnimated(true);
      setLeversVisible(true);
      setLinesAnimated(true);
      setHudVisible(true);
      setTextVisible(true);
      setAnimationsComplete(true);
      return;
    }

    const scale = returningVisitor ? (isMobile ? 0.75 : 0.45) : 1;
    const schedule = (callback: () => void, delay: number) => {
      const id = setTimeout(callback, Math.round(delay * scale));
      sequenceTimersRef.current.push(id);
    };

    if (isMobile) {
      schedule(() => { setLeftPanelAnimated(true); }, 100);
      schedule(() => { setLeversVisible(true); }, 300);
      schedule(() => { setLinesAnimated(true); }, 200);
      schedule(() => { setHudVisible(true); }, 400);
      schedule(() => { setTextVisible(true); }, 500);
      schedule(() => { setAnimationsComplete(true); }, 1200);
    } else {
      schedule(() => { setLeftPanelAnimated(true); }, 120);
      schedule(() => { setLeversVisible(true); }, 620);
      schedule(() => { setLinesAnimated(true); }, 650);
      schedule(() => { setHudVisible(true); }, 1050);
      schedule(() => { setTextVisible(true); }, 1300);
      schedule(() => { setAnimationsComplete(true); }, 2400);
    }
  }, [clearSequenceTimers]);

  // Vertical line pulse animation
  useEffect(() => {
    let pulseIntervalId = null;
    let pulseTimeoutIds = [];

    if (animationsComplete) {
      const staggerDelay = 200;
      const animationDuration = 2000;

      pulseIntervalId = setInterval(() => {
        pulseTimeoutIds.forEach(clearTimeout);
        pulseTimeoutIds = [];
        setPulsingNormalIndices(null);
        setPulsingReverseIndices(null);

        const indices = [];
        while (indices.length < 3) {
          const randomIndex = Math.floor(Math.random() * 6);
          if (!indices.includes(randomIndex)) {
            indices.push(randomIndex);
          }
        }

        const timeoutId1 = setTimeout(() => {
          setPulsingNormalIndices([indices[0]]);
          setPulsingReverseIndices(null);
        }, 0);
        pulseTimeoutIds.push(timeoutId1);

        const timeoutId2 = setTimeout(() => {
          setPulsingNormalIndices(prev => (prev ? [...prev, indices[1]] : [indices[1]]));
        }, staggerDelay);
        pulseTimeoutIds.push(timeoutId2);

        const timeoutId3 = setTimeout(() => {
          setPulsingReverseIndices([indices[2]]);
        }, staggerDelay * 2);
        pulseTimeoutIds.push(timeoutId3);

        const resetTimeoutId = setTimeout(() => {
          setPulsingNormalIndices(null);
          setPulsingReverseIndices(null);
          pulseTimeoutIds = [];
        }, staggerDelay * 2 + animationDuration);
        pulseTimeoutIds.push(resetTimeoutId);

      }, 2000 + staggerDelay * 2);
    }

    return () => {
      if (pulseIntervalId) clearInterval(pulseIntervalId);
      pulseTimeoutIds.forEach(clearTimeout);
    };
  }, [animationsComplete]);

  const retractColumns = useCallback((onComplete: () => void) => {
    setAnimationsComplete(false);
    setPulsingNormalIndices(null);
    setPulsingReverseIndices(null);
    setColumnPhase('retracting');

    if (prefersReducedMotion()) {
      setLinesAnimated(false);
      setColumnPhase('idle');
      onComplete();
      return;
    }

    setTimeout(() => {
      setLinesAnimated(false);
      setColumnPhase('idle');
      onComplete();
    }, 450);
  }, []);

  const expandColumns = useCallback((onComplete?: () => void) => {
    setColumnPhase('expanding');

    if (prefersReducedMotion()) {
      setLinesAnimated(true);
      setHudVisible(true);
      setTextVisible(true);
      setAnimationsComplete(true);
      setColumnPhase('idle');
      onComplete?.();
      return;
    }

    setTimeout(() => setLinesAnimated(true), 30);
    setTimeout(() => setHudVisible(true), 250);
    setTimeout(() => setTextVisible(true), 300);
    setTimeout(() => {
      setAnimationsComplete(true);
      setColumnPhase('idle');
      onComplete?.();
    }, 800);
  }, []);

  return {
    isLoading,
    mainVisible,
    linesAnimated,
    hudVisible,
    leftPanelAnimated,
    textVisible,
    animationsComplete,
    leversVisible,
    pulsingNormalIndices,
    pulsingReverseIndices,
    handleLoadingComplete,
    columnPhase,
    retractColumns,
    expandColumns,
  };
}
