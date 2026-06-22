import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import styles from '../styles/Home.module.scss';
import { useApp } from '../contexts/AppContext';
import { useTransition } from '../contexts/TransitionContext';

import WorksSection from '../components/sections/WorksSection';
import ExperienceSection from '../components/sections/ExperienceSection';
import BlogSection from '../components/sections/BlogSection';
import LifeSection from '../components/sections/LifeSection';
import ContactSection from '../components/sections/ContactSection';
import AboutSection from '../components/sections/AboutSection';

import WorkDetailView from '../components/detail/WorkDetailView';
import ExperienceDetailView from '../components/detail/ExperienceDetailView';
import LifeDetailView from '../components/detail/LifeDetailView';

import { webProjects, gameProjects, earlyProjects } from '../data/projects';
import { skillCategories } from '../data/skills';
import { experienceData } from '../data/experience';
import { gameData, travelData, otherData } from '../data/life';
import { getAllPosts } from '../lib/blog';
import type { BlogPostMeta, ExperienceItem, LifeItem, Project } from '../types';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const EMAIL_COPY_RECEIPTS = [
  'COORDINATES LOCKED',
  'RADAR ECHO RECEIVED',
  'CHANNEL OPEN // ADDRESS STORED',
  'CONTACT VECTOR COPIED',
];
const EMAIL_COPY_FAILURE_RECEIPT = 'COPY FAILED // MANUAL CHANNEL REQUIRED';

type EmailCopyFeedback = {
  message: string;
  token: number;
  tone: 'success' | 'error';
};

type DetailMode =
  | { type: 'none' }
  | { type: 'work'; item: Project }
  | { type: 'experience'; item: ExperienceItem }
  | { type: 'life'; item: LifeItem };

interface ContentPageProps {
  blogPosts: BlogPostMeta[];
}

