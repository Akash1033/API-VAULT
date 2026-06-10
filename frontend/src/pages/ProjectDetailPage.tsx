// Path: src/pages/ProjectDetailPage.tsx
// Purpose: Individual project detail page with full metadata and JSON sidebar
// Dependencies: react, react-router-dom, @tanstack/react-query, framer-motion

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { Navbar } from '../components/layout/Navbar';
import type { Project } from '../components/shared/ProjectCard';

const getTechColorClass = (tech: string): string => {
  const lower = tech.toLowerCase();
  if (lower.includes('node') || lower.includes('deno') || lower.includes('express') || lower.includes('typescript')) {
    return 'border-[rgba(74,222,128,0.3)] text-green bg-[rgba(74,222,128,0.06)]';
  }
  if (lower.includes('mongo') || lower.includes('redis') || lower.includes('postgre') || lower.includes('sql') || lower.includes('db')) {
    return 'border-[rgba(96,165,250,0.3)] text-blue bg-[rgba(96,165,250,0.06)]';
  }
  if (lower.includes('docker') || lower.includes('k8s') || lower.includes('kubernetes') || lower.includes('nginx') || lower.includes('aws')) {
    return 'border-[rgba(251,191,36,0.3)] text-amber bg-[rgba(251,191,36,0.06)]';
  }
  return 'border-border text-textMuted bg-transparent';
};

