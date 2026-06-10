// Path: src/components/sections/Experience.tsx
// Purpose: Timeline-based experience section fetching data from API
// Dependencies: react, framer-motion, @tanstack/react-query

import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { api } from '../../api/axios';
import { SectionHeader } from '../shared/SectionHeader';

interface Experience {
  _id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
  responsibilities: string[];
  technologies: string[];
  isPublished: boolean;
  order?: number;
}

function formatDuration(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalMonths = Math.round(diffDays / 30.44);
  
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (remainingMonths > 0 || years === 0) parts.push(`${Math.max(1, remainingMonths)} mos`);
  
  return parts.join(' ');
}

const getTechColorClass = (tech: string) => {
  const lower = tech.toLowerCase();
  if (lower.includes('node') || lower.includes('deno')) {
    return "border-[rgba(74,222,128,0.3)] text-green bg-[rgba(74,222,128,0.06)]";
  } else if (lower.includes('mongo') || lower.includes('redis') || lower.includes('postgre') || lower.includes('sql') || lower.includes('db')) {
    return "border-[rgba(96,165,250,0.3)] text-blue bg-[rgba(96,165,250,0.06)]";
  } else if (lower.includes('docker') || lower.includes('k8s') || lower.includes('kubernetes') || lower.includes('nginx') || lower.includes('aws')) {
    return "border-[rgba(251,191,36,0.3)] text-amber bg-[rgba(251,191,36,0.06)]";
  }
  return "border-border text-textMuted bg-transparent";
};

