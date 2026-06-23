import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import styles from './ContentRadar.module.scss';
import { primaryNavItems } from '../../data/navigation';
import { useApp } from '../../contexts/AppContext';

interface ContentRadarProps {
  scrollContainerRef: RefObject<HTMLDivElement>;
}

export default function ContentRadar({ scrollContainerRef }: ContentRadarProps) {
  const { currentVisitors, totalVisits, pushSystemNotice } = useApp();
  const [activeHash, setActiveHash] = useState(primaryNavItems[0]?.hash || 'works');
  const [progress, setProgress] = useState(0);
  const didAnnounceRef = useRef(false);
  const activeHashRef = useRef(activeHash);

  const activeItem = useMemo(
    () => primaryNavItems.find((item) => item.hash === activeHash) || primaryNavItems[0],
    [activeHash],
  );

  useEffect(() => {
    activeHashRef.current = activeHash;
  }, [activeHash]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let frame = 0;
    const updateRadar = () => {
      frame = 0;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const nextProgress = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, container.scrollTop / maxScroll));
      setProgress((current) => (Math.abs(current - nextProgress) < 0.004 ? current : nextProgress));

      const probeY = container.scrollTop + container.clientHeight * 0.34;
      let nextHash = activeHashRef.current;
      for (const item of primaryNavItems) {
        const el = document.getElementById(`section-${item.hash}`);
        if (el && el.offsetTop <= probeY) {
          nextHash = item.hash;
        }
      }

      if (nextHash !== activeHashRef.current) {
        activeHashRef.current = nextHash;
        setActiveHash(nextHash);
        const navItem = primaryNavItems.find((item) => item.hash === nextHash);
        if (didAnnounceRef.current && navItem) {
          pushSystemNotice(`RADAR LOCK // ${navItem.displayLabel}`, 'info');
        }
      }
      didAnnounceRef.current = true;
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateRadar);
    };

    updateRadar();
    container.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      container.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [pushSystemNotice, scrollContainerRef]);

  const scrollToHash = useCallback((hash: string) => {
    const container = scrollContainerRef.current;
    const el = document.getElementById(`section-${hash}`);
    if (!container || !el) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({
      top: el.offsetTop,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [scrollContainerRef]);

  const progressPercent = Math.round(progress * 100);

  return (
    <aside className={styles.radar} aria-label="Content radar navigation">
      <div className={styles.scope} aria-hidden="true">
        <span className={styles.sweep} />
        {primaryNavItems.map((item, index) => {
          const angle = -92 + index * (184 / Math.max(1, primaryNavItems.length - 1));
          const radius = 42;
          const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
          const y = 52 + Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <span
              key={item.hash}
              className={`${styles.node} ${activeHash === item.hash ? styles.nodeActive : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          );
        })}
      </div>
      <div className={styles.readout}>
        <span className={styles.code}>{activeItem?.code}</span>
        <strong>{activeItem?.displayLabel}</strong>
        <span>{progressPercent}% ROUTE SCANNED</span>
        <span>{currentVisitors} ONLINE // {totalVisits} VISITS</span>
      </div>
      <div className={styles.pips}>
        {primaryNavItems.map((item) => (
          <button
            type="button"
            key={item.hash}
            className={`${styles.pip} ${activeHash === item.hash ? styles.pipActive : ''}`}
            onClick={() => scrollToHash(item.hash)}
            aria-label={`Jump to ${item.label}`}
            aria-current={activeHash === item.hash ? 'location' : undefined}
          >
            <span>{item.code.replace('SEC-', '')}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
