// Path: src/components/sections/Articles.tsx
// Purpose: Articles and certifications display
// Dependencies: react, @tanstack/react-query

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { SectionHeader } from '../shared/SectionHeader';
import { useNavigate, Link } from 'react-router-dom';



export const Articles: React.FC<{ isHomePage?: boolean }> = ({ isHomePage = false }) => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get('/articles').then(r => r.data).catch(() => ({ data: [] }))
  });

  const { data: certsData } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => api.get('/certifications').then(r => r.data).catch(() => ({ data: [] }))
  });

  const allArticles = Array.isArray(data?.data) ? data.data : [];
  const articles = isHomePage ? allArticles.slice(0, 3) : allArticles;
  const showViewAll = isHomePage && allArticles.length > 3;
  const certifications = Array.isArray(certsData?.data) ? certsData.data : [];

  return (
    <section id="articles" className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] gap-[40px]">
        
        <div>
          <SectionHeader 
            method="GET"
            endpoint="/api/v1/articles"
            title="Articles"
            humanLabel="Writing"
            chips={[{ label: "auth: none" }]}
          />
          <div className="mt-6">
            {articles.map((article: { _id?: string, id?: string, slug?: string, isPublished: boolean, title: string, createdAt: string, readTime?: string }) => (
              <Link key={article._id || article.id} to={`/articles/${article.slug || article._id}`} className="flex items-start gap-[10px] py-[12px] border-b border-border group cursor-pointer no-underline">
                {article.isPublished ? (
                  <span className="font-mono text-[10px] bg-[rgba(74,222,128,0.1)] text-green px-[6px] py-[2px] rounded-[3px] shrink-0">
                    [published]
                  </span>
                ) : (
                  <span className="font-mono text-[10px] bg-[rgba(251,191,36,0.1)] text-amber px-[6px] py-[2px] rounded-[3px] shrink-0">
                    [draft]
                  </span>
                )}
                <div className="flex-1">
                  <h3 className="font-sans text-[13px] text-textPrimary m-0 leading-tight">
                    {article.title}
                  </h3>
                  <div className="font-mono text-[11px] text-textMuted mt-1">
                    {new Date(article.createdAt).toLocaleDateString()} &middot; {article.readTime || '5'} min read
                  </div>
                </div>
                <span className="ml-auto font-mono text-textMuted group-hover:text-green transition-colors duration-150">
                  &rarr;
                </span>
              </Link>
            ))}
            {articles.length === 0 && (
              <div className="text-textMuted font-mono text-[12px]">No articles found.</div>
            )}
            
            {showViewAll && (
              <div className="flex justify-center mt-[32px] w-full">
                <button 
                  onClick={() => navigate('/articles')}
                  className="border border-border text-textMuted bg-transparent font-mono text-[12px] px-[24px] py-[10px] rounded-[4px] hover:border-borderHover hover:text-textPrimary transition-colors cursor-pointer"
                >
                  View All Articles &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeader 
            method="GET"
            endpoint="/api/v1/certifications"
            title="Certifications"
            humanLabel="Credentials"
            chips={[{ label: "auth: none" }]}
          />
          <div className="mt-6">
            {certifications.map((cert: { _id: string; title: string; issuer: string; issueDate: string }) => (
              <div key={cert._id} className="bg-bgSurface border border-border rounded-[6px] px-[14px] py-[12px] mb-[8px]">
                <h4 className="font-sans text-[12px] text-textPrimary m-0">{cert.title}</h4>
                <div className="font-mono text-[11px] text-textMuted mt-1">
                  {cert.issuer} &middot; {new Date(cert.issueDate).getFullYear()}
                </div>
                <div className="font-mono text-[10px] text-green mt-[4px]">
                  verified &check;
                </div>
              </div>
            ))}
            {certifications.length === 0 && (
              <div className="text-textMuted font-mono text-[12px]">No certifications found.</div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
