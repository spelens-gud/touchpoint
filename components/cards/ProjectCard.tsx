import React from 'react';
import styles from '../../styles/Home.module.scss';
import { useApp } from '../../contexts/AppContext';

const ProjectCard = ({ project, onClick }) => {
  const {
    id, title, description, tech, link, imageUrl, invertedImageUrl,
    role, year, status, highlights, articleContent, isConfidential, liveUrl,
  } = project;
  const { isInverted, archiveLayerActive } = useApp();

  const resolvedImageUrl = isInverted && invertedImageUrl ? invertedImageUrl : imageUrl;
  const imageStyle = resolvedImageUrl ? { backgroundImage: `url(${resolvedImageUrl})` } : {};
  const cleanId = String(id).replace(/[^a-z0-9]/gi, '').toUpperCase() || '000';
  const scanCode = `SIG-${cleanId.slice(0, 5).padStart(5, '0')}`;
  const statusLabel = status ? status.toUpperCase() : liveUrl ? 'LIVE' : link && link !== '#' ? 'LINKED' : 'LOCAL';
  const archiveNote = highlights?.[0] || articleContent?.split('\n').find(Boolean) || description;

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(project, e);
    } else if (link && link !== '#') {
      window.open(link, '_blank', 'noopener noreferrer');
    }
  };

  const isClickable = !!onClick || (link && link !== '#');

  return (
    <article
      className={`${styles.projectCard} ${isClickable ? styles.clickable : ''} ${isConfidential ? styles.confidentialCard : ''} ${archiveLayerActive ? styles.archiveVisibleCard : ''}`}
      data-cursor-no-magnetic
    >
      {isClickable && (
        <button
          type="button"
          className={styles.projectCardButton}
          onClick={handleCardClick}
          aria-label={`Open ${title}`}
          data-cursor-no-magnetic
        />
      )}
      <div className={styles.cardBorderTopLeft}></div>
      <div className={styles.cardBorderBottomRight}></div>
      
      <div className={styles.projectImageContainer}>
        {isConfidential && !resolvedImageUrl ? (
          <div className={`${styles.projectImagePlaceholder} ${styles.confidentialPlaceholder}`}>
            <span className={styles.confidentialIcon}>🔒</span>
            <span className={styles.confidentialLabel}>CONFIDENTIAL</span>
          </div>
        ) : (
          <div className={styles.projectImagePlaceholder} style={imageStyle}>
            <div className={styles.imageScanlineOverlay}></div>
            <div className={styles.projectScanLayer} aria-hidden="true">
              <span className={styles.projectScanBeam} />
              <span className={styles.projectScanLock}>SIGNAL LOCKED</span>
              <span className={styles.projectScanCode}>{scanCode}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.projectContent}>
        {(role || year) && (
          <div className={styles.projectMeta}>
            {year && <span className={styles.projectYear}>{year}</span>}
            {role && <span className={styles.projectRole}>{role}</span>}
          </div>
        )}
        <h3 className={styles.projectTitle}>
          <span className={styles.titleBracket}>[</span>{title}<span className={styles.titleBracket}>]</span>
        </h3>
        <p className={styles.projectDescription}>{description}</p>
        <div className={styles.projectBlackboxPayload} aria-hidden="true">
          <span>DECODE // {statusLabel}</span>
          <span>{year || 'DATE UNKNOWN'}</span>
          <span>{role || `${tech.length} TECH PAYLOADS`}</span>
        </div>
        <div className={styles.projectTech}>
          {tech.map((item, index) => (
            <span key={index} className={styles.techTag}>{item}</span>
          ))}
        </div>
        {archiveLayerActive && (
          <aside className={styles.projectArchiveNote}>
            <span>ARCHIVE NOTE</span>
            <p>{archiveNote}</p>
          </aside>
        )}
      </div>
      {liveUrl && (
        <a 
          href={liveUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.projectLink}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Visit ${title}`}
          data-cursor-magnetic
        >
          Visit
        </a>
      )}
      {!liveUrl && !onClick && link && link !== '#' && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.projectLink}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Visit ${title}`}
          data-cursor-magnetic
        >
          Visit
        </a>
      )}
    </article>
  );
};

export default React.memo(ProjectCard);
