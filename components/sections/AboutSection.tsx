import styles from '../../styles/Home.module.scss';
import Noise from '../effects/Noise';
import { useApp } from '../../contexts/AppContext';

export default function AboutSection({
  aboutSectionRef,
  aboutContentRef,
  runtime,
  totalVisits,
  currentVisitors,
}) {
  const { archiveLayerActive, isInverted, powerLevel } = useApp();

  return (
    <div id="about-section" ref={aboutSectionRef} className={`${styles.contentSection} ${styles.aboutSection}`}>
      <Noise />
      <div ref={aboutContentRef} className={styles.aboutContentInner}>
        <h2>ABOUT</h2>
        <div className={styles.siteStatsContainer}>
          <p>System Uptime: {runtime}</p>
          <p>Total Visits: {totalVisits}</p>
          <p>Online Now: {currentVisitors}</p>
        </div>
        {archiveLayerActive && (
          <div className={styles.aboutArchiveDossier}>
            <span>ARCHIVE DOSSIER</span>
            <p>INVERSION FIELD: {isInverted ? 'ONLINE' : 'STANDBY'}</p>
            <p>CORE RESERVE: {powerLevel}%</p>
            <p>PRIVATE ANNOTATION LAYER EXPOSED FOR THIS SESSION.</p>
          </div>
        )}
        <div className={styles.footerInfo}>
          MIT 2025-PRESENT © Your Name
        </div>
      
      </div>
      
    </div>
  );
}
