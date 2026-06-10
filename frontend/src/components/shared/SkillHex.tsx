// Path: src/components/shared/SkillHex.tsx
// Purpose: Hexagonal skill icon for compact stack display
// Dependencies: react

import React, { useState } from 'react';
import { getSkillAbbr, getCategoryColor, getSkillLogoUrl } from '../../utils/skillUtils';

interface SkillHexProps {
  name: string;
  category: string;
  yearsOfExperience?: number;
  iconUrl?: string;
}

export const SkillHex: React.FC<SkillHexProps> = ({ name, category, yearsOfExperience, iconUrl }) => {
  const colorType = getCategoryColor(category);
  const abbr = getSkillAbbr(name);
  const logoUrl = getSkillLogoUrl(name, iconUrl);
  const [imgError, setImgError] = useState(false);

  const bgColors: Record<string, string> = {
    green: 'rgba(74,222,128,0.12)',
    blue: 'rgba(96,165,250,0.12)',
    amber: 'rgba(251,191,36,0.12)',
    purple: 'rgba(192,132,252,0.12)',
    muted: 'var(--bg-raised)'
  };

  const bgBorderColors: Record<string, string> = {
    green: 'rgba(74,222,128,0.25)',
    blue: 'rgba(96,165,250,0.25)',
    amber: 'rgba(251,191,36,0.25)',
    purple: 'rgba(192,132,252,0.25)',
    muted: 'var(--border)'
  };

  const textColors: Record<string, string> = {
    green: 'var(--green)',
    blue: 'var(--blue)',
    amber: 'var(--amber)',
    purple: 'var(--purple)',
    muted: 'var(--text-muted)'
  };

  const polyClip = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

  return (
    <div className="flex flex-col items-center gap-[6px] cursor-default" data-testid="skill-pill">
      <div className="relative w-[72px] h-[72px] group">
        {/* Border (behind) */}
        <div 
          className="absolute -inset-[1px] -z-10 transition-transform duration-200 ease-in-out group-hover:scale-110"
          style={{
            clipPath: polyClip,
            backgroundColor: bgBorderColors[colorType]
          }}
        />
        {/* Main Hex */}
        <div 
          className="w-[72px] h-[72px] flex items-center justify-center transition-transform duration-200 ease-in-out group-hover:scale-110"
          style={{
            clipPath: polyClip,
            backgroundColor: bgColors[colorType]
          }}
        >
          {!imgError ? (
            <img 
              src={logoUrl} 
              alt={name} 
              className="w-8 h-8 object-contain opacity-90 transition-opacity group-hover:opacity-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <span 
              className="font-mono text-[14px] font-medium"
              style={{ color: textColors[colorType] }}
            >
              {abbr}
            </span>
          )}
        </div>
      </div>
      
      <div className="font-mono text-[9px] text-textSecondary text-center max-w-[72px] leading-[1.3] break-words">
        {name}
      </div>

      {yearsOfExperience !== undefined && yearsOfExperience > 0 && (
        <div className="font-mono text-[8px] bg-bgRaised border-[0.5px] border-border text-textMuted px-[5px] py-[1px] rounded-[3px]">
          {yearsOfExperience}y
        </div>
      )}
    </div>
  );
};
