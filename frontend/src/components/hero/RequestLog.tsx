// Path: src/components/hero/RequestLog.tsx
// Purpose: Terminal-style animated API request log display
// Dependencies: react, framer-motion

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LOG_ENTRIES = [
  { id: 1, method: 'GET', path: '/api/v1/me', status: 200, latency: '8ms', cache: false },
  { id: 2, method: 'GET', path: '/api/v1/projects', status: 200, latency: '41ms', cache: true },
  { id: 3, method: 'POST', path: '/api/v1/auth/login', status: 200, latency: '134ms', cache: false },
  { id: 4, method: 'GET', path: '/api/v1/skills?grouped=true', status: 200, latency: '12ms', cache: true },
  { id: 5, method: 'GET', path: '/api/v1/experience', status: 200, latency: '29ms', cache: true },
  { id: 6, method: 'GET', path: '/api/v1/articles', status: 200, latency: '18ms', cache: false },
  { id: 7, method: 'DELETE', path: '/api/v1/projects/:id', status: 401, latency: '3ms', cache: false },
  { id: 8, method: 'GET', path: '/api/v1/health', status: 200, latency: '2ms', cache: false },
];

export const RequestLog: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const revealNext = (count: number) => {
      setVisibleCount(count);
      if (count < LOG_ENTRIES.length) {
        timeoutId = setTimeout(() => revealNext(count + 1), 400);
      }
    };

    timeoutId = setTimeout(() => revealNext(1), 400);

    return () => clearTimeout(timeoutId);
  }, []);

  const getMethodColor = (method: string) => {
    if (method === 'GET') return 'text-green';
    if (method === 'POST') return 'text-blue';
    if (method === 'DELETE') return 'text-red';
    return 'text-textPrimary';
  };

  return (
    <>
      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor {
          animation: blink-cursor 1s step-end infinite;
        }
        @keyframes api-pulse-log {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-api-pulse-log {
          animation: api-pulse-log 2s infinite;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col bg-bgSurface border border-border rounded-[8px] overflow-hidden w-full"
      >
        <div className="h-[32px] bg-bgRaised px-3 flex items-center gap-[8px]">
          <div className="flex gap-[6px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#ff5f57]" />
            <div className="w-[8px] h-[8px] rounded-full bg-[#febc2e]" />
            <div className="w-[8px] h-[8px] rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 text-center font-mono text-[10px] text-textMuted">
            request.log &mdash; live
          </div>
          <div className="w-[6px] h-[6px] bg-green rounded-full animate-api-pulse-log" />
        </div>

        <div className="p-4 font-mono text-[11px] leading-[2] flex flex-col">
          {LOG_ENTRIES.map((entry, index) => {
            const isVisible = index < visibleCount;
            return (
              <div 
                key={entry.id} 
                className="flex items-center gap-2 transition-opacity duration-200"
                style={{ 
                  opacity: isVisible ? 1 : 0, 
                  display: isVisible ? 'flex' : 'none' 
                }}
              >
                <span className={`w-[56px] shrink-0 ${getMethodColor(entry.method)}`}>{entry.method}</span>
                <span className="flex-1 text-textSecondary truncate">{entry.path}</span>
                <span className={`w-[36px] shrink-0 ${entry.status === 200 ? 'text-green' : 'text-red'}`}>{entry.status}</span>
                <span className="w-[48px] shrink-0 text-textMuted">{entry.latency}</span>
                <span className="w-auto shrink-0">
                  {entry.cache && <span className="text-[10px] text-green">⚡ cache</span>}
                </span>
              </div>
            );
          })}
          {visibleCount >= LOG_ENTRIES.length && (
            <div className="mt-1">
              <span className="text-textMuted animate-cursor">_</span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
