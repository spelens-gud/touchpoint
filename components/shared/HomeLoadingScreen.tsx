import React, { useCallback, useEffect, useState, useRef } from 'react';
import styles from '../../styles/HomeLoadingScreen.module.scss';
import gsap from 'gsap';
import { useLoadingSystem } from '../../hooks/useLoadingSystem';
import TerminalConsole, { TerminalConsoleRef } from './LoadingScreen/TerminalConsole';
import IndustrialHud, { IndustrialHudRef } from './LoadingScreen/IndustrialHud';
import LogoTitle, { LogoTitleRef } from './LoadingScreen/LogoTitle';
import SplitTransition, { SplitTransitionRef } from './LoadingScreen/SplitTransition';

const BOOT_SESSION_KEY = 'touchpoint:bootSeen:v1';
const BOOT_COMMANDS = ['whoami', 'status', 'rain', 'help'] as const;
const MAX_BOOT_COMMAND_LENGTH = Math.max(...BOOT_COMMANDS.map(command => command.length));
const POST_BOOT_COMMAND_WINDOW_MS = 4500;
const POST_BOOT_FEEDBACK_MS = 1800;

type BootCommand = typeof BOOT_COMMANDS[number];

const getBootCommandResponse = (command: BootCommand, progress: number) => {
  switch (command) {
    case 'whoami':
      return 'WHOAMI // VISITOR_07 // LOCAL SIGNAL';
    case 'status':
      return `STATUS // BOOT PROGRESS ${Math.floor(progress).toString().padStart(3, ' ')}%`;
    case 'rain':
      return 'RAIN // STATIC CHANNEL OPEN // NO PRECIP DATA';
    case 'help':
      return 'HELP // WHOAMI / STATUS / RAIN / HELP';
    default:
      return 'UNKNOWN COMMAND';
  }
};

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const HomeLoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [visible, setVisible] = useState(true);
  const [startLogging, setStartLogging] = useState(false);
  const [fastBoot, setFastBoot] = useState(false);
  const [bootPreferenceLoaded, setBootPreferenceLoaded] = useState(false);
  const [commandWindowActive, setCommandWindowActive] = useState(true);
  const [postBootFeedback, setPostBootFeedback] = useState<{ text: string; token: number } | null>(null);
  const { progress, logLines, showSplitLines, loading, appendLogLine, skipBoot } = useLoadingSystem(startLogging, { fastBoot });
  
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const progressRef = useRef(progress);
  const commandBufferRef = useRef('');
  const reducedMotionNoticeSentRef = useRef(false);
  const postBootFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DOM refs
  const wastelandBgRef = useRef<HTMLDivElement>(null);
  const loadingScreenRef = useRef<HTMLDivElement>(null);
  const progressAreaRef = useRef<HTMLDivElement>(null);

  // Component refs
  const consoleRef = useRef<TerminalConsoleRef>(null);
  const hudRef = useRef<IndustrialHudRef>(null);
  const logoRef = useRef<LogoTitleRef>(null);
  const splitRef = useRef<SplitTransitionRef>(null);
  const exitStartedRef = useRef(false);

  const handleSkipBoot = useCallback(() => {
    setStartLogging(true);
    skipBoot();
  }, [skipBoot]);

  const showPostBootFeedback = useCallback((text: string) => {
    const token = Date.now();

    if (postBootFeedbackTimerRef.current) {
      clearTimeout(postBootFeedbackTimerRef.current);
    }

    setPostBootFeedback({ text, token });
    postBootFeedbackTimerRef.current = setTimeout(() => {
      setPostBootFeedback((current) => (
        current?.token === token ? null : current
      ));
    }, POST_BOOT_FEEDBACK_MS);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setFastBoot(window.sessionStorage.getItem(BOOT_SESSION_KEY) === '1');
    setBootPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      if (postBootFeedbackTimerRef.current) {
        clearTimeout(postBootFeedbackTimerRef.current);
      }
      if (commandWindowTimerRef.current) {
        clearTimeout(commandWindowTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!startLogging || showSplitLines || reducedMotionNoticeSentRef.current) return;
    if (!prefersReducedMotion()) return;

    reducedMotionNoticeSentRef.current = true;
    appendLogLine('MOTION REDUCED // QUIET MODE ENABLED');
  }, [appendLogLine, showSplitLines, startLogging]);

  useEffect(() => {
    if (!commandWindowActive) {
      commandBufferRef.current = '';
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Backspace') {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        return;
      }

      if (event.key === 'Escape' || event.key === 'Enter') {
        commandBufferRef.current = '';
        return;
      }

      if (event.key.length !== 1 || !/^[a-z]$/i.test(event.key)) return;

      const nextBuffer = `${commandBufferRef.current}${event.key.toLowerCase()}`.slice(-MAX_BOOT_COMMAND_LENGTH);
      const matchedCommand = BOOT_COMMANDS.find(command => nextBuffer.endsWith(command));

      if (!matchedCommand) {
        commandBufferRef.current = nextBuffer;
        return;
      }

      const response = getBootCommandResponse(matchedCommand, progressRef.current);
      if (visible) {
        appendLogLine(response);
      } else {
        showPostBootFeedback(response);
      }
      commandBufferRef.current = '';
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appendLogLine, commandWindowActive, showPostBootFeedback, visible]);

  // ===================== Master entrance + loop animations =====================
  useEffect(() => {
    if (!visible || !bootPreferenceLoaded) return;

    const reducedMotion = prefersReducedMotion();
    const timelines: gsap.core.Timeline[] = [];

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const logoTransform = isMobile
      ? { yPercent: -50 }
      : { xPercent: -50, yPercent: -50 };

    // --- Reduced motion / returning visitor: show the apparatus immediately ---
    if (reducedMotion || fastBoot) {
      gsap.set([wastelandBgRef.current, loadingScreenRef.current], { opacity: 1 });
      if (hudRef.current?.container) gsap.set(hudRef.current.container, { opacity: 1 });
      if (logoRef.current?.container) gsap.set(logoRef.current.container, { opacity: 1, scaleY: 1, ...logoTransform });
      if (consoleRef.current?.container) gsap.set(consoleRef.current.container, { opacity: 1 });
      gsap.set(progressAreaRef.current, { opacity: 1, y: 0 });
      logoRef.current?.animateIn(0);
      hudRef.current?.initAnimations();
      const quickStartId = setTimeout(() => setStartLogging(true), reducedMotion ? 60 : 180);
      return () => clearTimeout(quickStartId);
    }

    // --- Entrance timeline ---
    const entranceTl = gsap.timeline();
    timelines.push(entranceTl);

    gsap.set([wastelandBgRef.current, loadingScreenRef.current], { opacity: 0 });
    if (hudRef.current?.container) gsap.set(hudRef.current.container, { opacity: 0 });
    if (logoRef.current?.container) gsap.set(logoRef.current.container, { opacity: 1, scaleY: 0, transformOrigin: 'center center', ...logoTransform });
    if (consoleRef.current?.container) gsap.set(consoleRef.current.container, { opacity: 0 });
    gsap.set(progressAreaRef.current, { opacity: 0, y: 15 });

    entranceTl
      .to([wastelandBgRef.current, loadingScreenRef.current], { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0)
      .to(logoRef.current?.container || null, { scaleY: 1, duration: 0.6, ease: 'power2.out' }, 0.2)
      .to(hudRef.current?.container || null, { opacity: 1, duration: 1.0, ease: 'power1.out' }, 0.3)
      .call(() => {
        // Call Logo component animation method
        logoRef.current?.animateIn(0.5);
        // Call HUD animations
        hudRef.current?.initAnimations();
      }, [], 0.5)
      .to(logoRef.current?.container || null, { opacity: 0.15, duration: 1.0, ease: 'power2.inOut' }, 3.5)
      .to(consoleRef.current?.container || null, { opacity: 1, duration: 0.7, ease: 'none' }, 3.5)
      .to(progressAreaRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 3.5)
      .call(() => setStartLogging(true), [], 4.0); // Start logging after logo dims and console appears

    return () => {
      timelines.forEach(tl => tl.kill());
    };
  }, [bootPreferenceLoaded, fastBoot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===================== Split lines animation =====================
  useEffect(() => {
    if (showSplitLines && splitRef.current) {
      splitRef.current.animateOut();
    }
  }, [showSplitLines]);

  // ===================== Exit animation (reveal wipe) =====================
  useEffect(() => {
    if (loading) return;
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
    }
    if (onCompleteRef.current) onCompleteRef.current();

    const reducedMotion = prefersReducedMotion();
    const wipeDur = reducedMotion ? 0.18 : fastBoot ? 0.42 : 1.0;
    const subDur = reducedMotion ? 0.12 : fastBoot ? 0.22 : 0.42;

    const exitTl = gsap.timeline({
      onComplete: () => {
        setVisible(false);

        if (commandWindowTimerRef.current) {
          clearTimeout(commandWindowTimerRef.current);
        }

        commandWindowTimerRef.current = setTimeout(() => {
          commandBufferRef.current = '';
          setCommandWindowActive(false);
        }, POST_BOOT_COMMAND_WINDOW_MS);
      },
    });

    exitTl.fromTo([wastelandBgRef.current, loadingScreenRef.current],
      { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
      { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', duration: wipeDur, ease: 'power2.inOut' },
      0,
    );

    exitTl.to([wastelandBgRef.current, loadingScreenRef.current], {
      opacity: 0, duration: wipeDur + 0.3, ease: 'power2.inOut',
    }, 0);

    // Make HUD, logo, and console disappear slightly faster (more compact)
    if (hudRef.current?.container) exitTl.to(hudRef.current.container, { opacity: 0, duration: subDur * 0.7 }, 0);
    if (logoRef.current?.container) exitTl.to(logoRef.current.container, { opacity: 0, duration: subDur * 0.7 }, 0);
    if (consoleRef.current?.container) exitTl.to(consoleRef.current.container, { opacity: 0, duration: subDur * 0.7 }, 0);
    if (progressAreaRef.current) exitTl.to(progressAreaRef.current, { opacity: 0, duration: subDur * 0.7 }, 0);
    if (hudRef.current?.hudElements) exitTl.to(hudRef.current.hudElements, { opacity: 0, duration: subDur * 0.7 }, 0);

    const extraElements = splitRef.current?.getElements() || [];
    if (extraElements.length > 0) exitTl.to(extraElements, { opacity: 0, duration: subDur * 0.7 }, 0);

    return () => { exitTl.kill(); };
  }, [fastBoot, loading]);

  return visible || postBootFeedback ? (
    <>
      {visible && (
        <>
          <div ref={wastelandBgRef} className={styles.wasteland_background} style={{ opacity: 0 }} />

          <div ref={loadingScreenRef} className={styles.loading_screen} style={{ opacity: 0 }}>
            <SplitTransition ref={splitRef} show={showSplitLines} />

            {!showSplitLines && (
              <button
                type="button"
                className={styles.skipBootButton}
                onClick={handleSkipBoot}
                aria-label="Skip boot sequence"
              >
                {fastBoot ? 'FAST SYNC' : 'SKIP BOOT'}
              </button>
            )}

            <div className={styles.grid_overlay}></div>

            <IndustrialHud ref={hudRef} />

            <div className={styles.loading_content}>
              <LogoTitle ref={logoRef} />
              <TerminalConsole ref={consoleRef} logLines={logLines} />
            </div>

            <div ref={progressAreaRef} className={styles.progress_area} style={{ opacity: 0, transform: 'translateY(15px)' }}>
              <div className={styles.text_progress_container}>
                <div className={styles.text_progress_base}>
                  <span className={styles.progress_prefix}>&gt; SYSTEM INITIALIZING... [</span>
                  <span className={styles.progress_bar_chars}>{"/".repeat(300)}</span>
                  <span className={styles.progress_suffix}>] {Math.floor(progress).toString().padStart(3, ' ')}%</span>
                </div>
                <div className={styles.text_progress_fill} style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}>
                  <span className={styles.progress_prefix}>&gt; SYSTEM INITIALIZING... [</span>
                  <span className={styles.progress_bar_chars}>{"/".repeat(300)}</span>
                  <span className={styles.progress_suffix}>] {Math.floor(progress).toString().padStart(3, ' ')}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {postBootFeedback && (
        <div key={postBootFeedback.token} className={styles.postBootCommandFeedback} role="status" aria-live="polite">
          <span className={styles.log_prefix}>&gt;</span>
          <span>{postBootFeedback.text}</span>
        </div>
      )}
    </>
  ) : null;
};

export default HomeLoadingScreen;
