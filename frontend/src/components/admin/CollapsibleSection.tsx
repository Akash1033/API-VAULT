// Path: src/components/admin/CollapsibleSection.tsx
// Purpose: Wraps optional form fields in a collapsible section
// Dependencies: react, framer-motion

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-[6px] overflow-hidden w-full">
      <div
        className="py-[10px] px-[14px] flex items-center gap-[10px] cursor-pointer bg-bgRaised hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-mono text-[11px] text-textMuted">
          // {title}
        </span>
        
        {badge && (
          <span className="font-mono text-[9px] text-green bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-[6px] py-[1px] rounded-[3px]">
            {badge}
          </span>
        )}
        
        <div className="flex-1" />
        
        <span
          className="font-mono text-[12px] text-textMuted transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▸
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-[14px] flex flex-col gap-[14px]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
