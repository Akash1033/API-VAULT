// Path: src/components/sections/Hero.tsx
// Purpose: Primary landing section introducing the developer
// Dependencies: react, framer-motion, useResumeTracker

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RequestLog } from '../hero/RequestLog';
import { useResumeTracker } from '../../hooks/useResumeTracker';

export const Hero: React.FC = () => {
  const { trackResumeClick } = useResumeTracker();

  const scrollToProjects = () => {
    const el = document.getElementById('projects');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const fullText = "Akash Vohra";
  const [typedName, setTypedName] = useState("");

  // Derive isTyping from state — avoids setState in effect
  const isTyping = typedName.length < fullText.length;

  useEffect(() => {
    if (typedName.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedName(fullText.slice(0, typedName.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [typedName, fullText]);

  return (
    <>
      <style>{`
        @keyframes text-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-text-blink {
          animation: text-blink 1s step-end infinite;
        }
      `}</style>
      <section
        id="me"
        className="w-full px-4 md:px-6 max-w-[1200px] mx-auto flex items-center justify-center py-8 md:py-20 md:min-h-screen"
      >
        <div className="w-full bg-[#000000] border border-[#222] rounded-[10px] overflow-hidden shadow-2xl">
          {/* Terminal Window Controls */}
          <div className="h-[32px] bg-[#050505] border-b border-[#222] flex items-center px-4 gap-[8px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#ff5f57]" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#febc2e]" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#28c840]" />
          </div>

          <div className="p-5 sm:p-8 md:p-12 grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-8 md:gap-12 items-center">
            <motion.div
              className="flex flex-col items-start w-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="font-mono text-[12px] mb-5 relative">
                <div className="text-[#888] opacity-80 mb-2">// developer profile</div>
                <div className="text-[#a1a1a1] flex flex-wrap items-center gap-2">
                  <span>GET /api/v1/me &rarr;</span>

                  {/* Easter Egg 200 OK Container */}
                  <span className="relative inline-block w-[48px] h-[18px] group cursor-default">
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] opacity-0 group-hover:opacity-100 transition-opacity bg-[#111] border border-[#333] text-[10px] px-2 py-1 rounded whitespace-nowrap text-[#ccc] pointer-events-none z-20">
                      Error: Code Brewed Too Strong
                    </span>

                    <span className="absolute inset-0 text-[#28c840] group-hover:opacity-0 transition-opacity flex items-center">
                      200 OK
                    </span>
                    <span className="absolute inset-0 text-[#ff5f57] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#000000] z-10 flex items-center pr-1">
                      418 I'm a teapot
                    </span>
                  </span>

                  <span>&middot; 12ms</span>
                </div>
              </div>

              <h1 className="font-mono text-[32px] sm:text-[42px] md:text-[52px] font-medium text-white leading-tight m-0 flex items-center h-[40px] sm:h-[48px] md:h-[60px]">
                {typedName}<span className={`text-[#28c840] font-light -mt-1 ${!isTyping ? 'animate-text-blink' : ''}`}>|</span>
              </h1>

              <div className="mt-2">
                <span className="text-[#888]">"</span>
                <span className="font-mono text-[16px] text-[#f59e0b]">Backend Engineer</span>
                <span className="text-[#888]">"</span>
              </div>

              <p className="font-sans text-[14px] md:text-[15px] text-gray-300 leading-[1.7] max-w-[460px] mt-4 md:mt-5 mb-0">
                I build distributed systems, production APIs, and infrastructure that scales. Currently obsessed with observability and zero-downtime deployments.
              </p>

              <div className="flex flex-col sm:flex-row gap-[12px] w-full sm:w-auto mt-[24px] md:mt-[32px]">
                <button
                  onClick={scrollToProjects}
                  className="w-full sm:w-auto justify-center bg-transparent border border-[#28c840] text-[#28c840] font-mono text-[12px] px-[18px] py-[8px] rounded-[4px] hover:bg-[#28c840] hover:text-black transition-all duration-300 cursor-pointer group flex items-center gap-2"
                >
                  View Projects <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </button>

                <a
                  href={import.meta.env.VITE_RESUME_URL || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackResumeClick}
                  className="w-full sm:w-auto justify-center bg-transparent border border-[#555] text-[#888] font-mono text-[12px] px-[18px] py-[8px] rounded-[4px] hover:border-[#28c840] hover:text-[#28c840] transition-colors duration-300 no-underline flex items-center"
                >
                  GET /resume
                </a>
              </div>
            </motion.div>

            <div className="hidden md:block w-full">
              <RequestLog />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
