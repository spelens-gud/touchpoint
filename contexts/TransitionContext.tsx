import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from './AppContext';

interface TransitionContextValue {
  navigateTo: (url: string, options?: { scroll?: boolean }) => void;
  setBackOverride: (handler: (() => void) | null) => void;
  handleBack: () => void;
  isDetailOpen: () => boolean;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateTo: () => {},
  setBackOverride: () => {},
  handleBack: () => {},
  isDetailOpen: () => false,
});

export const useTransition = () => useContext(TransitionContext);

interface TransitionProviderProps {
  children: React.ReactNode;
  pageWrapperRef: React.RefObject<HTMLDivElement>;
}

const SLIDE_IN_KF: Keyframe[] = [
  { opacity: 0, transform: 'translateX(100%)' },
  { opacity: 1, transform: 'translateX(0)' },
];
const SLIDE_IN_OPTS: KeyframeAnimationOptions = {
  duration: 1050,
  easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  fill: 'both',
};

const SLIDE_OUT_KF: Keyframe[] = [
  { opacity: 1, transform: 'translateX(0)' },
  { opacity: 0, transform: 'translateX(100%)' },
];
const SLIDE_OUT_OPTS: KeyframeAnimationOptions = {
  duration: 320,
  easing: 'ease-in',
  fill: 'forwards',
};

const DIAG_EXPAND_KF: Keyframe[] = [
  { clipPath: 'inset(4% 100% 100% 4%)' },
  { clipPath: 'inset(0 0 0 0)' },
];
const DIAG_EXPAND_OPTS: KeyframeAnimationOptions = {
  duration: 620,
  easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  fill: 'both',
};

const DIAG_COLLAPSE_KF: Keyframe[] = [
  { clipPath: 'inset(0 0 0 0)' },
  { clipPath: 'inset(100% 0 0 100%)' },
];
const DIAG_COLLAPSE_OPTS: KeyframeAnimationOptions = {
  duration: 260,
  easing: 'ease-in',
  fill: 'forwards',
};

const checkMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

const withMotionPreference = (options: KeyframeAnimationOptions): KeyframeAnimationOptions => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduce ? { ...options, duration: 1 } : options;
};

