// Path: src/components/admin/ConfirmDelete.tsx
// Purpose: Modal confirming resource deletion
// Dependencies: react, AdminModal

import React from 'react';
import { AdminModal } from './AdminModal';

export interface ConfirmDeleteProps {
  isOpen: boolean;
  resourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  isOpen,
  resourceName,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  return (
    <AdminModal isOpen={isOpen} onClose={onCancel} title="confirm_delete" size="sm">
      <div className="font-mono text-[11px] leading-[1.9] mb-[16px] bg-bgBase p-[12px] border border-border rounded-[6px]">
        <div className="text-textMuted">{'{'}</div>
        <div className="pl-4">
          <span className="text-blue">"action"</span>
          <span className="text-textMuted">: </span>
          <span className="text-amber">"DELETE"</span>
          <span className="text-textMuted">,</span>
        </div>
        <div className="pl-4">
          <span className="text-blue">"resource"</span>
          <span className="text-textMuted">: </span>
          <span className="text-amber">"{resourceName}"</span>
          <span className="text-textMuted">,</span>
        </div>
        <div className="pl-4">
          <span className="text-blue">"permanent"</span>
          <span className="text-textMuted">: </span>
          <span className="text-red">true</span>
        </div>
        <div className="text-textMuted">{'}'}</div>
      </div>
      
      <div className="font-mono text-[11px] text-textMuted mb-[16px]">
        This action cannot be undone.
      </div>
      
      <div className="flex justify-end gap-[12px]">
        <button 
          onClick={onCancel}
          disabled={isDeleting}
          className="font-mono text-[12px] text-textMuted border border-border bg-transparent px-[16px] py-[8px] rounded-[4px] hover:border-textMuted cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={isDeleting}
          className="font-mono text-[12px] text-[#0a0c0b] bg-red border-none px-[16px] py-[8px] rounded-[4px] hover:bg-opacity-90 cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[120px]"
        >
          {isDeleting ? 'deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </AdminModal>
  );
};
