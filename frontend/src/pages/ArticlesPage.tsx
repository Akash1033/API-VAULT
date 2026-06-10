// Path: src/pages/ArticlesPage.tsx
// Purpose: Full paginated articles listing
// Dependencies: react, @tanstack/react-query, react-router-dom, framer-motion

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Pagination } from '../components/shared/Pagination';
import { SectionHeader } from '../components/shared/SectionHeader';

interface Article {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  readTime?: string;
  tags?: string[];
}

interface ArticlesResponse {
  success: boolean;
  data: Article[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const TAGS = ['All', 'Architecture', 'Node.js', 'Performance', 'Database', 'Career'];

export const ArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const LIMIT = 8;
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState('All');

  const { data: response, isLoading } = useQuery<ArticlesResponse>({
    queryKey: ['articles-page', page, activeTag],
    queryFn: () => api.get('/articles', { 
      params: { 
        page, 
        limit: LIMIT,
        isPublished: true,
        ...(activeTag !== 'All' ? { tag: activeTag } : {}) 
      } 
    }).then(r => r.data)
  });

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    setPage(1);
  };

  const articles = Array.isArray(response?.data) ? response.data : [];
  // Standardize metadata fallback in case the API doesn't support full pagination meta yet
  const meta = response?.meta || { 
    total: articles.length, 
    page, 
    limit: LIMIT, 
    totalPages: Math.ceil(articles.length / LIMIT) || 1 
  };

  return (
    <div className="w-full min-h-screen py-[80px] px-[24px] max-w-[1200px] mx-auto">
      
      {/* BACK LINK */}
      <button 
        onClick={() => navigate('/')}
        className="font-mono text-[11px] text-textMuted hover:text-green transition-colors bg-transparent border-none cursor-pointer mb-[24px] inline-block p-0"
      >
        &larr; Back to Portfolio
      </button>

      {/* BREADCRUMB */}
      <div className="font-mono text-[12px] text-textMuted mb-[24px]">
        <button onClick={() => navigate('/')} className="text-textMuted hover:text-green bg-transparent border-none cursor-pointer p-0 inline">~/</button>
        {' → '}
        <span className="text-textPrimary">articles</span>
      </div>

      <SectionHeader 
        method="GET"
        endpoint="/api/v1/articles"
        title="Articles"
        humanLabel="Writing"
        chips={[
          { label: 'pagination: true' }, 
          { label: 'auth: none' },
          { label: `${meta.total} results`, isResult: true }
        ]}
      />

      <div className="flex flex-row items-center justify-between mb-[32px] mt-[24px]">
        <div className="flex flex-row gap-2 flex-wrap">
          {TAGS.map(tag => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`font-mono text-[10px] py-[4px] px-[12px] rounded-[12px] border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.3)] text-amber'
                    : 'bg-transparent border-border text-textMuted hover:border-borderHover'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="font-mono text-[10px] bg-[rgba(74,222,128,0.1)] text-green px-[8px] py-[3px] rounded-[4px] border border-[rgba(74,222,128,0.2)] hidden sm:block">
          status: published
        </div>
      </div>

      <div className="flex flex-col w-full border-t border-border mt-[16px]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-[16px] border-b border-border flex items-start gap-[20px]">
              <div className="w-[80px] h-[40px] bg-bgRaised rounded skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-[8px]">
                <div className="w-[40px] h-[14px] bg-bgRaised rounded skeleton-shimmer" />
                <div className="w-[60%] h-[20px] bg-bgRaised rounded skeleton-shimmer" />
              </div>
            </div>
          ))
        ) : articles.length === 0 ? (
          <div className="py-[60px] flex justify-center w-full">
            <pre className="font-mono text-[12px] leading-[1.9] m-0 text-left bg-bgSurface border border-border p-[24px] rounded-[8px]">
              <span className="text-textMuted">{'{'}</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"data"</span><span className="text-textMuted">: [],</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"No articles published yet."</span><br/>
              <span className="text-textMuted">{'}'}</span>
            </pre>
          </div>
        ) : (
          articles.map((article) => {
            const date = new Date(article.createdAt);
            const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
            const day = date.getDate();
            const year = date.getFullYear();

            return (
              <div 
                key={article._id || article.id} 
                onClick={() => navigate(`/articles/${article.slug}`)}
                className="flex items-start gap-[20px] py-[16px] border-b border-border hover:bg-bgRaised cursor-pointer transition-colors group px-[8px] -mx-[8px] rounded-[6px]"
              >
                {/* LEFT: Date Block */}
                <div className="flex flex-col items-center justify-center shrink-0 w-[80px]">
                  <div className="font-mono text-[10px] text-textMuted uppercase">{month}</div>
                  <div className="font-sans text-[24px] font-medium text-textPrimary leading-none my-[4px]">{day}</div>
                  <div className="font-mono text-[10px] text-textMuted">{year}</div>
                </div>

                {/* CENTER: Info */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="mb-[4px]">
                    {article.isPublished ? (
                      <span className="font-mono text-[10px] bg-[rgba(74,222,128,0.1)] text-green px-[6px] py-[2px] rounded-[3px]">
                        [published]
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] bg-[rgba(251,191,36,0.1)] text-amber px-[6px] py-[2px] rounded-[3px]">
                        [draft]
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans text-[16px] font-medium text-textPrimary my-0 group-hover:text-green transition-colors duration-150">
                    {article.title}
                  </h3>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-row gap-[6px] mt-[6px] flex-wrap">
                      {article.tags.map(tag => (
                        <span key={tag} className="font-mono text-[9px] text-textMuted border border-border px-[8px] py-[1px] rounded-[3px]">
                          {tag.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: Meta & Arrow */}
                <div className="shrink-0 text-right flex flex-col items-end pt-[2px]">
                  <div className="font-mono text-[11px] text-textMuted">
                    {article.readTime || '5'} min read
                  </div>
                  <div className="font-mono text-textMuted group-hover:text-green transition-colors mt-[4px]">
                    &rarr;
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && meta.totalPages > 1 && (
        <Pagination 
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
        />
      )}

    </div>
  );
};


