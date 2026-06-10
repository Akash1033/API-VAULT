// Path: src/components/shared/Pagination.tsx
// Purpose: Reusable pagination component
// Dependencies: react

import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);

    if (currentPage === 1) {
      endPage = Math.min(totalPages, Math.max(3, maxVisible - 2)); 
    }
    if (currentPage === totalPages) {
      startPage = Math.max(1, totalPages - (maxVisible - 3)); 
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`font-mono text-[11px] px-[14px] py-[6px] rounded-[4px] border transition-colors cursor-pointer ${
            currentPage === 1
              ? 'bg-green text-[#0a0c0b] border-transparent font-medium'
              : 'border-border text-textMuted bg-transparent hover:border-borderHover hover:text-textPrimary'
          }`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="font-mono text-[11px] text-textMuted px-[8px]">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === 1 && startPage > 1) continue; 
      if (i === totalPages && endPage < totalPages) continue; 
      
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`font-mono text-[11px] px-[14px] py-[6px] rounded-[4px] border transition-colors cursor-pointer ${
            currentPage === i
              ? 'bg-green text-[#0a0c0b] border-transparent font-medium'
              : 'border-border text-textMuted bg-transparent hover:border-borderHover hover:text-textPrimary'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="font-mono text-[11px] text-textMuted px-[8px]">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`font-mono text-[11px] px-[14px] py-[6px] rounded-[4px] border transition-colors cursor-pointer ${
            currentPage === totalPages
              ? 'bg-green text-[#0a0c0b] border-transparent font-medium'
              : 'border-border text-textMuted bg-transparent hover:border-borderHover hover:text-textPrimary'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="flex flex-row items-center justify-center gap-[8px] mt-[40px] w-full">
      <div className="flex-1 font-mono text-[11px] text-textMuted">
        // showing {start}–{end} of {totalItems} results
      </div>
      
      <div className="flex flex-row items-center gap-[8px]">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="font-mono text-[11px] border border-border text-textMuted bg-transparent px-[14px] py-[6px] rounded-[4px] transition-colors hover:border-borderHover hover:text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          &larr; prev
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="font-mono text-[11px] border border-border text-textMuted bg-transparent px-[14px] py-[6px] rounded-[4px] transition-colors hover:border-borderHover hover:text-textPrimary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          next &rarr;
        </button>
      </div>
    </div>
  );
};
