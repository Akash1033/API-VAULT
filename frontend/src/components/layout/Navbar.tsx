// Path: src/components/layout/Navbar.tsx
// Purpose: Main navigation header with active section tracking
// Dependencies: react, zustand (uiStore)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';

interface NavItem {
  href: string;
  label: string;
  tooltip: string;
}

const NAV_LINKS: NavItem[] = [
  { href: 'me', label: 'me', tooltip: 'About' },
  { href: 'projects', label: 'projects', tooltip: 'My Work' },
  { href: 'experience', label: 'experience', tooltip: 'Career' },
  { href: 'articles', label: 'articles', tooltip: 'Writing' },
  { href: 'skills', label: 'skills', tooltip: 'Tech Stack' },
  { href: 'contact', label: 'contact', tooltip: 'Contact' },
];

export const Navbar: React.FC = () => {
  const { activeSection, setActiveSection } = useUiStore();
  const [emailCopied, setEmailCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only observe scroll intersections if on the homepage
    if (location.pathname !== '/') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.4 }
    );

    NAV_LINKS.forEach((link) => {
      const el = document.getElementById(link.href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [setActiveSection, location.pathname]);

  const handleScroll = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
      // Let the PortfolioPage effect handle scrolling on mount if there's a hash
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('akashvohra9877@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // Determine active highlight state
  const currentPath = location.pathname;
  let highlightSection = activeSection;
  
  if (currentPath.startsWith('/projects')) {
    highlightSection = 'projects';
  } else if (currentPath.startsWith('/articles')) {
    highlightSection = 'articles';
  }

  return (
    <>
      <style>{`
        @keyframes api-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-api-pulse {
          animation: api-pulse 2s infinite;
        }
      `}</style>
      <header className="sticky top-0 z-50 h-[52px] bg-bgBase/90 backdrop-blur-[8px] border-b border-border">
        <div className="max-w-[1200px] h-full mx-auto px-6 flex items-center">
          <a href="/" className="font-mono text-green no-underline text-[22px] font-medium tracking-tight">
            API VAULT
          </a>

          <span className="hidden md:block text-border mx-4">/</span>

          <nav className="hidden md:flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="relative group flex items-center">
                <button
                  onClick={() => handleScroll(link.href)}
                  className={`font-mono text-[14px] no-underline cursor-pointer transition-colors border-none bg-transparent ${
                    highlightSection === link.href ? 'text-amber' : 'text-textMuted hover:text-textPrimary'
                  }`}
                >
                  {link.label}
                </button>
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-[4px] z-10 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-[4px] transition-all duration-150 pointer-events-none bg-bgRaised border border-border text-textMuted font-sans text-[10px] px-[8px] py-[2px] rounded-[4px] whitespace-nowrap"
                >
                  {link.tooltip}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Coffee Button */}
          <button
            onClick={() => {
              useUiStore.getState().setOpenSupportForm(true);
              handleScroll('support');
            }}
            className="hidden md:flex items-center gap-2 bg-amber/10 hover:bg-amber/20 border border-amber/30 text-amber px-3 py-1.5 rounded-[4px] font-mono text-[11px] cursor-pointer transition-colors mr-6"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
            </svg>
            <span>Buy me a coffee</span>
          </button>

          {/* Social Icons */}
          <div className="flex items-center gap-4 mr-6">
            <a href="https://github.com/Akash1033/" target="_blank" rel="noreferrer" className="text-textMuted hover:text-textPrimary transition-colors" title="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="https://linkedin.com/in/akash-vohra01" target="_blank" rel="noreferrer" className="text-textMuted hover:text-textPrimary transition-colors" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="#" onClick={handleCopyEmail} className="relative text-textMuted hover:text-textPrimary transition-colors group" title="Email">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]">
                <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.877l5.611-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z" />
              </svg>
              {emailCopied && (
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-bgRaised border border-border text-green font-mono text-[10px] px-[8px] py-[2px] rounded-[4px] whitespace-nowrap">
                  Copied!
                </span>
              )}
            </a>
          </div>

          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] bg-green rounded-full animate-api-pulse" />
            <span className="font-mono text-[10px] text-green">API online</span>
          </div>
        </div>
      </header>
    </>
  );
};
