// Path: src/components/admin/Toast.tsx
// Purpose: Global toast notification component
// Dependencies: react, framer-motion, zustand

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';

export const Toast: React.FC = () => {
  const toast = useUiStore((state) => state.toast);

  return (
    <div className="fixed top-6 right-6 z-[200]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`bg-bgSurface border border-border rounded-[6px] px-[16px] py-[12px] border-l-[2px] shadow-lg ${
              toast.type === 'success' ? 'border-l-green' : 'border-l-red'
            }`}
          >
            <span className={`font-mono text-[12px] ${toast.type === 'success' ? 'text-textPrimary' : 'text-red'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