const renderValue = (val: unknown, keyName: string): React.ReactNode => {
  if (typeof val === 'string') {
    if ((keyName === 'githubUrl' || keyName === 'liveUrl') && val.startsWith('http')) {
      return (
        <>
          <span className="text-amber">"</span>
          <a
            href={val}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green hover:text-amber underline underline-offset-[3px]"
          >
            {val}
          </a>
          <span className="text-amber">"</span>
        </>
      );
    }
    return <span className="text-amber">"{val}"</span>;
  }
  if (typeof val === 'number') return <span className="text-purple">{val}</span>;
  if (typeof val === 'boolean' || val === null) return <span className="text-green">{String(val)}</span>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-textMuted">[]</span>;
    return (
      <span className="text-textMuted">
        [{val.map((item, i) => (
          <React.Fragment key={i}>
            {renderValue(item, '')}
            {i < val.length - 1 ? ', ' : ''}
          </React.Fragment>
        ))}]
      </span>
    );
  }
  return <span className="text-amber">"{String(val)}"</span>;
};

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError } = useQuery<Project>({
    queryKey: ['project', slug],
    queryFn: () => api.get(`/projects/${slug}`).then(r => r.data.data),
    enabled: Boolean(slug),
  });

  const statusLabel = project?.isPublished ? 'published' : 'draft';
  const statusColor = project?.isPublished ? 'text-green' : 'text-amber';

  // Metadata keys for the JSON sidebar
  const metadataKeys: Array<keyof Project> = ['_id', 'title', 'slug', 'featured', 'isPublished', 'githubUrl', 'liveUrl', 'createdAt'];

  return (
    <div className="min-h-screen bg-bgBase text-textPrimary selection:bg-green/20 selection:text-green">
      <Navbar />

      <div className="w-full py-[80px] px-[24px] max-w-[900px] mx-auto">

        {/* BACK LINK */}
        <button
          onClick={() => navigate('/projects')}
          className="font-mono text-[11px] text-textMuted hover:text-green transition-colors bg-transparent border-none cursor-pointer mb-[24px] inline-block p-0"
        >
          &larr; Back to Projects
        </button>

        {/* BREADCRUMB */}
        <div className="font-mono text-[12px] text-textMuted mb-[32px]">
          <Link to="/" className="text-textMuted hover:text-green no-underline transition-colors">~/</Link>
          {' → '}
          <Link to="/projects" className="text-textMuted hover:text-green no-underline transition-colors">projects</Link>
          {' → '}
          <span className="text-textPrimary">{project?.title || slug}</span>
        </div>

        {/* LOADING */}
        {isLoading && (
          <div className="space-y-[24px]">
            <div className="h-[20px] w-[60%] bg-bgRaised rounded skeleton-shimmer" />
            <div className="h-[36px] w-[80%] bg-bgRaised rounded skeleton-shimmer" />
            <div className="h-[400px] w-full bg-bgRaised rounded-[8px] skeleton-shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] gap-[40px]">
              <div className="space-y-[16px]">
                <div className="h-[28px] w-[70%] bg-bgRaised rounded skeleton-shimmer" />
                <div className="h-[80px] w-full bg-bgRaised rounded skeleton-shimmer" />
              </div>
              <div className="h-[300px] bg-bgRaised rounded-[8px] skeleton-shimmer" />
            </div>
          </div>
        )}

        {/* ERROR / 404 */}
        {isError && (
          <div className="py-[60px] flex justify-center w-full">
            <pre className="font-mono text-[12px] leading-[1.9] m-0 text-left bg-bgSurface border border-border p-[24px] rounded-[8px]">
              <span className="text-textMuted">{'{'}</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-green">false</span><span className="text-textMuted">,</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"statusCode"</span><span className="text-textMuted">: </span><span className="text-purple">404</span><span className="text-textMuted">,</span><br/>
              <span className="text-textMuted">  </span><span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"Project not found"</span><br/>
              <span className="text-textMuted">{'}'}</span>
            </pre>
          </div>
        )}

        {/* PROJECT CONTENT */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* PAGE TOP BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-[16px] mb-[32px]">
              <div>
                <div className="font-mono text-[12px] text-textMuted">
                  GET /api/v1/projects/{slug}
                  <span className="font-mono text-[11px] text-textMuted opacity-60 ml-3">// Project Detail</span>
                </div>
                <div className="flex flex-row items-center gap-[8px] mt-[8px] flex-wrap">
                  <span className="font-mono text-[10px] bg-[rgba(74,222,128,0.12)] text-green px-[8px] py-[2px] rounded-[10px]">
                    200 OK
                  </span>
                  <span className="font-mono text-[10px] text-textMuted">· 38ms</span>
                  <span className={`font-mono text-[10px] ${statusColor}`}>
                    ● {statusLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-row gap-[10px]">
                {project.githubUrl && (
                  <button
                    onClick={() => window.open(project.githubUrl, '_blank', 'noopener,noreferrer')}
                    className="border border-border text-textMuted bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:border-borderHover hover:text-textPrimary transition-colors cursor-pointer"
                  >
                    GitHub Repo ↗
                  </button>
                )}
                {project.liveUrl && (
                  <button
                    onClick={() => window.open(project.liveUrl, '_blank', 'noopener,noreferrer')}
                    className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] transition-colors cursor-pointer"
                  >
                    Live Demo ↗
                  </button>
                )}
              </div>
            </div>

            {/* PROJECT IMAGE */}
            <div className="w-full max-h-[400px] overflow-hidden rounded-[8px] border border-border mb-[32px]">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-[280px] bg-bgRaised flex flex-col justify-center p-[32px] font-mono text-[11px] text-textMuted leading-[1.8] opacity-60">
                  <div>$ node dist/server.js</div>
                  <div>► Server running on :5000</div>
                  <div>► MongoDB connected</div>
                  <div>► Redis connected</div>
                  <div>► Routes registered: 24</div>
                  <div>► Health check: OK</div>
                </div>
              )}
            </div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] gap-[40px]">

              {/* LEFT COLUMN */}
              <div>
                <h1 className="font-sans text-[28px] font-medium text-textPrimary mb-[12px] leading-tight">
                  {project.title}
                </h1>

                <p className="font-sans text-[15px] text-textSecondary leading-[1.8] mb-[24px]">
                  {project.description}
                </p>

                {/* TECH STACK */}
                <div>
                  <div className="font-mono text-[11px] text-textMuted mb-[10px]">
                    // tech_stack
                  </div>
                  <div className="flex flex-row flex-wrap gap-[6px]">
                    {project.technologies?.map(tech => (
                      <span key={tech} className={`font-mono text-[10px] py-[3px] px-[10px] rounded-[4px] border ${getTechColorClass(tech)}`}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — JSON RECORD */}
              <div className="bg-bgSurface border border-border rounded-[8px] p-[16px] h-fit">
                <div className="font-mono text-[10px] text-textMuted mb-[10px]">
                  // project metadata
                </div>
                <pre className="font-mono text-[11px] leading-[1.9] m-0 whitespace-pre-wrap break-all">
                  <span className="text-textMuted">{'{'}</span><br/>
                  {metadataKeys.map((key, idx) => {
                    const val = project[key];
                    if (val === undefined) return null;
                    return (
                      <React.Fragment key={key}>
                        <span className="text-textMuted">  </span>
                        <span className="text-blue">"{key}"</span>
                        <span className="text-textMuted">: </span>
                        {renderValue(val, key)}
                        <span className="text-textMuted">{idx < metadataKeys.length - 1 ? ',' : ''}</span>
                        <br/>
                      </React.Fragment>
                    );
                  })}
                  <span className="text-textMuted">{'}'}</span>
                </pre>
              </div>

            </div>

            {/* BACK NAVIGATION */}
            <div className="border-t border-border mt-[48px] pt-[24px] flex flex-row justify-between items-center">
              <button
                onClick={() => navigate('/projects')}
                className="font-mono text-[12px] text-textMuted hover:text-green transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                &larr; Back to Projects
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};