export function TransitionProvider({ children, pageWrapperRef }: TransitionProviderProps) {
  const router = useRouter();
  const { retractColumns, expandColumns } = useApp();
  const isTransitioning = useRef(false);
  const queuedNav = useRef<{ url: string; options?: { scroll?: boolean } } | null>(null);
  const backOverrideRef = useRef<(() => void) | null>(null);
  const activeAnim = useRef<Animation | null>(null);
  const navigateToRef = useRef<((url: string, options?: { scroll?: boolean }) => void) | null>(null);

  const cancelActiveAnim = () => {
    if (activeAnim.current) {
      activeAnim.current.cancel();
      activeAnim.current = null;
    }
  };

  const processQueue = () => {
    if (queuedNav.current && navigateToRef.current) {
      const nextNav = queuedNav.current;
      queuedNav.current = null;
      // Use setTimeout to avoid synchronous nested calls
      setTimeout(() => {
        navigateToRef.current?.(nextNav.url, nextNav.options);
      }, 0);
    }
  };

  const resetWrapperVisibility = useCallback(() => {
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return;

    wrapper.style.opacity = '';
    wrapper.style.transform = '';
    wrapper.style.clipPath = '';
  }, [pageWrapperRef]);

  const finishTransition = useCallback(() => {
    activeAnim.current = null;
    isTransitioning.current = false;
    processQueue();
  }, []);

  const navigateTo = useCallback((url: string, options?: { scroll?: boolean }) => {
    if (isTransitioning.current) {
      // If returning to the same URL we are currently transitioning to, ignore.
      queuedNav.current = { url, options };
      return;
    }

    const wrapper = pageWrapperRef.current;
    if (!wrapper) {
      router.push(url, undefined, { scroll: false, ...options });
      return;
    }

    isTransitioning.current = true;
    queuedNav.current = null;
    cancelActiveAnim();
    const currentlyHome = router.pathname === '/';
    const goingHome = url === '/';

    const recoverFromNavigationFailure = () => {
      resetWrapperVisibility();
      finishTransition();
    };

    const pushThen = (
      target: string,
      cb: () => void,
      pushOpts?: { scroll?: boolean },
    ) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        router.events.off('routeChangeComplete', onComplete);
        router.events.off('hashChangeComplete', onComplete);
        router.events.off('routeChangeError', onError);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const complete = () => {
        if (settled) return;
        settled = true;
        cleanup();
        cb();
      };

      const fail = () => {
        if (settled) return;
        settled = true;
        cleanup();
        recoverFromNavigationFailure();
      };

      const onComplete = () => complete();
      const onError = () => fail();

      router.events.on('routeChangeComplete', onComplete);
      router.events.on('hashChangeComplete', onComplete);
      router.events.on('routeChangeError', onError);

      timeoutId = setTimeout(() => {
        fail();
      }, 5000);

      const pushResult = router.push(target, undefined, { scroll: false, ...pushOpts });
      if (pushResult && typeof pushResult.then === 'function') {
        pushResult.then((changed) => {
          if (changed === false) complete();
        }).catch(() => {
          fail();
        });
      };
    };

    const wapiSlideIn = () => {
      const anim = wrapper.animate(SLIDE_IN_KF, withMotionPreference(SLIDE_IN_OPTS));
      activeAnim.current = anim;
      anim.finished.then(() => {
        wrapper.style.opacity = '';
        wrapper.style.transform = '';
        anim.cancel();
        activeAnim.current = null;
        isTransitioning.current = false;
        processQueue();
      }).catch(() => {
        resetWrapperVisibility();
        finishTransition();
      });
    };

    const mobile = checkMobile();

    const wapiDiagExpand = () => {
      wrapper.style.opacity = '';
      const anim = wrapper.animate(DIAG_EXPAND_KF, withMotionPreference(DIAG_EXPAND_OPTS));
      activeAnim.current = anim;
      anim.finished.then(() => {
        wrapper.style.clipPath = '';
        wrapper.style.transform = '';
        anim.cancel();
        activeAnim.current = null;
        isTransitioning.current = false;
        processQueue();
      }).catch(() => {
        resetWrapperVisibility();
        finishTransition();
      });
    };

    if (currentlyHome && !goingHome) {
      if (mobile) {
        // Mobile forward: diagonal collapse home → push → diagonal expand content
        retractColumns(() => {});
        const anim = wrapper.animate(DIAG_COLLAPSE_KF, withMotionPreference(DIAG_COLLAPSE_OPTS));
        activeAnim.current = anim;
        anim.finished.then(() => {
          anim.cancel();
          activeAnim.current = null;
          wrapper.style.clipPath = 'inset(100%)';
          pushThen(url, wapiDiagExpand, options);
        }).catch(recoverFromNavigationFailure);
      } else {
        // Desktop forward: retract columns → hide wrapper → push → slide in
        retractColumns(() => {
          wrapper.style.opacity = '0';
          pushThen(url, wapiSlideIn, options);
        });
      }
    } else if (!currentlyHome && goingHome) {
      if (mobile) {
        // Mobile back: diagonal collapse content → push home → diagonal expand home
        const anim = wrapper.animate(DIAG_COLLAPSE_KF, withMotionPreference(DIAG_COLLAPSE_OPTS));
        activeAnim.current = anim;
        anim.finished.then(() => {
          anim.cancel();
          activeAnim.current = null;
          wrapper.style.clipPath = 'inset(100%)';
          pushThen('/', () => {
            expandColumns();
            wapiDiagExpand();
          });
        }).catch(recoverFromNavigationFailure);
      } else {
        // Desktop back: slide out → push home → expand columns
        const anim = wrapper.animate(SLIDE_OUT_KF, withMotionPreference(SLIDE_OUT_OPTS));
        activeAnim.current = anim;
        anim.finished.then(() => {
          anim.cancel();
          activeAnim.current = null;
          wrapper.style.opacity = '0';
          pushThen('/', () => {
            wrapper.style.opacity = '';
            expandColumns(() => {
              isTransitioning.current = false;
              processQueue();
            });
          });
        }).catch(recoverFromNavigationFailure);
      }
    } else {
      // Other: WAAPI slide out → push → WAAPI slide in
      const outAnim = wrapper.animate(SLIDE_OUT_KF, withMotionPreference(SLIDE_OUT_OPTS));
      activeAnim.current = outAnim;
      outAnim.finished.then(() => {
        outAnim.cancel();
        activeAnim.current = null;
        wrapper.style.opacity = '0';
        pushThen(url, wapiSlideIn, options);
      }).catch(recoverFromNavigationFailure);
    }
  }, [router, pageWrapperRef, retractColumns, expandColumns, resetWrapperVisibility, finishTransition]);

  // Keep navigateToRef updated
  useEffect(() => {
    navigateToRef.current = navigateTo;
  }, [navigateTo]);

  // Handle browser back/forward navigation (popstate) that bypasses navigateTo
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/' && !isTransitioning.current) {
        expandColumns();
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, expandColumns]);

  const setBackOverride = useCallback((handler: (() => void) | null) => {
    backOverrideRef.current = handler;
  }, []);

  const handleBack = useCallback(() => {
    if (backOverrideRef.current) {
      backOverrideRef.current();
      return;
    }
    const isHome = router.pathname === '/';
    if (!isHome) {
      navigateTo('/');
    }
  }, [router.pathname, navigateTo]);

  const isDetailOpen = useCallback(() => {
    return backOverrideRef.current !== null;
  }, []);

  return (
    <TransitionContext.Provider value={{ navigateTo, setBackOverride, handleBack, isDetailOpen }}>
      {children}
    </TransitionContext.Provider>
  );
}
