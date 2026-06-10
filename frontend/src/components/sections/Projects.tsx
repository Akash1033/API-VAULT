// Path: src/components/sections/Projects.tsx
// Purpose: Projects section with Card and JSON view modes
// Dependencies: react, framer-motion, @tanstack/react-query, react-router-dom

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { SectionHeader } from '../shared/SectionHeader';

import { ProjectCard, type Project } from '../shared/ProjectCard';

interface ProjectsResponse {
  success: boolean;
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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
  if (typeof val === 'number') {
    return <span className="text-purple">{val}</span>;
  }
  if (typeof val === 'boolean' || val === null) {
    return <span className="text-green">{String(val)}</span>;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-textMuted">[]</span>;
    return (
      <span className="text-textMuted">
        [
        {val.map((item, i) => (
          <React.Fragment key={i}>
            {renderValue(item, '')}
            {i < val.length - 1 ? ', ' : ''}
          </React.Fragment>
        ))}
        ]
      </span>
    );
  }
  return <span className="text-amber">"{String(val)}"</span>;
};

const renderProjectJSON = (response: ProjectsResponse) => {
  return (
    <pre className="font-mono text-[11px] leading-[1.9] m-0 whitespace-pre-wrap break-all">
      <span className="text-textMuted">{'{'}</span><br />
      <span className="text-textMuted">  </span><span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-green">true</span><span className="text-textMuted">,</span><br />
      <span className="text-textMuted">  </span><span className="text-blue">"data"</span><span className="text-textMuted">: [</span><br />
      {response.data.map((p, i) => (
        <React.Fragment key={p._id}>
          <span className="text-textMuted">    {'{'}</span><br />
          {Object.entries(p).map(([k, v], idx, arr) => (
            <React.Fragment key={k}>
              <span className="text-textMuted">      </span>
              <span className="text-blue">"{k}"</span>
              <span className="text-textMuted">: </span>
              {renderValue(v, k)}
              <span className="text-textMuted">{idx < arr.length - 1 ? ',' : ''}</span>
              <br />
            </React.Fragment>
          ))}
          <span className="text-textMuted">    {'}'}{i < response.data.length - 1 ? ',' : ''}</span><br />
        </React.Fragment>
      ))}
      <span className="text-textMuted">  ],</span><br />
      <span className="text-textMuted">  </span><span className="text-blue">"meta"</span><span className="text-textMuted">: {'{'}</span><br />
      {Object.entries(response.meta).map(([k, v], idx, arr) => (
        <React.Fragment key={k}>
          <span className="text-textMuted">    </span>
          <span className="text-blue">"{k}"</span>
          <span className="text-textMuted">: </span>
          {renderValue(v, k)}
          <span className="text-textMuted">{idx < arr.length - 1 ? ',' : ''}</span><br />
        </React.Fragment>
      ))}
      <span className="text-textMuted">  {'}'}</span><br />
      <span className="text-textMuted">{'}'}</span>
    </pre>
  );
};

;

const SkeletonCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-full">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[400px] rounded-[8px] bg-bgRaised skeleton-shimmer w-full" />
    ))}
  </div>
);

const TAGS = ['All', 'Node.js', 'MongoDB', 'Redis', 'TypeScript', 'Docker', 'Kubernetes'];

export const Projects: React.FC<{ isHomePage?: boolean }> = ({ isHomePage = false }) => {
  const [view, setView] = useState<'cards' | 'json'>('cards');
  const [activeTag, setActiveTag] = useState('All');
  const navigate = useNavigate();

  const { data: response, isLoading } = useQuery<ProjectsResponse>({
    queryKey: ['projects', activeTag],
    queryFn: () => api.get('/projects', { params: activeTag !== 'All' ? { tags: activeTag } : undefined }).then(r => r.data)
  });

  const allProjects = Array.isArray(response?.data) ? response.data : [];
  const projects = isHomePage ? allProjects.slice(0, 4) : allProjects;
  const showViewAll = isHomePage && allProjects.length > 4;

  const rightSlot = (
    <div className="flex bg-bgRaised p-1 rounded-[8px] border border-border">
      <button
        onClick={() => setView('cards')}
        className={`px-3 py-1 font-mono text-[11px] rounded-[6px] transition-colors ${view === 'cards'
            ? 'bg-[rgba(251,191,36,0.1)] text-amber border border-[rgba(251,191,36,0.3)]'
            : 'text-textMuted border border-transparent hover:text-textSecondary'
          }`}
      >
        Cards
      </button>
      <button
        onClick={() => setView('json')}
        className={`px-3 py-1 font-mono text-[11px] rounded-[6px] transition-colors ${view === 'json'
            ? 'bg-[rgba(251,191,36,0.1)] text-amber border border-[rgba(251,191,36,0.3)]'
            : 'text-textMuted border border-transparent hover:text-textSecondary'
          }`}
      >
        JSON
      </button>
    </div>
  );

  return (
    <section id="projects" className="py-[80px] px-6 max-w-[1200px] mx-auto w-full">
      <SectionHeader
        method="GET"
        endpoint="/api/v1/projects"
        title="Projects"
        humanLabel="My Work"
        chips={[
          { label: 'pagination: true' },
          { label: 'auth: none' },
          { label: 'cache: redis · 5m TTL' },
          { label: `${allProjects.length} results`, isResult: true }
        ]}
        rightSlot={rightSlot}
      />

      <div className="flex flex-row items-center justify-between mb-[28px] mt-6">
        <div className="font-mono text-[11px] text-textMuted">
          ?tag={activeTag.toLowerCase()}
        </div>
        <div className="flex flex-row gap-2 flex-wrap justify-end">
          {TAGS.map(tag => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`font-mono text-[10px] py-[4px] px-[12px] rounded-[12px] border transition-colors ${isActive
                    ? 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.3)] text-amber'
                    : 'bg-transparent border-border text-textMuted hover:border-borderHover'
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'cards' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {isLoading ? <SkeletonCards /> : (
              <>
                <div
                  className="w-full grid gap-[20px] grid-cols-1 md:grid-cols-2"
                >
                  {projects.map(p => <ProjectCard key={p._id} project={p} />)}
                </div>

                {showViewAll && (
                  <div className="flex justify-center mt-[32px] w-full">
                    <button
                      onClick={() => navigate('/projects')}
                      className="border border-[0.5px] border-border text-textMuted bg-transparent font-mono text-[12px] px-[28px] py-[10px] rounded-[4px] hover:border-borderHover hover:text-textPrimary transition-colors cursor-pointer"
                    >
                      View All Projects →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="json"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? <div className="h-[400px] rounded-[8px] bg-bgRaised skeleton-shimmer w-full" /> : (
              <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] max-h-[600px] overflow-y-auto w-full">
                {/* TERMINAL BAR */}
                <div className="h-[28px] bg-bgRaised rounded-t-[6px] -mx-[20px] -mt-[20px] mb-[16px] px-[12px] flex items-center gap-[8px]">
                  <div className="flex gap-[6px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#ff5f57]" />
                    <div className="w-[8px] h-[8px] rounded-full bg-[#febc2e]" />
                    <div className="w-[8px] h-[8px] rounded-full bg-[#28c840]" />
                  </div>
                  <div className="font-mono text-[10px] text-textMuted ml-auto">
                    GET /api/v1/projects → 200 OK
                  </div>
                </div>

                {/* JSON CONTENT */}
                {response && renderProjectJSON(response)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
