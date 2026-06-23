import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import useAnimationSequence from '../hooks/useAnimationSequence';
import usePowerSystem from '../hooks/usePowerSystem';
import useRealtimeStats from '../hooks/useRealtimeStats';
import useColumnHover from '../hooks/useColumnHover';
import { useFateTypingEffect, useEnvParamsTypingEffect } from '../hooks/useTypingEffect';
import type { AppContextValue, SystemNotice } from '../types';

const AppContext = createContext<AppContextValue | null>(null);
const NOTICE_LIFETIME_MS = 2400;
const MAX_NOTICE_QUEUE = 6;

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const animation = useAnimationSequence();
  const {
    isLoading, mainVisible, linesAnimated, hudVisible,
    leftPanelAnimated, textVisible, animationsComplete, leversVisible,
    pulsingNormalIndices, pulsingReverseIndices, handleLoadingComplete,
    columnPhase, retractColumns, expandColumns,
  } = animation;

  const power = usePowerSystem(mainVisible);
  const {
    powerLevel, isInverted, isTesseractActivated, isDischarging,
    chargeBattery, handleDischargeLeverPull, handleActivateTesseract,
    deactivateTesseract,
  } = power;

  const [systemNotice, setSystemNotice] = useState<SystemNotice | null>(null);
  const [archiveLayerActive, setArchiveLayerActiveState] = useState(false);
  const [commandTerminalOpen, setCommandTerminalOpen] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeQueueRef = useRef<SystemNotice[]>([]);
  const noticeVisibleRef = useRef(false);
  const noticeIdRef = useRef(Date.now());
  const wasInvertedRef = useRef(isInverted);

  const showQueuedNotice = useCallback(() => {
    if (noticeVisibleRef.current) return;

    const nextNotice = noticeQueueRef.current.shift();
    if (!nextNotice) return;

    noticeVisibleRef.current = true;
    setSystemNotice(nextNotice);
    noticeTimerRef.current = setTimeout(() => {
      setSystemNotice(null);
      noticeTimerRef.current = null;
      noticeVisibleRef.current = false;
      showQueuedNotice();
    }, NOTICE_LIFETIME_MS);
  }, []);

  const pushSystemNotice = useCallback((text: string, tone: SystemNotice['tone'] = 'info') => {
    if (noticeQueueRef.current.length >= MAX_NOTICE_QUEUE) {
      noticeQueueRef.current.shift();
    }

    noticeQueueRef.current.push({
      id: noticeIdRef.current++,
      text,
      tone,
    });
    showQueuedNotice();
  }, [showQueuedNotice]);

  const setArchiveLayerActive = useCallback((active: boolean) => {
    let changed = false;
    setArchiveLayerActiveState((current) => {
      changed = current !== active;
      return active;
    });
    if (changed) {
      pushSystemNotice(active ? 'ARCHIVE LAYER EXPOSED' : 'ARCHIVE LAYER SEALED', active ? 'success' : 'info');
    }
  }, [pushSystemNotice]);

  const toggleArchiveLayer = useCallback(() => {
    let next = false;
    setArchiveLayerActiveState((current) => {
      next = !current;
      return next;
    });
    pushSystemNotice(next ? 'ARCHIVE LAYER EXPOSED' : 'ARCHIVE LAYER SEALED', next ? 'success' : 'info');
  }, [pushSystemNotice]);

  const openCommandTerminal = useCallback(() => {
    setCommandTerminalOpen(true);
  }, []);

  const closeCommandTerminal = useCallback(() => {
    setCommandTerminalOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeQueueRef.current = [];
      noticeVisibleRef.current = false;
    };
  }, []);

  const handleActivateTesseractWithNotice = useCallback(() => {
    pushSystemNotice(
      isTesseractActivated ? 'TESSERACT FIELD ALREADY ACTIVE' : 'TESSERACT FIELD DEPLOYED',
      isTesseractActivated ? 'info' : 'success',
    );
    handleActivateTesseract();
  }, [handleActivateTesseract, isTesseractActivated, pushSystemNotice]);

  const handleDischargeLeverPullWithNotice = useCallback(() => {
    if (powerLevel < 100) {
      pushSystemNotice(`DISCHARGE LOCKED // CHARGE ${powerLevel}%`, 'warning');
    } else if (isDischarging) {
      pushSystemNotice('DISCHARGE SEQUENCE RUNNING', 'info');
    } else {
      pushSystemNotice('DISCHARGE SEQUENCE ARMED', 'warning');
      if (!archiveLayerActive) {
        setArchiveLayerActiveState(true);
        pushSystemNotice('ARCHIVE LAYER EXPOSED', 'success');
      }
    }
    handleDischargeLeverPull();
  }, [archiveLayerActive, handleDischargeLeverPull, isDischarging, powerLevel, pushSystemNotice]);

  const deactivateTesseractWithNotice = useCallback(() => {
    if (isTesseractActivated) {
      pushSystemNotice('TESSERACT FIELD STOWED', 'info');
    }
    deactivateTesseract();
  }, [deactivateTesseract, isTesseractActivated, pushSystemNotice]);

  useEffect(() => {
    if (wasInvertedRef.current === isInverted) return;
    wasInvertedRef.current = isInverted;
    pushSystemNotice(isInverted ? 'INVERSION FIELD ONLINE' : 'NORMAL SPECTRUM RESTORED', isInverted ? 'success' : 'info');
  }, [isInverted, pushSystemNotice]);

  const stats = useRealtimeStats();
  const { currentTime, runtime, totalVisits, currentVisitors } = stats;

  const { displayedFateText, isFateTypingActive } = useFateTypingEffect(textVisible);
  const { displayedEnvParams, isEnvParamsTyping, envData, envDataVersion } = useEnvParamsTypingEffect(textVisible);

  const columnHover = useColumnHover();
  const {
    randomHudTexts, branchText1, branchText2, branchText3, branchText4,
    handleColumnMouseEnter, handleColumnMouseLeave,
  } = columnHover;

  const value = useMemo(() => ({
    // Animation
    isLoading, mainVisible, linesAnimated, hudVisible,
    leftPanelAnimated, textVisible, animationsComplete, leversVisible,
    pulsingNormalIndices, pulsingReverseIndices, handleLoadingComplete,
    columnPhase, retractColumns, expandColumns,
    // Power
    powerLevel, isInverted, isTesseractActivated, isDischarging,
    chargeBattery,
    handleDischargeLeverPull: handleDischargeLeverPullWithNotice,
    handleActivateTesseract: handleActivateTesseractWithNotice,
    deactivateTesseract: deactivateTesseractWithNotice,
    systemNotice,
    pushSystemNotice,
    archiveLayerActive,
    setArchiveLayerActive,
    toggleArchiveLayer,
    commandTerminalOpen,
    openCommandTerminal,
    closeCommandTerminal,
    // Stats
    currentTime, runtime, totalVisits, currentVisitors,
    // Typing
    displayedFateText, isFateTypingActive,
    displayedEnvParams, isEnvParamsTyping, envData, envDataVersion,
    // Column hover
    randomHudTexts, branchText1, branchText2, branchText3, branchText4,
    handleColumnMouseEnter, handleColumnMouseLeave,
  }), [
    isLoading, mainVisible, linesAnimated, hudVisible,
    leftPanelAnimated, textVisible, animationsComplete, leversVisible,
    pulsingNormalIndices, pulsingReverseIndices, handleLoadingComplete,
    columnPhase, retractColumns, expandColumns,
    powerLevel, isInverted, isTesseractActivated, isDischarging,
    chargeBattery, handleDischargeLeverPullWithNotice, handleActivateTesseractWithNotice, deactivateTesseractWithNotice,
    systemNotice, pushSystemNotice,
    archiveLayerActive, setArchiveLayerActive, toggleArchiveLayer,
    commandTerminalOpen, openCommandTerminal, closeCommandTerminal,
    currentTime, runtime, totalVisits, currentVisitors,
    displayedFateText, isFateTypingActive,
    displayedEnvParams, isEnvParamsTyping, envData, envDataVersion,
    randomHudTexts, branchText1, branchText2, branchText3, branchText4,
    handleColumnMouseEnter, handleColumnMouseLeave,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
