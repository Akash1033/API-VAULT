// Path: src/components/shared/SectionSkeleton.tsx
// Purpose: Shimmer loading skeleton for lazy-loaded sections
// Dependencies: react

import React from 'react';

export const SectionSkeleton: React.FC = () => {
  return (
    <div 
      className="w-full h-[200px] rounded-[8px] border border-border bg-bgSurface relative overflow-hidden skeleton-shimmer"
      aria-hidden="true"
    />
  );
};
