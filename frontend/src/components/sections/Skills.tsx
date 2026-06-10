// Path: src/components/sections/Skills.tsx
// Purpose: Skills section with categorized hex grid and raw JSON view
// Dependencies: react, framer-motion, @tanstack/react-query

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/axios';
import { SectionHeader } from '../shared/SectionHeader';
import { SkillHex } from '../shared/SkillHex';
import { getCategoryDisplayName, CATEGORY_ORDER } from '../../utils/skillUtils';

interface Skill {
  _id: string;
  name: string;
  category: string;
  proficiency: number;
  yearsOfExperience?: number;
  isPublished: boolean;
  order: number;
  iconUrl?: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: Record<string, Skill[]> | { skills: Skill[] } | Skill[];
  meta: {
    total: number;
    grouped: boolean;
  };
}

export const Skills: React.FC<{ isHomePage?: boolean }> = ({ isHomePage = false }) => {
  const [view, setView] = useState<'cards' | 'json'>('cards');
  const [showAll, setShowAll] = useState(false);
  const isLimitedView = isHomePage && !showAll;

  const { data: response, isLoading } = useQuery<APIResponse>({
    queryKey: ['skills', 'grouped'],
    queryFn: () => api.get('/skills', { params: { grouped: true, isPublished: true } }).then(r => r.data)
  });

  const skills = useMemo(() => {
    if (!response?.data) return [];
    if (Array.isArray(response.data)) return response.data;
    if ('skills' in response.data && Array.isArray(response.data.skills)) return response.data.skills;
    
    // Flatten grouped keys if the API returns a grouped object
    const flattened: Skill[] = [];
    Object.values(response.data).forEach(group => {
      if (Array.isArray(group)) flattened.push(...group as Skill[]);
    });
    return flattened;
  }, [response]);

  const grouped = useMemo(() => {
    if (!skills.length) return {};
    return CATEGORY_ORDER.reduce<Record<string, Skill[]>>((acc, cat) => {
      const inCat = skills.filter((s: Skill) => s.category.toLowerCase() === cat && s.isPublished === true);
      if (inCat.length > 0) {
        acc[cat] = inCat.sort((a: Skill, b: Skill) => (a.order || 0) - (b.order || 0));
      }
      return acc;
    }, {});
  }, [skills]);

  const totalCount = skills.filter((s: Skill) => s.isPublished === true).length;

  const categoriesToRender = useMemo(() => {
    const cats = Object.keys(grouped);
    return isLimitedView ? cats.slice(0, 3) : cats;
  }, [grouped, isLimitedView]);

  const rightSlot = (
    <div className="flex bg-bgRaised p-[4px] rounded-[8px] border border-border">
      <button
        onClick={() => setView('cards')}
        className={`px-[12px] py-[4px] font-mono text-[11px] rounded-[6px] transition-colors ${
          view === 'cards' 
            ? 'bg-[rgba(251,191,36,0.1)] text-amber border border-[rgba(251,191,36,0.3)]' 
            : 'text-textMuted border border-transparent hover:text-textSecondary'
        }`}
      >
        Cards
      </button>
      <button
        onClick={() => setView('json')}
        className={`px-[12px] py-[4px] font-mono text-[11px] rounded-[6px] transition-colors ${
          view === 'json' 
            ? 'bg-[rgba(251,191,36,0.1)] text-amber border border-[rgba(251,191,36,0.3)]' 
            : 'text-textMuted border border-transparent hover:text-textSecondary'
        }`}
      >
        JSON
      </button>
    </div>
  );

  const renderSkillsJSON = (groupedData: Record<string, Skill[]>, total: number) => {
    const apiResponseObj = {
      success: true,
      message: "Skills retrieved successfully",
      data: groupedData,
      meta: { total, grouped: true }
    };

    const formatValue = (val: unknown, indent: number): React.ReactNode => {
      const pad = '  '.repeat(indent);
      const padInner = '  '.repeat(indent + 1);

      if (typeof val === 'string') return <span className="text-amber">"{val}"</span>;
      if (typeof val === 'number') return <span className="text-purple">{val}</span>;
      if (typeof val === 'boolean' || val === null) return <span className="text-green">{String(val)}</span>;
      
      if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-textMuted">[]</span>;
        return (
          <span className="text-textMuted">
            [<br />
            {val.map((item, i) => (
              <React.Fragment key={i}>
                <span className="text-textMuted">{padInner}</span>
                {formatValue(item, indent + 1)}
                <span className="text-textMuted">{i < val.length - 1 ? ',' : ''}</span>
                <br />
              </React.Fragment>
            ))}
            <span className="text-textMuted">{pad}</span>]
          </span>
        );
      }

      if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length === 0) return <span className="text-textMuted">{'{ }'}</span>;
        return (
          <span className="text-textMuted">
            {'{'}<br />
            {keys.map((k, i) => (
              <React.Fragment key={k}>
                <span className="text-textMuted">{padInner}</span>
                <span className="text-blue">"{k}"</span>
                <span className="text-textMuted">: </span>
                {formatValue(obj[k], indent + 1)}
                <span className="text-textMuted">{i < keys.length - 1 ? ',' : ''}</span>
                <br />
              </React.Fragment>
            ))}
            <span className="text-textMuted">{pad}</span>{'}'}
          </span>
        );
      }

      return <span className="text-amber">"{String(val)}"</span>;
    };

    return (
      <pre className="font-mono text-[11px] leading-[1.9] m-0 whitespace-pre-wrap break-all">
        {formatValue(apiResponseObj, 0)}
      </pre>
    );
  };

  return (
    <section id="skills" className="py-[80px] px-6 max-w-[1200px] mx-auto">
      <SectionHeader 
        method="GET"
        endpoint="/api/v1/skills?grouped=true"
        title="Skills"
        humanLabel="Tech Stack"
        chips={[
          { label: 'grouped: true' }, 
          { label: 'auth: none' }, 
          { label: `${totalCount} skills`, isResult: true }
        ]}
        rightSlot={rightSlot}
      />

      <div className="mt-[32px]">
        <AnimatePresence mode="wait">
          {view === 'cards' ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div>
                  {[1, 2, 3].map(catI => (
                    <div key={catI} className="mb-[32px]">
                      <div className="flex flex-row items-center gap-[12px] mb-[16px]">
                        <div className="flex-1 h-[0.5px] bg-border" />
                        <div className="font-mono text-[10px] text-textMuted whitespace-nowrap">
                          // Loading
                        </div>
                        <div className="flex-1 h-[0.5px] bg-border" />
                      </div>
                      <div className="flex flex-wrap gap-[12px] items-start">
                        {[1, 2, 3, 4].map(hexI => (
                          <div key={hexI} className="flex flex-col items-center gap-[6px]">
                            <div 
                              className="w-[72px] h-[72px] bg-bgRaised skeleton-shimmer"
                              style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' }}
                            />
                            <div className="w-[50px] h-[8px] bg-bgRaised rounded-[2px] skeleton-shimmer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="bg-bgSurface border border-border rounded-[8px] py-[60px] flex flex-col items-center justify-center">
                  <pre className="font-mono text-[11px] text-textMuted">
                    {`{\n  "data": [],\n  "message": "No skills published yet."\n}`}
                  </pre>
                </div>
              ) : (
                <div>
                  {categoriesToRender.map(cat => {
                    const skillsInCat = isLimitedView ? grouped[cat].slice(0, 5) : grouped[cat];
                    return (
                      <div key={cat} className="mb-[32px]">
                        <div className="flex flex-row items-center gap-[12px] mb-[16px]">
                          <div className="flex-1 h-[0.5px] bg-border" />
                          <div className="font-mono text-[10px] text-textMuted whitespace-nowrap">
                            // {getCategoryDisplayName(cat)}
                          </div>
                          <div className="flex-1 h-[0.5px] bg-border" />
                        </div>
                        <div className="flex flex-wrap gap-[12px] items-start">
                          {skillsInCat.map(skill => (
                            <SkillHex
                              key={skill._id}
                              name={skill.name}
                              category={skill.category}
                              yearsOfExperience={skill.yearsOfExperience}
                              iconUrl={skill.iconUrl}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isLimitedView && (
                    <div className="mt-8 flex justify-center">
                      <button 
                        onClick={() => setShowAll(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-bgSurface border border-border rounded-lg text-textSecondary font-mono text-[12px] transition-colors hover:text-textPrimary hover:border-textMuted hover:bg-bgRaised cursor-pointer"
                      >
                        View All Skills →
                      </button>
                    </div>
                  )}
                </div>
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
              {isLoading ? (
                <div className="h-[400px] rounded-[8px] bg-bgRaised skeleton-shimmer" />
              ) : (
                <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] max-h-[520px] overflow-y-auto">
                  <div className="h-[28px] bg-bgRaised rounded-t-[6px] -mx-[20px] -mt-[20px] mb-[16px] px-[12px] flex items-center gap-[8px] sticky top-[-20px]">
                    <div className="flex gap-[6px]">
                      <div className="w-[8px] h-[8px] rounded-full bg-[#ff5f57]" />
                      <div className="w-[8px] h-[8px] rounded-full bg-[#febc2e]" />
                      <div className="w-[8px] h-[8px] rounded-full bg-[#28c840]" />
                    </div>
                    <div className="font-mono text-[10px] text-textMuted ml-auto">
                      GET /api/v1/skills?grouped=true → 200 OK
                    </div>
                  </div>
                  
                  {renderSkillsJSON(grouped, totalCount)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