export default function ContentPage({ blogPosts }: ContentPageProps) {
  const router = useRouter();
  const { runtime, totalVisits, currentVisitors } = useApp();
  const { navigateTo, setBackOverride } = useTransition();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Blog state ---
  const blogSectionRef = useRef<HTMLDivElement>(null);

  // --- Works state ---
  const worksSectionRef = useRef<HTMLDivElement>(null);
  const workContentAreaRef = useRef<HTMLDivElement>(null);
  const webTabRef = useRef<HTMLDivElement>(null);
  const gameTabRef = useRef<HTMLDivElement>(null);
  const [activeWorkTab, setActiveWorkTab] = useState('web');

  // --- Experience state ---
  const experienceSectionRef = useRef<HTMLDivElement>(null);

  // --- Life state ---
  const lifeSectionRef = useRef<HTMLDivElement>(null);
  const lifeContentAreaRef = useRef<HTMLDivElement>(null);
  const lifeGameTabRef = useRef<HTMLDivElement>(null);
  const lifeTravelTabRef = useRef<HTMLDivElement>(null);
  const lifeArtTabRef = useRef<HTMLDivElement>(null);
  const lifeOtherTabRef = useRef<HTMLDivElement>(null);
  const [activeLifeTab, setActiveLifeTab] = useState('game');

  // --- Contact state ---
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const [emailCopyFeedback, setEmailCopyFeedback] = useState<EmailCopyFeedback | null>(null);
  const emailCopyCountRef = useRef(0);
  const emailCopyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- About state ---
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);

  // --- Detail overlay (CSS-animated) ---
  const [detail, setDetail] = useState<DetailMode>({ type: 'none' });
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  const isDetailMounted = detail.type !== 'none';

  // --- Hash-based instant scroll before first paint ---
  useIsomorphicLayoutEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const el = document.getElementById(`section-${hash}`);
    const container = scrollContainerRef.current;
    if (el && container) {
      container.scrollTop = el.offsetTop;
    }
  }, []);

  // Clean up back override when unmounting
  useEffect(() => {
    return () => { setBackOverride(null); };
  }, [setBackOverride]);

  useEffect(() => {
    return () => {
      if (emailCopyFeedbackTimerRef.current) {
        clearTimeout(emailCopyFeedbackTimerRef.current);
      }
    };
  }, []);

  // Prefetch all detail routes
  useEffect(() => {
    const allLifeItems = [...gameData, ...travelData, ...otherData];
    allLifeItems.forEach(item => { router.prefetch(`/life/${item.id}`); });
    gameProjects.forEach(p => { router.prefetch(`/game/${p.id}`); });
    webProjects.forEach(p => { router.prefetch(`/web/${p.id}`); });
    blogPosts.forEach(p => { router.prefetch(`/blog/${p.slug}`); });
  }, [router, blogPosts]);

  // Restore scroll position when closing starts
  useEffect(() => {
    if (isClosing && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isClosing]);

  // --- Open detail (shared logic) ---
  const openDetail = useCallback((mode: DetailMode) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
    setDetail(mode);
  }, []);

  // --- Works handlers ---
  const handleWorkTabClick = useCallback((tabName: string) => {
    setActiveWorkTab(tabName);
  }, []);

  const handleWorkItemClick = useCallback((item: Project) => {
    const coverImg = item.imageUrl?.split('?')[0];
    if (coverImg) {
      const img = new Image();
      img.src = coverImg;
    }
    const isGame = gameProjects.some((p) => p.id === item.id);
    const isWeb = webProjects.some((p) => p.id === item.id);
    if (isGame) {
      navigateTo(`/game/${item.id}`);
    } else if (isWeb) {
      navigateTo(`/web/${item.id}`);
    } else {
      openDetail({ type: 'work', item });
    }
  }, [openDetail, navigateTo]);

  // --- Experience handlers ---
  const handleExperienceItemClick = useCallback((item: ExperienceItem) => {
    openDetail({ type: 'experience', item });
  }, [openDetail]);

  // --- Life handlers ---
  const handleLifeTabClick = useCallback((tabName: string) => {
    setActiveLifeTab(tabName);
  }, []);

  const handleLifeItemClick = useCallback((item: LifeItem) => {
    const coverImg = item.imageUrl?.split('?')[0];
    if (coverImg) {
      const img = new Image();
      img.src = coverImg;
    }
    navigateTo(`/life/${item.id}`);
  }, [navigateTo]);

  // --- Contact handlers ---
  const showEmailCopyFeedback = useCallback((feedback: EmailCopyFeedback) => {
    if (emailCopyFeedbackTimerRef.current) {
      clearTimeout(emailCopyFeedbackTimerRef.current);
    }

    setEmailCopyFeedback(feedback);
    emailCopyFeedbackTimerRef.current = setTimeout(() => {
      setEmailCopyFeedback((current) => (
        current?.token === feedback.token ? null : current
      ));
    }, 1500);
  }, []);

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText('your-email@example.com').then(() => {
      emailCopyCountRef.current += 1;
      const nextToken = emailCopyCountRef.current;
      const message = emailCopyCountRef.current >= 3
        ? 'YOU ALREADY HAVE THE COORDINATES'
        : EMAIL_COPY_RECEIPTS[Math.floor(Math.random() * EMAIL_COPY_RECEIPTS.length)];

      showEmailCopyFeedback({ message, token: nextToken, tone: 'success' });
    }).catch(err => {
      console.error('Failed to copy email:', err);
      showEmailCopyFeedback({
        message: EMAIL_COPY_FAILURE_RECEIPT,
        token: Date.now(),
        tone: 'error',
      });
    });
  }, [showEmailCopyFeedback]);

  const handleShowFriendLinks = useCallback(() => {
    navigateTo('/friends');
  }, [navigateTo]);

  // --- Blog handler ---
  const handleBlogItemClick = useCallback((slug: string) => {
    navigateTo(`/blog/${slug}`);
  }, [navigateTo]);

  // --- Detail back: CSS exit animation, unmount on animationend ---
  const handleBackFromDetail = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setBackOverride(null);
  }, [setBackOverride]);

  // Set back override when detail opens
  useEffect(() => {
    if (isDetailMounted && !isClosing) {
      setBackOverride(handleBackFromDetail);
    }
  }, [isDetailMounted, isClosing, setBackOverride, handleBackFromDetail]);

  // Handle CSS animationend on detail wrapper → unmount after exit animation
  const handleDetailAnimEnd = useCallback((e: React.AnimationEvent) => {
    if (e.target !== detailRef.current) return;
    if (isClosingRef.current) {
      setDetail({ type: 'none' });
      setIsClosing(false);
      isClosingRef.current = false;
    }
  }, []);

  const isDetailOpen = isDetailMounted && !isClosing;

  const detailTitle = isDetailOpen
    ? detail.type === 'work'
      ? `${detail.item.title} - WORKS`
      : detail.type === 'experience'
        ? `${detail.item.title} - EXPERIENCE`
        : `${detail.item.title} - LIFE`
    : 'My Portfolio';

  return (
    <>
      <Head>
        <title>{detailTitle}</title>
        {!isDetailOpen && (
          <meta name="description" content="Portfolio — Explore" />
        )}
      </Head>

      {/* Main content — always mounted, CSS class drives slide animation */}
      <div
        ref={scrollContainerRef}
        className={`${styles.contentWrapper}${
          isDetailMounted && !isClosing ? ` ${styles.detailOpen}` : ''
        }${
          isClosing ? ` ${styles.detailClosing}` : ''
        }`}
      >
        <div id="section-works">
          <WorksSection
            worksSectionRef={worksSectionRef}
            activeWorkTab={activeWorkTab}
            handleWorkTabClick={handleWorkTabClick}
            workContentAreaRef={workContentAreaRef}
            webTabRef={webTabRef}
            gameTabRef={gameTabRef}
            webProjects={webProjects}
            gameProjects={gameProjects}
            earlyProjects={earlyProjects}
            handleWorkItemClick={handleWorkItemClick}
            skillCategories={skillCategories}
          />
        </div>

        <div id="section-experience">
          <ExperienceSection
            experienceSectionRef={experienceSectionRef}
            experienceData={experienceData}
            handleExperienceItemClick={handleExperienceItemClick}
          />
        </div>

        <div id="section-blog">
          <BlogSection
            blogSectionRef={blogSectionRef}
            posts={blogPosts}
            handleBlogItemClick={handleBlogItemClick}
          />
        </div>

        <div id="section-life">
          <LifeSection
            lifeSectionRef={lifeSectionRef}
            activeSection="content"
            activeLifeTab={activeLifeTab}
            handleLifeTabClick={handleLifeTabClick}
            lifeContentAreaRef={lifeContentAreaRef}
            lifeGameTabRef={lifeGameTabRef}
            lifeTravelTabRef={lifeTravelTabRef}
            lifeArtTabRef={lifeArtTabRef}
            lifeOtherTabRef={lifeOtherTabRef}
            gameData={gameData}
            travelData={travelData}
            otherData={otherData}
            handleLifeItemClick={handleLifeItemClick}
          />
        </div>

        <div id="section-contact">
          <ContactSection
            contactSectionRef={contactSectionRef}
            handleCopyEmail={handleCopyEmail}
            emailCopyFeedback={emailCopyFeedback}
            handleShowFriendLinks={handleShowFriendLinks}
          />
        </div>

        <div id="section-about">
          <AboutSection
            aboutSectionRef={aboutSectionRef}
            aboutContentRef={aboutContentRef}
            runtime={runtime}
            totalVisits={totalVisits}
            currentVisitors={currentVisitors}
          />
        </div>
      </div>

      {/* Detail overlay — CSS animated, conditionally rendered */}
      {isDetailMounted && (
        <div
          ref={detailRef}
          className={`${styles.detailViewWrapper}${
            !isClosing ? ` ${styles.entering}` : ` ${styles.exiting}`
          }`}
          onAnimationEnd={handleDetailAnimEnd}
        >
          <button
            className={styles.globalBackButton}
            onClick={handleBackFromDetail}
            style={{ position: 'fixed', zIndex: 10 }}
          >
          </button>
          {detail.type === 'work' && <WorkDetailView item={detail.item} />}
          {detail.type === 'experience' && <ExperienceDetailView item={detail.item} />}
          {detail.type === 'life' && <LifeDetailView item={detail.item} />}
        </div>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const blogPosts = getAllPosts();
  return {
    props: { blogPosts },
  };
};
