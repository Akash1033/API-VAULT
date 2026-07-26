// Path: src/components/admin/AdminModal.tsx
// Purpose: Reusable modal for create/edit forms with focus traps and keyboard handling
// Dependencies: react, framer-motion

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus trap
      setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector('input, textarea, select, button');
          if (firstInput) {
            (firstInput as HTMLElement).focus();
          }
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getWidth = () => {
    switch(size) {
      case 'sm': return '400px';
      case 'lg': return '720px';
      case 'md':
      default: return '560px';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[100]" 
            onClick={onClose} 
          />
          <motion.div
            ref={modalRef}
            data-testid="admin-modal"
            initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.15 }}
            style={{ width: 'calc(100% - 32px)', maxWidth: getWidth() }}
            className="fixed top-1/2 left-1/2 z-[101] bg-bgSurface border border-border rounded-[8px] max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-[16px] md:px-[20px] py-[16px] border-b border-border flex justify-between items-center">
              <span className="font-mono text-[13px] text-textPrimary">
                // {title}
              </span>
              <button 
                onClick={onClose}
                className="font-mono text-[16px] text-textMuted bg-transparent border-none hover:text-red cursor-pointer leading-none p-0"
              >
                &times;
              </button>
            </div>
            
            <div className="p-[16px] md:p-[20px] overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
