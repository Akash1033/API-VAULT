// Path: src/components/admin/SlugPreview.tsx
// Purpose: Auto-generates and displays a slug from a given title
// Dependencies: react

import React from 'react';

interface SlugPreviewProps {
  title: string;
}

export const SlugPreview: React.FC<SlugPreviewProps> = ({ title }) => {
  const generatedSlug = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';

  return (
    <div className="font-mono text-[10px] text-textMuted mt-[4px]">
      slug: {generatedSlug || '—'}
    </div>
  );
};
