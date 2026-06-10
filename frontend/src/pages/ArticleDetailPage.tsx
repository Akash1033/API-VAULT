// Path: src/pages/ArticleDetailPage.tsx
// Purpose: Individual article detail page with markdown rendering
// Dependencies: react, react-router-dom, @tanstack/react-query, react-markdown, remark-gfm

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { Navbar } from '../components/layout/Navbar';
import '../styles/markdown.css';

interface Article {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  isPublished: boolean;
  createdAt: string;
  readTime?: string;
  tags?: string[];
  summary?: string;
}

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading, isError } = useQuery<Article>({
    queryKey: ['article', slug],
    queryFn: () => api.get(`/articles/slug/${slug}`).then(r => r.data.data),
    enabled: Boolean(slug),
  });

  const truncateTitle = (title: string, maxLen: number): string => {
    if (title.length <= maxLen) return title;
    return title.slice(0, maxLen) + '…';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-bgBase text-textPrimary selection:bg-green/20 selection:text-green">
      <Navbar />

      <div className="w-full py-[80px] px-[24px] max-w-[760px] mx-auto">

        {/* BACK LINK */}
        <button
          onClick={() => navigate('/articles')}
          className="font-mono text-[11px] text-textMuted hover:text-green transition-colors bg-transparent border-none cursor-pointer mb-[24px] inline-block p-0"
        >
          &larr; Back to Articles
        </button>

        {/* BREADCRUMB */}
        <div className="font-mono text-[12px] text-textMuted mb-[32px]">
          <Link to="/" className="text-textMuted hover:text-green no-underline transition-colors">~/</Link>
          {' → '}
          <Link to="/articles" className="text-textMuted hover:text-green no-underline transition-colors">articles</Link>
          {' → '}
          <span className="text-textPrimary">{article ? truncateTitle(article.title, 40) : slug}</span>
        </div>

        {/* LOADING */}
        {isLoading && (
          <div className="space-y-[16px]">
            <div className="h-[16px] w-[50%] bg-bgRaised rounded skeleton-shimmer" />
            <div className="h-[20px] w-[30%] bg-bgRaised rounded skeleton-shimmer" />
            <div className="h-[40px] w-[90%] bg-bgRaised rounded skeleton-shimmer" />
            <div className="h-[1px] bg-border my-[24px]" />
            <div className="h-[200px] w-full bg-bgRaised rounded skeleton-shimmer" />
          </div>
        )}

        {/* ERROR / 404 */}
        {isError && (
          <div className="py-[60px] flex justify-center w-full">
            <pre className="font-mono text-[12px] leading-[1.9] m-0 text-left bg-bgSurface border border-border p-[24px] rounded-[8px]">
              <span className="text-textMuted">{'{'}</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-green">false</span><span className="text-textMuted">,</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"statusCode"</span><span className="text-textMuted">: </span><span className="text-purple">404</span><span className="text-textMuted">,</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"Article not found"</span><br/>
              <span className="text-textMuted">{'}'}</span>
            </pre>
          </div>
        )}

        {/* ARTICLE CONTENT */}
        {article && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* ARTICLE HEADER */}
            <div className="mb-[40px]">
              <div className="font-mono text-[12px] text-textMuted">
                GET /api/v1/articles/{slug}
                <span className="font-mono text-[11px] text-textMuted opacity-60 ml-3">// Article</span>
              </div>

              {/* Status + meta row */}
              <div className="flex flex-row items-center gap-[12px] mt-[8px] flex-wrap">
                {article.isPublished ? (
                  <span className="font-mono text-[10px] bg-[rgba(74,222,128,0.1)] text-green px-[6px] py-[2px] rounded-[3px]">
                    [published]
                  </span>
                ) : (
                  <span className="font-mono text-[10px] bg-[rgba(251,191,36,0.1)] text-amber px-[6px] py-[2px] rounded-[3px]">
                    [draft]
                  </span>
                )}
                <span className="font-mono text-[11px] text-textMuted">
                  {formatDate(article.createdAt)}
                </span>
                <span className="font-mono text-[11px] text-textMuted">&middot;</span>
                <span className="font-mono text-[11px] text-textMuted">
                  {article.readTime || '5'} min read
                </span>
              </div>

              {/* Title */}
              <h1 className="font-sans text-[32px] font-medium text-textPrimary leading-[1.3] mt-[12px]">
                {article.title}
              </h1>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-row gap-[6px] mt-[12px] flex-wrap">
                  {article.tags.map(tag => (
                    <span key={tag} className="font-mono text-[9px] text-textMuted border border-border px-[8px] py-[1px] rounded-[3px]">
                      {tag.toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="border-t border-border mb-[24px]" />

            {/* MARKDOWN CONTENT */}
            {article.content ? (
              <MarkdownRenderer content={article.content} />
            ) : (
              <div className="py-[40px] text-center">
                <pre className="font-mono text-[12px] leading-[1.9] m-0 inline-block text-left bg-bgSurface border border-border p-[24px] rounded-[8px]">
                  <span className="text-textMuted">{'{'}</span><br/>
                  <span className="text-textMuted">  </span><span className="text-blue">"content"</span><span className="text-textMuted">: </span><span className="text-amber">"No content available for this article."</span><br/>
                  <span className="text-textMuted">{'}'}</span>
                </pre>
              </div>
            )}

            {/* BACK NAVIGATION */}
            <div className="border-t border-border mt-[48px] pt-[24px]">
              <button
                onClick={() => navigate('/articles')}
                className="font-mono text-[12px] text-textMuted hover:text-green transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                &larr; Back to Articles
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * Lazy-loads react-markdown + remark-gfm. Falls back to a <pre> block if the
 * dynamic import hasn't resolved yet (which essentially never happens after
 * the first render because Vite code-splits it).
 */
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [ReactMarkdown, setReactMarkdown] = React.useState<React.ComponentType<{ children: string; remarkPlugins?: unknown[] }> | null>(null);
  const [remarkGfm, setRemarkGfm] = React.useState<unknown[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
    ]).then(([md, gfm]) => {
      if (!cancelled) {
        setReactMarkdown(() => md.default as React.ComponentType<{ children: string; remarkPlugins?: unknown[] }>);
        setRemarkGfm([gfm.default]);
      }
    });

    return () => { cancelled = true; };
  }, []);

  if (!ReactMarkdown) {
    // Fallback while loading — renders raw text in a styled pre
    return (
      <pre className="font-mono text-[13px] text-textSecondary leading-[1.8] whitespace-pre-wrap">
        {content}
      </pre>
    );
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={remarkGfm || undefined}>
        {content}
      </ReactMarkdown>
    </div>
  );
};


