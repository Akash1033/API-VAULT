// Path: src/components/shared/SectionHeader.tsx
// Purpose: Reusable section header with API method, typed endpoint, and meta chips
// Dependencies: react, framer-motion, useTypewriter

import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import { useTypewriter } from '../../hooks/useTypewriter';

export interface SectionHeaderProps {
  method: 'GET' | 'POST' | 'DELETE';
  endpoint: string;
  title: string;
  chips: Array<{ label: string; isResult?: boolean }>;
  rightSlot?: React.ReactNode;
  humanLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  method,
  endpoint,
  title,
  chips,
  rightSlot,
  humanLabel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const typedEndpoint = useTypewriter(endpoint, 30, 200, isInView);

  const getMethodStyles = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-[rgba(74,222,128,0.12)] text-green';
      case 'POST': return 'bg-[rgba(96,165,250,0.12)] text-blue';
      case 'DELETE': return 'bg-[rgba(248,113,113,0.12)] text-red';
      default: return 'bg-[rgba(255,255,255,0.1)] text-textSecondary';
    }
  };

  return (
    <div ref={ref} className="w-full mb-8">
      <div className="flex items-center">
        <span className={`font-mono text-[10px] px-[10px] py-[2px] rounded-[12px] ${getMethodStyles(method)}`}>
          {method}
        </span>
        <span className="font-mono text-[13px] text-textSecondary ml-[10px]">
          {typedEndpoint}
          <span className="animate-pulse">_</span>
        </span>
        {humanLabel && (
          <span className="font-mono text-[11px] text-textMuted ml-3 opacity-60">
            // {humanLabel}
          </span>
        )}
      </div>
      
      <h2 className="font-sans text-[22px] font-medium text-textPrimary block mt-[8px]">
        {title}
      </h2>
      
      <div className="flex flex-row items-center justify-between mt-[8px]">
        <div className="flex flex-row gap-[8px] flex-wrap">
          {chips.map((chip, i) => (
            <span 
              key={i} 
              className={`font-mono text-[10px] px-[8px] py-[2px] rounded-[4px] border ${
                chip.isResult 
                  ? 'bg-transparent border-[rgba(74,222,128,0.2)] text-green' 
                  : 'bg-[rgba(255,255,255,0.04)] border-border text-textMuted'
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </div>
  );
};
