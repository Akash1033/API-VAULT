// Path: src/components/admin/SmartTagInput.tsx
// Purpose: Tag input with dropdown suggestions and custom values
// Dependencies: react

import React, { useState, useRef, useEffect } from 'react';


export interface SmartTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  maxTags?: number;
  color?: 'green' | 'blue' | 'amber' | 'purple';
}

export const SmartTagInput: React.FC<SmartTagInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = 'Add tag...',
  label,
  maxTags,
  color = 'green'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange(value.filter((_, i) => i !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue) {
      if (value.length > 0) {
        handleRemoveTag(value.length - 1);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'ArrowDown') {
      // Basic accessibility / flow would go here, 
      // but matching the spec closely we just ensure we don't break default behavior too much.
    }
  };

  const getColorClasses = (themeColor: string) => {
    switch (themeColor) {
      case 'green':
        return 'bg-[rgba(74,222,128,0.12)] border-[rgba(74,222,128,0.3)] text-green';
      case 'blue':
        return 'bg-[rgba(96,165,250,0.12)] border-[rgba(96,165,250,0.3)] text-blue';
      case 'amber':
        return 'bg-[rgba(251,191,36,0.12)] border-[rgba(251,191,36,0.3)] text-amber';
      case 'purple':
        return 'bg-[rgba(192,132,252,0.12)] border-[rgba(192,132,252,0.3)] text-purple';
      default:
        return 'bg-[rgba(74,222,128,0.12)] border-[rgba(74,222,128,0.3)] text-green';
    }
  };

  const showCustomAdd = inputValue.trim().length > 0 && !suggestions.includes(inputValue.trim()) && !value.includes(inputValue.trim());

  return (
    <div className="flex flex-col gap-[6px] w-full" ref={containerRef}>
      {label && (
        <label className="font-mono text-[11px] text-textMuted block mb-[4px]">
          {label}
        </label>
      )}

      <div
        className="relative flex flex-wrap gap-[6px] bg-bgRaised border border-border rounded-[4px] py-[8px] px-[10px] min-h-[40px] focus-within:border-green cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className={`font-mono text-[10px] py-[2px] px-[8px] rounded-[3px] inline-flex items-center gap-[6px] border ${getColorClasses(color)}`}
          >
            {tag}
            <button
              type="button"
              className="bg-transparent border-none p-0 cursor-pointer opacity-100 hover:opacity-70 flex items-center justify-center text-inherit font-bold"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(i);
              }}
            >
              &times;
            </button>
          </span>
        ))}

        {(!maxTags || value.length < maxTags) && (
          <input
            ref={inputRef}
            type="text"
            className="bg-transparent border-none outline-none font-mono text-[12px] text-textPrimary flex-1 min-w-[120px] placeholder:text-textMuted"
            placeholder={value.length === 0 ? placeholder : ''}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.length > 0 || suggestions.length > 0) setShowDropdown(true);
            }}
          />
        )}

        {showDropdown && (filteredSuggestions.length > 0 || showCustomAdd) && (
          <div className="absolute top-[100%] left-0 right-0 z-50 mt-[4px] bg-bgSurface border border-border rounded-[6px] max-h-[200px] overflow-y-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            {filteredSuggestions.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-textMuted pt-[8px] pb-[4px] px-[12px]">
                  // suggestions
                </div>
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="py-[8px] px-[12px] cursor-pointer font-mono text-[11px] text-textSecondary hover:bg-bgRaised hover:text-textPrimary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTag(suggestion);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </>
            )}

            {showCustomAdd && (
              <div
                className="py-[6px] px-[12px] border-t border-border cursor-pointer hover:bg-bgRaised font-mono text-[11px] text-green"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTag(inputValue);
                }}
              >
                + Add "{inputValue}" as custom tag
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
