import { useEffect, useMemo, useState, type RefObject } from 'react';
import styles from '../../styles/Home.module.scss';
import cardStyles from '../../styles/BlogPostCard.module.scss';
import type { BlogPostMeta } from '../../types';

interface BlogSectionProps {
  blogSectionRef: RefObject<HTMLDivElement>;
  posts: BlogPostMeta[];
  handleBlogItemClick: (slug: string) => void;
}

export default function BlogSection({
  blogSectionRef,
  posts,
  handleBlogItemClick,
}: BlogSectionProps) {
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const stored = window.sessionStorage.getItem('touchpoint:blog-filter');
    if (stored) setFilter(stored);

    const handleFilterEvent = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setFilter(customEvent.detail || '');
    };

    window.addEventListener('touchpoint:blog-filter', handleFilterEvent);
    return () => window.removeEventListener('touchpoint:blog-filter', handleFilterEvent);
  }, []);

  const allTags = useMemo(() => {
    return Array.from(new Set(posts.flatMap((post) => post.tags))).slice(0, 10);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    if (!normalized) return posts;
    return posts.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        post.date,
        post.readingTime,
        ...post.tags,
      ].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filter, posts]);

  const updateFilter = (value: string) => {
    setFilter(value);
    const normalized = value.trim();
    if (normalized) {
      window.sessionStorage.setItem('touchpoint:blog-filter', normalized);
    } else {
      window.sessionStorage.removeItem('touchpoint:blog-filter');
    }
  };

  return (
    <div ref={blogSectionRef} className={styles.contentSection}>
      <h2>Blog</h2>
      <div className={cardStyles.signalFilter}>
        <div className={cardStyles.signalFilterHeader}>
          <span>BLOG SIGNAL READER</span>
          <span>{String(filteredPosts.length).padStart(2, '0')} / {String(posts.length).padStart(2, '0')} LOCKED</span>
        </div>
        <label className={cardStyles.signalFilterInput}>
          <span>FILTER</span>
          <input
            value={filter}
            onChange={(event) => updateFilter(event.target.value)}
            placeholder="title / excerpt / tag"
            aria-label="Filter blog posts"
          />
          {filter && (
            <button type="button" onClick={() => updateFilter('')} aria-label="Clear blog filter">
              CLR
            </button>
          )}
        </label>
        {allTags.length > 0 && (
          <div className={cardStyles.signalFilterTags} aria-label="Blog tags">
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                className={filter.toLowerCase() === tag.toLowerCase() ? cardStyles.activeTag : ''}
                onClick={() => updateFilter(filter.toLowerCase() === tag.toLowerCase() ? '' : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', marginTop: '20px' }}>
        {filteredPosts.length > 0 ? filteredPosts.map((post, i) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={cardStyles.card}
            data-cursor-no-magnetic
            onClick={(e) => {
              e.preventDefault();
              handleBlogItemClick(post.slug);
            }}
            aria-label={`Read ${post.title}`}
          >
            <div className={cardStyles.cardInner}>
              <span className={cardStyles.cardIndex}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={cardStyles.cardContent}>
                <div className={cardStyles.cardHeader}>
                  <h4 className={cardStyles.cardTitle}>{post.title}</h4>
                  {post.date && <span className={cardStyles.cardDate}>{post.date}</span>}
                </div>
                <p className={cardStyles.cardExcerpt}>{post.excerpt}</p>
                <div className={cardStyles.cardFooter}>
                  {post.tags.length > 0 ? (
                    <div className={cardStyles.cardTags}>
                      {post.tags.map((tag) => (
                        <span key={tag} className={cardStyles.cardTag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  {post.readingTime && (
                    <span className={cardStyles.cardReadingTime}>{post.readingTime}</span>
                  )}
                </div>
              </div>
              <span className={cardStyles.cardArrow}>→</span>
            </div>
          </a>
        )) : (
          <div className={cardStyles.signalEmpty}>NO TRANSMISSIONS MATCH THIS FILTER</div>
        )}
      </div>
    </div>
  );
}
