import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import styles from '../../styles/Home.module.scss';
import { useApp } from '../../contexts/AppContext';
import { useTransition } from '../../contexts/TransitionContext';
import { useResponsive } from '../../hooks/useMediaQuery';

import CustomCursor from '../interactive/CustomCursor';
import HomeLoadingScreen from '../shared/HomeLoadingScreen';
import MusicPlayer from '../interactive/MusicPlayer';
import GlobalHud from './GlobalHud';
import LeftPanel from './LeftPanel';
import { primaryNavItems } from '../../data/navigation';


const TesseractExperience = dynamic(
  () => import('../effects/TesseractExperience').catch(() => ({
    default: () => null,
  })),
  { ssr: false, loading: () => null }
);

const RainMorimeEffect = dynamic(
  () => import('../effects/RainMorimeEffect').catch(() => ({
    default: () => null,
  })),
  { ssr: false, loading: () => null }
);

export default function MainLayout({ children }) {
  const router = useRouter();
  const { navigateTo, handleBack, isDetailOpen } = useTransition();
  const { isMobile, isDesktop } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const app = useApp();
  const {
    mainVisible, isInverted, isTesseractActivated, animationsComplete,
    chargeBattery, handleLoadingComplete,
    currentTime, hudVisible, leftPanelAnimated, leversVisible,
    handleActivateTesseract, handleDischargeLeverPull, isDischarging,
    powerLevel, isFateTypingActive, displayedFateText,
    isEnvParamsTyping, displayedEnvParams, envData, envDataVersion,
    deactivateTesseract, systemNotice, pushSystemNotice, currentVisitors,
  } = app;

  const isHome = router.pathname === '/';
  const isContentPage = router.pathname === '/content';
  const isStandalone = router.pathname === '/game' || router.pathname.startsWith('/game/') || router.pathname.startsWith('/web/') || router.pathname.startsWith('/life/') || router.pathname.startsWith('/blog/');

  const prevStandaloneRef = useRef(isStandalone);
  const [localPanelAnimated, setLocalPanelAnimated] = useState(leftPanelAnimated);
  const [localLeversVisible, setLocalLeversVisible] = useState(leversVisible);
  const lastDrawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileChargeNoticeRef = useRef(false);
  const powerBandRef = useRef<'low' | 'stable' | 'full'>(powerLevel < 30 ? 'low' : powerLevel >= 100 ? 'full' : 'stable');
  const visitorNoticeRef = useRef<{ hasAnnounced: boolean; count: number }>({ hasAnnounced: false, count: 0 });
  const nightWatchNoticeRef = useRef(false);
  const [isNightWatch, setIsNightWatch] = useState(false);

  useEffect(() => {
    const wasStandalone = prevStandaloneRef.current;
    prevStandaloneRef.current = isStandalone;

    if (wasStandalone && !isStandalone) {
      // 从独立页返回 → 重置并重播面板和拉杆入场动画
      setLocalPanelAnimated(false);
      setLocalLeversVisible(false);
      const t1 = setTimeout(() => {
        setLocalPanelAnimated(true);
      }, 50);
      const t2 = setTimeout(() => {
        setLocalLeversVisible(true);
      }, 850);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (isStandalone) {
      // 进入独立页 → 快速收回面板
      setLocalPanelAnimated(false);
      setLocalLeversVisible(false);
    } else {
      // 正常流程（包括初始加载）→ 直接同步全局状态，不干扰
      setLocalPanelAnimated(leftPanelAnimated);
      setLocalLeversVisible(leversVisible);
    }
  }, [isStandalone, leftPanelAnimated, leversVisible]);

  const [forceHomeSection, setForceHomeSection] = useState(false);
  useEffect(() => {
    if (isHome) setForceHomeSection(false);
  }, [isHome]);
  const activeSection = (forceHomeSection || isHome) ? 'home' : 'content';

  // Latch: once WebGL is ready, never unmount it (avoids GPU context destruction during transitions)
  const [webglReady, setWebglReady] = useState(false);
  useEffect(() => {
    if (animationsComplete && !webglReady) setWebglReady(true);
  }, [animationsComplete, webglReady]);

  // 移动端：拉杆激活后直接充电（桌面端由 TesseractExperience 组件负责充电）
  const chargeBatteryRef = useRef(chargeBattery);
  chargeBatteryRef.current = chargeBattery;
  const deactivateTesseractRef = useRef(deactivateTesseract);
  deactivateTesseractRef.current = deactivateTesseract;

  useEffect(() => {
    if (!isDesktop && isTesseractActivated) {
      const interval = setInterval(() => {
        chargeBatteryRef.current();
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isDesktop, isTesseractActivated]);

  useEffect(() => {
    if (!isDesktop && isTesseractActivated && !mobileChargeNoticeRef.current) {
      pushSystemNotice('AUTO_CHARGE LINK ACTIVE', 'success');
      mobileChargeNoticeRef.current = true;
    }
    if (!isTesseractActivated) {
      mobileChargeNoticeRef.current = false;
    }
  }, [isDesktop, isTesseractActivated, pushSystemNotice]);

  // 移动端：充满 100% 自动放下充电拉杆
  useEffect(() => {
    if (!isDesktop && powerLevel >= 100 && isTesseractActivated) {
      deactivateTesseractRef.current();
    }
  }, [isDesktop, powerLevel, isTesseractActivated]);

  useEffect(() => {
    const updateNightWatch = () => {
      const hour = new Date().getHours();
      setIsNightWatch(hour >= 0 && hour < 4);
    };

    updateNightWatch();
    const timer = window.setInterval(updateNightWatch, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mainVisible || !isNightWatch || nightWatchNoticeRef.current) return;
    pushSystemNotice('NIGHT WATCH ACTIVE', 'info');
    nightWatchNoticeRef.current = true;
  }, [isNightWatch, mainVisible, pushSystemNotice]);

  useEffect(() => {
    if (!isNightWatch) {
      nightWatchNoticeRef.current = false;
    }
  }, [isNightWatch]);

  useEffect(() => {
    const nextBand = powerLevel < 30 ? 'low' : powerLevel >= 100 ? 'full' : 'stable';
    if (!mainVisible) {
      powerBandRef.current = nextBand;
      return;
    }

    if (powerBandRef.current === nextBand) return;
    powerBandRef.current = nextBand;

    if (nextBand === 'low') {
      pushSystemNotice(`LOW RESERVE // POWER ${powerLevel}%`, 'warning');
    } else if (nextBand === 'stable') {
      pushSystemNotice(`POWER STABLE // ${powerLevel}%`, 'info');
    }
  }, [mainVisible, powerLevel, pushSystemNotice]);

  useEffect(() => {
    if (!mainVisible || currentVisitors <= 0) return;

    const previous = visitorNoticeRef.current.count;
    if (!visitorNoticeRef.current.hasAnnounced) {
      pushSystemNotice(
        currentVisitors > 1 ? 'PARALLEL PRESENCE DETECTED' : 'SOLO SIGNAL',
        currentVisitors > 1 ? 'success' : 'info',
      );
      visitorNoticeRef.current = { hasAnnounced: true, count: currentVisitors };
      return;
    }

    if (currentVisitors > previous) {
      pushSystemNotice('NEW SIGNAL JOINED', 'success');
    } else if (previous > 1 && currentVisitors === 1) {
      pushSystemNotice('SOLO SIGNAL', 'info');
    }
    visitorNoticeRef.current.count = currentVisitors;
  }, [currentVisitors, mainVisible, pushSystemNotice]);

  const handleGlobalBackClick = () => {
    if (!isDetailOpen()) {
      setForceHomeSection(true);
    }
    handleBack();
  };

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      lastDrawerTriggerRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = document.querySelector<HTMLElement>(
        '#site-drawer button:not([disabled]), #site-drawer a[href], #site-drawer [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus({ preventScroll: true });
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }

      if (event.key !== 'Tab') return;

      const drawer = document.getElementById('site-drawer');
      const focusable = drawer
        ? Array.from(drawer.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
          .filter((el) => el.offsetParent !== null)
        : [];

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  const navLinks = primaryNavItems.map(({ label, hash }) => ({ label, hash }));

  const noticeToneClass = systemNotice ? {
    info: styles.systemNoticeInfo,
    success: styles.systemNoticeSuccess,
    warning: styles.systemNoticeWarning,
  }[systemNotice.tone] : '';

  const scrollToSection = useCallback((hash: string) => {
    const el = document.getElementById(`section-${hash}`);
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

    const focusTarget = el.querySelector<HTMLElement>('h1, h2, h3') || el;
    if (!focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex', '-1');
    }
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 420);
  }, []);

  const handleLeftNavLinkClick = (link: { label: string; hash: string }) => {
    closeDrawer();

    if (isContentPage) {
      if (isDetailOpen()) {
        handleBack();
        setTimeout(() => {
          scrollToSection(link.hash);
        }, 900);
      } else {
        scrollToSection(link.hash);
      }
    } else {
      navigateTo(`/content#${link.hash}`);
    }
  };

  const handleFriendsClick = useCallback(() => {
    closeDrawer();
    navigateTo('/friends');
  }, [navigateTo, closeDrawer]);

  return (
    <div className={`${styles.container} ${isInverted ? styles.inverted : ''} ${isNightWatch ? styles.nightWatch : ''}`}>


      <div className={styles.leftDotMatrix}></div>
      {mainVisible && <MusicPlayer powerLevel={powerLevel} />}
      {isDesktop && <CustomCursor />}
      {webglReady && isDesktop && <RainMorimeEffect />}
      <HomeLoadingScreen onComplete={handleLoadingComplete} />
      {isTesseractActivated && isDesktop && !isStandalone && (
        <TesseractExperience
          chargeBattery={chargeBattery}
          isActivated={isTesseractActivated}
          isInverted={isInverted}
        />
      )}
      <div className={styles.gridBackground}></div>
      <div className={styles.glowEffect}></div>
      <div className={styles.rightStripeGradient}></div>

      {mainVisible && systemNotice && (
        <div
          key={systemNotice.id}
          className={`${styles.systemNotice} ${noticeToneClass}`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.systemNoticeMark} aria-hidden="true">//</span>
          <span>{systemNotice.text}</span>
        </div>
      )}

      {/* 汉堡菜单按钮 (仅平板端，移动端由底部功能栏替代) */}
      {mainVisible && (
        <button
          type="button"
          ref={lastDrawerTriggerRef}
          className={`${styles.hamburgerButton} ${drawerOpen ? styles.hamburgerOpen : ''}`}
          onClick={toggleDrawer}
          aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="site-drawer"
          aria-expanded={drawerOpen}
          data-cursor-label={drawerOpen ? 'CLOSE' : 'MENU'}
        >
          <span />
          <span />
          <span />
        </button>
      )}

      {/* 抽屉背景遮罩 */}
      <div
        className={`${styles.drawerBackdrop} ${drawerOpen ? styles.backdropVisible : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {mainVisible && (
        <>
          <GlobalHud currentTime={currentTime} hudVisible={hudVisible || isStandalone} isGamePage={router.pathname === '/game'} />
          <LeftPanel
            leftPanelAnimated={localPanelAnimated}
            mainVisible={mainVisible}
            leversVisible={localLeversVisible}
            handleActivateTesseract={handleActivateTesseract}
            isTesseractActivated={isTesseractActivated}
            handleDischargeLeverPull={handleDischargeLeverPull}
            isDischarging={isDischarging}
            activeSection={activeSection}
            handleGlobalBackClick={handleGlobalBackClick}
            navLinks={navLinks}
            handleLeftNavLinkClick={handleLeftNavLinkClick}
            handleFriendsClick={handleFriendsClick}
            powerLevel={powerLevel}
            isFateTypingActive={isFateTypingActive}
            displayedFateText={displayedFateText}
            isEnvParamsTyping={isEnvParamsTyping}
            displayedEnvParams={displayedEnvParams}
            isInverted={isInverted}
            drawerOpen={drawerOpen}
            isDrawerMode={!isDesktop}
            isStandalone={isStandalone}
          />
        </>
      )}
      <div style={{
        opacity: mainVisible ? 1 : 0,
        pointerEvents: mainVisible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease-out',
      }}>
        {children}
      </div>

      {/* 底部功能栏 (移动端) */}
      {mainVisible && isMobile && (
        <nav className={styles.bottomBar} aria-label="Mobile navigation">
          <button
            type="button"
            className={`${styles.bottomBarBtn} ${isHome ? styles.bottomBarDisabled : ''}`}
            onClick={() => { if (!isHome) handleGlobalBackClick(); }}
            aria-label="Back"
            disabled={isHome}
          >
            <span className={styles.bottomBarIcon}>◁</span>
            <span className={styles.bottomBarText}>Back</span>
            <span className={styles.bottomBarIndicator} />
          </button>
          <button
            type="button"
            className={`${styles.bottomBarBtn} ${isHome ? styles.bottomBarCurrent : ''}`}
            onClick={() => { if (!isHome) navigateTo('/'); }}
            aria-label="Home"
            aria-current={isHome ? 'page' : undefined}
          >
            <span className={styles.bottomBarIcon}>⬡</span>
            <span className={styles.bottomBarText}>Home</span>
            <span className={styles.bottomBarIndicator} />
          </button>
          <button
            type="button"
            ref={lastDrawerTriggerRef}
            className={`${styles.bottomBarBtn} ${drawerOpen ? styles.bottomBarActive : ''}`}
            onClick={toggleDrawer}
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="site-drawer"
            aria-expanded={drawerOpen}
          >
            <span className={styles.bottomBarIcon}>{drawerOpen ? '✕' : '☰'}</span>
            <span className={styles.bottomBarText}>Menu</span>
            <span className={styles.bottomBarIndicator} />
          </button>
        </nav>
      )}
    </div>
  );
}
