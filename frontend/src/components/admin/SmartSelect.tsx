// Path: src/components/admin/SmartSelect.tsx
// Purpose: Styled dropdown select that matches the dark terminal theme
// Dependencies: react

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SmartSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export const SmartSelect: React.FC<SmartSelectProps> = ({ label, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-[6px] w-full" ref={containerRef}>
      {label && (
        <label className="font-mono text-[11px] text-textMuted block mb-[4px]">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          className={`flex items-center justify-between bg-bgRaised border rounded-[4px] py-[10px] px-[12px] min-h-[40px] cursor-pointer transition-colors ${
            isOpen ? 'border-green' : 'border-border hover:border-borderHover'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOption ? (
            <span className="font-mono text-[12px] text-textPrimary">{selectedOption.label}</span>
          ) : (
            <span className="font-mono text-[12px] text-textMuted">Select an option...</span>
          )}
          <span className={`font-mono text-[12px] text-textMuted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>

        {isOpen && (
          <div className="absolute top-[100%] left-0 right-0 z-50 mt-[4px] bg-bgSurface border border-border rounded-[6px] max-h-[250px] overflow-y-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            {options.map((option) => (
              <div
                key={option.value}
                className={`py-[10px] px-[12px] cursor-pointer border-b border-border last:border-b-0 hover:bg-bgRaised transition-colors ${
                  value === option.value ? 'bg-[rgba(74,222,128,0.06)]' : ''
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-[8px]">
                  <span className={`font-mono text-[12px] ${value === option.value ? 'text-green' : 'text-textPrimary'}`}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <span className="font-mono text-[10px] text-green">✓</span>
                  )}
                </div>
                {option.description && (
                  <div className="font-sans text-[11px] text-textMuted mt-[4px] leading-snug">
                    {option.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
