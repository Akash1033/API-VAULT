// Path: src/components/admin/ToggleSwitch.tsx
// Purpose: Reusable toggle switch component for forms
// Dependencies: react

import React from 'react';

interface ToggleSwitchProps {
  value: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onChange, label }) => {
  return (
    <div className="flex items-center gap-[8px] cursor-pointer" onClick={() => onChange(!value)}>
      <div 
        className={`w-[36px] h-[20px] rounded-[10px] p-[2px] transition-colors duration-200 ease-in-out ${
          value ? 'bg-green' : 'bg-bgRaised'
        }`}
      >
        <div 
          className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
            value ? 'translate-x-[16px]' : 'translate-x-[2px]'
          }`} 
        />
      </div>
      {label && (
        <span className="font-mono text-[11px] text-textMuted">{label}</span>
      )}
    </div>
  );
};
