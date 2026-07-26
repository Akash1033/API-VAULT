// Path: src/pages/MaintenancePage.tsx
// Purpose: Full-screen branded maintenance page — shown when maintenanceMode is active
// Dependencies: react, maintenanceStore

import React, { useState, useEffect } from 'react';
import { useMaintenanceStore } from '../store/maintenanceStore';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const MaintenancePage: React.FC = () => {
  const { maintenanceMessage, clearMaintenance } = useMaintenanceStore();
  const [checking, setChecking] = useState(false);
  const [dots, setDots] = useState('');

  // Animated ellipsis for the "checking" state
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_HOST}/api/v1/settings/maintenance`);
      const json = await res.json();
      if (json.data && json.data.maintenanceMode === false) {
        clearMaintenance();
        window.location.reload();
      }
    } catch {
      // Silently ignore — still in maintenance
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center p-6">
      <div className="max-w-[540px] w-full">
        {/* Pulsing status indicator */}
        <div className="flex items-center gap-[10px] mb-[24px]">
          <span
            className="inline-block w-[10px] h-[10px] rounded-full"
            style={{
              background: 'var(--amber)',
              boxShadow: '0 0 8px var(--amber)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span className="font-mono text-[12px] text-amber">
            maintenance mode active
          </span>
        </div>

        {/* JSON-styled maintenance payload */}
        <div className="bg-bgSurface border border-border rounded-[8px] p-6 font-mono text-[11px] leading-[1.9]">
          <div className="text-textMuted">{'{'}</div>

          <div className="pl-4">
            <span className="text-blue">"success"</span>
            <span className="text-textMuted">: </span>
            <span className="text-green">false</span>
            <span className="text-textMuted">,</span>
          </div>

          <div className="pl-4">
            <span className="text-blue">"status"</span>
            <span className="text-textMuted">: </span>
            <span className="text-purple">503</span>
            <span className="text-textMuted">,</span>
          </div>

          <div className="pl-4">
            <span className="text-blue">"maintenance"</span>
            <span className="text-textMuted">: </span>
            <span className="text-green">true</span>
            <span className="text-textMuted">,</span>
          </div>

          <div className="pl-4">
            <span className="text-blue">"message"</span>
            <span className="text-textMuted">: </span>
            <span className="text-amber">
              "{maintenanceMessage || "We're currently performing maintenance. Please check back shortly."}"
            </span>
          </div>

          <div className="text-textMuted">{'}'}</div>
        </div>

        {/* Status line */}
        <div className="font-mono text-[10px] text-textMuted mt-[16px]">
          // HTTP 503 Service Unavailable — all public endpoints are temporarily offline
        </div>

        {/* Check status button */}
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="border border-border text-textMuted bg-transparent font-mono text-[12px] px-[18px] py-[8px] rounded-[4px] hover:border-green hover:text-green transition-colors mt-[24px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? `checking${dots}` : '↻ Check status'}
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;
