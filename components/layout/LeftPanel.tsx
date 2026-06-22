import { useEffect, useRef } from 'react';
import styles from '../../styles/Home.module.scss';
import ActivationLever from '../interactive/ActivationLever';

export default function LeftPanel({
  leftPanelAnimated,
  mainVisible,
  leversVisible,
  handleActivateTesseract,
  isTesseractActivated,
  handleDischargeLeverPull,
  isDischarging,
  activeSection,
  handleGlobalBackClick,
  navLinks,
  handleLeftNavLinkClick,
  handleFriendsClick,
  powerLevel,
  isFateTypingActive,
  displayedFateText,
  isEnvParamsTyping,
  displayedEnvParams,
  isInverted,
  drawerOpen = false,
  isDrawerMode = false,
  isStandalone = false,
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (isDrawerMode && !drawerOpen) {
      panel.setAttribute('inert', '');
    } else {
      panel.removeAttribute('inert');
    }
  }, [drawerOpen, isDrawerMode]);

  const showBackAndNav =
    leftPanelAnimated && (
      activeSection === 'content' ||
      activeSection === 'lifeDetail' ||
      activeSection === 'workDetail' ||
      activeSection === 'experienceDetail' ||
      activeSection === 'blog' ||
      activeSection === 'blogDetail' ||
      activeSection === 'friendLinkDetail'
    );

  return (
    <div
      id="site-drawer"
      ref={panelRef}
      aria-hidden={isDrawerMode && !drawerOpen ? true : undefined}
      className={`${styles.leftPanel} ${leftPanelAnimated ? styles.animated : ''} ${drawerOpen ? styles.drawerOpen : ''} ${isStandalone ? styles.standaloneHide : ''}`}
    >
      <div className={styles.topRightDecoration}></div>
      <div className={styles.leverGroup}>
        {mainVisible && (
          <ActivationLever
            onActivate={handleActivateTesseract}
            isActive={isTesseractActivated}
            iconType="discharge"
            isAnimated={leversVisible}
            label="Deploy tesseract charging field"
          />
        )}
        {mainVisible && (
          <ActivationLever
            onActivate={handleDischargeLeverPull}
            isActive={isDischarging}
            iconType="drain"
            isAnimated={leversVisible}
            label="Discharge core"
            lockedReason={powerLevel < 100 ? `Requires 100 percent charge. Current charge ${powerLevel} percent.` : undefined}
          />
        )}
      </div>
    <button
      type="button"
      className={`${styles.globalBackButton} ${showBackAndNav ? styles.visible : ''}`}
      onClick={handleGlobalBackClick}
      aria-label="Back"
      data-cursor-label="BACK"
    >
    </button>
      <div className={`${styles.globalBackButtonDivider} ${showBackAndNav ? styles.visible : ''}`}></div>
      <nav className={`${styles.leftNavLinks} ${showBackAndNav ? styles.visible : ''}`} aria-label="Section navigation">
        {navLinks.map((link) => (
          <button
            type="button"
            key={link.label}
            className={styles.leftNavLink}
            onClick={() => handleLeftNavLinkClick(link)}
            data-cursor-label={link.label.toUpperCase()}
          >
            {link.label}
          </button>
        ))}
        <button
          type="button"
          className={styles.leftNavLink}
          onClick={handleFriendsClick}
          data-cursor-label="FRIENDS"
        >
          Friends
        </button>
      </nav>
      <div
        className={styles.powerDisplay}
        role="meter"
        aria-label="System power"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={powerLevel}
      >
        <div className={styles.batteryIcon} aria-hidden="true">
          {[...Array(5)].map((_, i) => {
            const shouldBeFilled = powerLevel >= (i + 1) * 20;
            const isFilled = (i === 4 && powerLevel === 100) || shouldBeFilled;
            return (
              <span
                key={i}
                className={`${styles.batteryLevelSegment} ${isFilled ? styles.filled : ''}`}
              ></span>
            );
          })}
        </div>
        <span className={styles.powerText}>{powerLevel}%</span>
      </div>
      <div className={styles.logoContainer}></div>
      <div
        tabIndex={0}
        role="img"
        className={styles.identityProbe}
        aria-label="Identity module probe: empty"
        data-cursor-label="ID_CHECK"
      >
        <span className={styles.identityHint}>IDENTITY MODULE EMPTY</span>
      </div>
      <div className={`${styles.fateTextContainer} ${isFateTypingActive ? styles.typingActive : ''}`}>
        <span className={styles.fateText}>{displayedFateText}</span>
        <div className={styles.fateLine}></div>
      </div>
      <div className={`${styles.envParamsContainer} ${isEnvParamsTyping ? styles.typingActive : ''} ${leftPanelAnimated ? styles.animated : ''}`}>
        <pre className={styles.envParamsText}>
          {displayedEnvParams}
        </pre>
      </div>
    
    </div>
  );
}
