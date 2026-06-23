import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './CommandTerminal.module.scss';
import { useApp } from '../../contexts/AppContext';
import { useTransition } from '../../contexts/TransitionContext';
import { primaryNavItems } from '../../data/navigation';

type CommandAction = {
  id: string;
  label: string;
  command: string;
  hint: string;
  tone?: 'success' | 'warning' | 'info';
  run: () => void;
};

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
};

export default function CommandTerminal() {
  const {
    commandTerminalOpen,
    closeCommandTerminal,
    toggleArchiveLayer,
    setArchiveLayerActive,
    archiveLayerActive,
    handleActivateTesseract,
    handleDischargeLeverPull,
    powerLevel,
    pushSystemNotice,
  } = useApp();
  const { navigateTo } = useTransition();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeTerminal = useCallback(() => {
    closeCommandTerminal();
    setQuery('');
    requestAnimationFrame(() => {
      previousFocusRef.current?.focus?.({ preventScroll: true });
    });
  }, [closeCommandTerminal]);

  const sendBlogFilter = useCallback((value: string) => {
    const filter = value.trim();
    if (!filter) return;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('touchpoint:blog-filter', filter);
      window.dispatchEvent(new CustomEvent('touchpoint:blog-filter', { detail: filter }));
    }
    navigateTo('/content#blog');
    pushSystemNotice(`BLOG SIGNAL FILTER // ${filter.toUpperCase()}`, 'info');
  }, [navigateTo, pushSystemNotice]);

  const baseCommands = useMemo<CommandAction[]>(() => {
    const sectionCommands = primaryNavItems.map((item) => ({
      id: `section-${item.hash}`,
      label: item.label,
      command: `open ${item.hash}`,
      hint: `${item.code} // ${item.shortHint}`,
      run: () => {
        navigateTo(`/content#${item.hash}`);
        pushSystemNotice(`VECTOR LOCK // ${item.displayLabel}`, 'success');
      },
    }));

    return [
      ...sectionCommands,
      {
        id: 'home',
        label: 'Return Home',
        command: 'home',
        hint: 'Collapse to six-column HUD',
        run: () => navigateTo('/'),
      },
      {
        id: 'friends',
        label: 'Open Friend Links',
        command: 'friends',
        hint: 'External signal directory',
        run: () => navigateTo('/friends'),
      },
      {
        id: 'archive-toggle',
        label: archiveLayerActive ? 'Seal Archive Layer' : 'Expose Archive Layer',
        command: archiveLayerActive ? 'archive off' : 'archive on',
        hint: archiveLayerActive ? 'Hide hidden side notes' : 'Reveal hidden side notes',
        tone: archiveLayerActive ? 'warning' : 'success',
        run: toggleArchiveLayer,
      },
      {
        id: 'archive-force-on',
        label: 'Force Archive Layer Online',
        command: 'archive expose',
        hint: 'Manual override for hidden annotations',
        tone: 'success',
        run: () => setArchiveLayerActive(true),
      },
      {
        id: 'charge',
        label: 'Deploy Tesseract Field',
        command: 'charge',
        hint: 'Begin charging sequence',
        tone: 'success',
        run: handleActivateTesseract,
      },
      {
        id: 'discharge',
        label: 'Arm Discharge Core',
        command: 'discharge',
        hint: powerLevel >= 100 ? 'Full charge available' : `Locked at ${powerLevel}%`,
        tone: powerLevel >= 100 ? 'warning' : 'info',
        run: handleDischargeLeverPull,
      },
    ];
  }, [
    archiveLayerActive,
    handleActivateTesseract,
    handleDischargeLeverPull,
    navigateTo,
    powerLevel,
    pushSystemNotice,
    setArchiveLayerActive,
    toggleArchiveLayer,
  ]);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? baseCommands.filter((command) => (
        command.label.toLowerCase().includes(normalized) ||
        command.command.toLowerCase().includes(normalized) ||
        command.hint.toLowerCase().includes(normalized)
      ))
      : baseCommands;

    if (normalized.length > 0) {
      matches.unshift({
        id: `blog-filter-${normalized}`,
        label: `Filter Blog Signals: ${query.trim()}`,
        command: `blog ${query.trim()}`,
        hint: 'Filter by title, excerpt, or tag',
        run: () => sendBlogFilter(query),
      });
    }

    return matches.slice(0, 9);
  }, [baseCommands, query, sendBlogFilter]);

  useEffect(() => {
    if (!commandTerminalOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(timer);
  }, [commandTerminalOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!commandTerminalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) && event.key !== 'Escape') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTerminal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeTerminal, commandTerminalOpen]);

  const runCommand = useCallback((command: CommandAction) => {
    command.run();
    closeTerminal();
  }, [closeTerminal]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(filteredCommands.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = filteredCommands[activeIndex];
      if (command) runCommand(command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeTerminal();
    }
  };

  if (!commandTerminalOpen) return null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={closeTerminal}>
      <section
        className={styles.terminal}
        role="dialog"
        aria-modal="true"
        aria-label="Command terminal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <span>COMMAND TERMINAL</span>
          <span>CTRL_K // ONLINE</span>
        </div>
        <label className={styles.inputShell}>
          <span className={styles.prompt}>root@touchpoint:~$</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="open works / blog react / archive on"
            aria-label="Type a command"
          />
        </label>
        <div className={styles.results} role="listbox" aria-label="Command results">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <button
                type="button"
                key={command.id}
                className={`${styles.result} ${index === activeIndex ? styles.active : ''} ${command.tone ? styles[command.tone] : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runCommand(command)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <span className={styles.resultCommand}>{command.command}</span>
                <span className={styles.resultLabel}>{command.label}</span>
                <span className={styles.resultHint}>{command.hint}</span>
              </button>
            ))
          ) : (
            <div className={styles.empty}>NO MATCHING SIGNALS</div>
          )}
        </div>
        <div className={styles.footer}>
          <span>↑↓ SELECT</span>
          <span>ENTER EXECUTE</span>
          <span>ESC CLOSE</span>
        </div>
      </section>
    </div>
  );
}
