// Path: src/components/shared/ProjectCard.tsx
// Purpose: Reusable Project Card with image and clean modern UI
// Dependencies: react, useProjectTracker

import React, { useEffect, useRef } from 'react';
import { useProjectTracker } from '../../hooks/useProjectTracker';

export interface Project {
  _id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  category?: 'backend' | 'fullstack' | 'devops' | 'tool';
  githubUrl?: string;
  liveUrl?: string;
  thumbnailUrl?: string;
  highlights?: string[];
  status?: 'production' | 'development' | 'archived';
  isPublished: boolean;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
}

function getChipCategory(tech: string): 'runtime' | 'database' | 'infra' | 'other' {
  const t = tech.toLowerCase();
  if (['node.js', 'nodejs', 'deno', 'bun', 'python', 'go', 'rust', 'typescript', 'javascript'].some(r => t.includes(r))) return 'runtime';
  if (['mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'sqlite'].some(r => t.includes(r))) return 'database';
  if (['docker', 'kubernetes', 'k8s', 'nginx', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd'].some(r => t.includes(r))) return 'infra';
  return 'other';
}

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { trackProjectView } = useProjectTracker();
  const trackedRef = useRef(false);

  // Track impression when card becomes 50% visible (once per mount)
  useEffect(() => {
    const currentCard = cardRef.current;
    if (!currentCard) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          trackProjectView(project);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(currentCard);
    return () => observer.disconnect();
  }, [project, trackProjectView]);

  const terminalLines = [
    { prefix: '$', text: ' node dist/server.js', color: 'var(--text-secondary)' },
    { prefix: '►', text: ' Server running on :5000', color: 'var(--green)' },
    { prefix: '►', text: ' MongoDB connected (4ms)', color: 'var(--green)' },
    { prefix: '►', text: ' Redis connected (1ms)', color: 'var(--green)' },
    { prefix: '►', text: ` Routes registered: ${(project.technologies?.length || 0) + 8}`, color: 'var(--green)' },
  ];

  return (
    <div
      ref={cardRef}
      data-testid="project-card"
      className="w-full flex flex-col bg-bgSurface border border-border rounded-[8px] overflow-hidden transition-all duration-200 hover:border-borderHover hover:-translate-y-[3px]"
    >
      {/* ZONE 1 — IMAGE AREA */}
      <div className="relative h-[180px] overflow-hidden shrink-0">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div className="flex flex-col justify-center items-start p-[16px_20px] bg-bgRaised h-full w-full">
            {terminalLines.map((line, idx) => (
              <div key={idx} className="flex gap-[6px] font-mono text-[10px] leading-[1.9]">
                <span style={{ color: line.prefix === '►' ? 'var(--green)' : line.color }}>{line.prefix}</span>
                <span style={{ color: 'var(--text-muted)' }}>{line.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* GRADIENT OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,12,11,0.85) 0%, rgba(10,12,11,0.3) 50%, transparent 100%)' }}
        />

        {/* TOP-LEFT BADGE */}
        <div
          className="absolute top-[10px] left-[12px] font-mono text-[9px] py-[2px] px-[8px] rounded-[20px] z-10 border"
          style={{
            backgroundColor: (project.status || 'production') === 'production' ? 'rgba(74,222,128,0.15)' :
                             (project.status || 'production') === 'development' ? 'rgba(96,165,250,0.15)' :
                             'rgba(251,191,36,0.15)',
            borderColor: (project.status || 'production') === 'production' ? 'rgba(74,222,128,0.3)' :
                         (project.status || 'production') === 'development' ? 'rgba(96,165,250,0.3)' :
                         'rgba(251,191,36,0.3)',
            color: (project.status || 'production') === 'production' ? 'var(--green)' :
                   (project.status || 'production') === 'development' ? 'var(--blue)' :
                   'var(--amber)'
          }}
        >
          ● {project.status || 'production'}
        </div>

        {/* BOTTOM OVERLAY CONTENT */}
        <div className="absolute bottom-0 left-0 right-0 p-[10px_14px] z-10">
          <h3 className="font-sans text-[15px] font-medium text-[#ffffff] leading-[1.3] m-0">
            {project.title}
          </h3>
          <div className="font-mono text-[9px] text-[rgba(255,255,255,0.45)] mt-[3px]">
            41ms · 1.2kb
          </div>
        </div>
      </div>

      {/* ZONE 2 — CARD BODY */}
      <div className="p-[14px_16px] flex flex-col gap-[10px] flex-1">
        {/* DESCRIPTION */}
        <p
          className="font-sans text-[12px] text-textSecondary leading-[1.6] m-0 overflow-hidden"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {project.description}
        </p>

        {/* HIGHLIGHTS ROW */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="font-mono text-[10px] text-textMuted mt-[2px]">
            <span style={{ color: 'var(--green)' }}>// &rarr;</span> {project.highlights[0]}
          </div>
        )}

        {/* TECH STACK CHIPS */}
        <div className="flex flex-row flex-wrap gap-[5px]">
          {project.technologies?.slice(0, 4).map(tech => {
            const category = getChipCategory(tech);
            return (
              <span
                key={tech}
                className="font-mono text-[9px] py-[2px] px-[7px] rounded-[4px] border border-[0.5px]"
                style={{
                  backgroundColor: category === 'runtime' ? 'rgba(74,222,128,0.08)' :
                                   category === 'database' ? 'rgba(96,165,250,0.08)' :
                                   category === 'infra' ? 'rgba(251,191,36,0.08)' :
                                   'var(--bg-raised)',
                  borderColor: category === 'runtime' ? 'rgba(74,222,128,0.25)' :
                               category === 'database' ? 'rgba(96,165,250,0.25)' :
                               category === 'infra' ? 'rgba(251,191,36,0.25)' :
                               'var(--border)',
                  color: category === 'runtime' ? 'var(--green)' :
                         category === 'database' ? 'var(--blue)' :
                         category === 'infra' ? 'var(--amber)' :
                         'var(--text-muted)'
                }}
              >
                {tech}
              </span>
            );
          })}
          {project.technologies?.length > 4 && (
            <span className="font-mono text-[9px] py-[2px] px-[7px] rounded-[4px] border border-[0.5px] border-border bg-bgRaised text-textMuted">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-row gap-[8px] border-t border-[0.5px] border-border pt-[12px] mt-auto">
          {(!project.liveUrl && !project.githubUrl) ? (
            <span className="font-mono text-[10px] text-textMuted opacity-40">
              // no links available
            </span>
          ) : (
            <>
              {project.liveUrl && project.liveUrl !== '' && (
                <button
                  onClick={() => window.open(project.liveUrl, '_blank', 'noopener,noreferrer')}
                  className="flex-1 bg-[rgba(74,222,128,0.08)] border border-[0.5px] border-[rgba(74,222,128,0.3)] text-green font-mono text-[10px] py-[7px] px-[14px] rounded-[6px] text-center cursor-pointer transition-colors hover:bg-[rgba(74,222,128,0.15)]"
                >
                  Live Demo ↗
                </button>
              )}
              {project.githubUrl && project.githubUrl !== '' && (
                <button
                  onClick={() => window.open(project.githubUrl, '_blank', 'noopener,noreferrer')}
                  className="flex-1 bg-transparent border border-[0.5px] border-border text-textSecondary font-mono text-[10px] py-[7px] px-[14px] rounded-[6px] text-center cursor-pointer transition-colors hover:bg-bgRaised hover:border-borderHover hover:text-textPrimary"
                >
                  GitHub Repo ↗
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