const ExperienceEntry: React.FC<{ entry: Experience; index: number }> = ({ entry, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  
  const isCurrent = entry.isCurrent || !entry.endDate;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formattedStart = formatDate(entry.startDate);
  const formattedEnd = isCurrent ? 'present' : entry.endDate ? formatDate(entry.endDate) : 'present';
  
  const duration = formatDuration(entry.startDate, entry.endDate);
  const companyDomain = entry.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative mb-[48px] last:mb-0"
    >
      {/* TIMELINE DOT */}
      <div className={`absolute left-[-28px] top-[24px] w-[16px] h-[16px] rounded-full border bg-bgBase flex items-center justify-center ${
        isCurrent ? 'border-green' : 'border-border'
      } ${isCurrent && isInView ? 'animate-experience-ripple' : ''}`}>
        <div className={`w-[6px] h-[6px] rounded-full ${isCurrent ? 'bg-green' : 'bg-textMuted'}`} />
      </div>

      {/* ENTRY CARD */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] md:px-[24px] md:py-[20px] transition-colors duration-200 hover:border-[rgba(255,255,255,0.13)]">
        
        {/* CARD HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[16px] gap-[12px]">
          <div className="flex-1">
            <h3 className="font-sans text-[18px] font-medium text-textPrimary leading-tight">
              {entry.company}
            </h3>
            <div className="font-mono text-[13px] text-green mt-[4px]">
              {entry.role}
            </div>
            <div className="font-mono text-[11px] text-textMuted mt-[2px]">
              {entry.location}
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="font-mono text-[11px] bg-bgRaised border border-border rounded-[20px] px-[12px] py-[4px] inline-block">
              <span className="text-textMuted">{formattedStart} → </span>
              {isCurrent ? (
                <span className="text-green">present</span>
              ) : (
                <span className="text-textMuted">{formattedEnd}</span>
              )}
            </div>
            {isCurrent && (
              <div className="font-mono text-[10px] text-green mt-[6px] text-left sm:text-right sm:ml-0 ml-[8px]">
                ● current
              </div>
            )}
          </div>
        </div>

        {/* JSON RECORD */}
        <div className="font-mono text-[10px] bg-bgRaised border border-border rounded-[6px] px-[12px] py-[10px] mb-[14px] leading-[1.8] overflow-x-auto">
          <span className="text-textMuted">{'{'}</span><br/>
          <span className="text-textMuted">  </span><span className="text-blue">"company"</span><span className="text-textMuted">: </span><span className="text-amber">"{entry.company}"</span><span className="text-textMuted">,</span><br/>
          <span className="text-textMuted">  </span><span className="text-blue">"role"</span><span className="text-textMuted">: </span><span className="text-amber">"{entry.role}"</span><span className="text-textMuted">,</span><br/>
          <span className="text-textMuted">  </span><span className="text-blue">"start_date"</span><span className="text-textMuted">: </span><span className="text-amber">"{formattedStart}"</span><span className="text-textMuted">,</span><br/>
          <span className="text-textMuted">  </span><span className="text-blue">"end_date"</span><span className="text-textMuted">: </span>
          {isCurrent ? <span className="text-green">"present"</span> : <span className="text-amber">"{formattedEnd}"</span>}
          <span className="text-textMuted">,</span><br/>
          <span className="text-textMuted">  </span><span className="text-blue">"location"</span><span className="text-textMuted">: </span><span className="text-amber">"{entry.location}"</span><br/>
          <span className="text-textMuted">{'}'}</span>
        </div>

        {/* DESCRIPTION */}
        {entry.description && (
          <p className="font-sans text-[14px] text-textSecondary leading-[1.7] mb-[14px] whitespace-pre-line">
            {entry.description}
          </p>
        )}

        {/* ACHIEVEMENTS */}
        {entry.responsibilities && entry.responsibilities.length > 0 && (
          <div className="mb-[14px]">
            <div className="font-mono text-[10px] text-textMuted mb-[8px]">
              // achievements
            </div>
            {entry.responsibilities.map((ach, idx) => (
              <div key={idx} className="flex gap-[10px] items-start mb-[6px] last:mb-0">
                <div className="w-[16px] h-[16px] shrink-0 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] rounded-[3px] flex items-center justify-center mt-[3px]">
                  <span className="font-mono text-[9px] text-green leading-none">→</span>
                </div>
                <div className="font-sans text-[13px] text-textSecondary leading-[1.5]">
                  {ach}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TECH STACK */}
        {entry.technologies && entry.technologies.length > 0 && (
          <div className="mt-[14px]">
            <div className="font-mono text-[10px] text-textMuted mb-[8px]">
              // stack
            </div>
            <div className="flex flex-row flex-wrap gap-[6px]">
              {entry.technologies.map(tech => (
                <span key={tech} className={`font-mono text-[9px] py-[2px] px-[8px] rounded-[4px] border ${getTechColorClass(tech)}`}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CARD FOOTER */}
        <div className="border-t border-border mt-[16px] pt-[12px] flex flex-row justify-between items-center">
          <div className="font-mono text-[10px] text-textMuted">
            // {companyDomain}
          </div>
          <div className="font-mono text-[10px] text-textMuted">
            {duration}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export const Experience: React.FC = () => {
  const { data, isLoading } = useQuery<Experience[]>({
    queryKey: ['experience'],
    queryFn: () => api.get('/experience').then(r => Array.isArray(r.data?.data) ? r.data.data : [])
  });

  const experiences = data || [];

  return (
    <>
      <style>{`
        @keyframes experience-ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .animate-experience-ripple::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--green);
          animation: experience-ripple 1.5s ease-out infinite;
        }
      `}</style>
      <section id="experience" className="py-[80px] px-6 max-w-[1200px] mx-auto">
        <SectionHeader 
          method="GET"
          endpoint="/api/v1/experience"
          title="Experience"
          humanLabel="Work History"
          chips={[
            { label: 'timeline: true' }, 
            { label: 'auth: none' }, 
            { label: `${experiences.length} results`, isResult: true }
          ]}
        />

        <div className="relative mt-[48px] pl-[32px]">
          {/* LEFT RAIL */}
          <div className="absolute left-[8px] top-0 bottom-0 w-[1px] bg-border" />
          
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="relative mb-[48px]">
                 <div className="absolute left-[-28px] top-[24px] w-[16px] h-[16px] rounded-full border border-border bg-bgBase flex items-center justify-center">
                   <div className="w-[6px] h-[6px] rounded-full bg-textMuted" />
                 </div>
                 <div className="h-[280px] rounded-[8px] bg-bgRaised skeleton-shimmer" />
              </div>
            ))
          ) : experiences.length === 0 ? (
            <div className="font-mono text-[12px] bg-bgSurface border border-border rounded-[8px] p-[40px] text-center overflow-x-auto">
               <div className="inline-block text-left">
                 <span className="text-textMuted">{'{'}</span><br/>
                 <span className="text-textMuted">  </span><span className="text-blue">"data"</span><span className="text-textMuted">: [],</span><br/>
                 <span className="text-textMuted">  </span><span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"No experience entries published."</span><br/>
                 <span className="text-textMuted">{'}'}</span>
               </div>
            </div>
          ) : (
            experiences.map((exp, index) => (
              <ExperienceEntry key={exp._id} entry={exp} index={index} />
            ))
          )}
        </div>
      </section>
    </>
  );
};
