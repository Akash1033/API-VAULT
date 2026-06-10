// Path: src/components/admin/AdminLayout.tsx
// Purpose: Persistent shell layout for the admin dashboard
// Dependencies: react, react-router-dom, authStore

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Projects', path: '/admin/projects' },
    { label: 'Skills', path: '/admin/skills' },
    { label: 'Experience', path: '/admin/experience' },
    { label: 'Articles', path: '/admin/articles' },
    { label: 'Certifications', path: '/admin/certifications' },
  ];

  return (
    <div className="w-full h-screen overflow-hidden grid grid-cols-[220px_1fr] grid-rows-[52px_1fr] bg-bgBase text-textPrimary">
      
      {/* TOPBAR */}
      <div className="col-span-full h-[52px] bg-bgSurface border-b border-border flex items-center px-[24px] justify-between">
        <div className="font-mono text-[13px] text-green">~/portfolio/admin</div>
        <div className="font-sans text-[13px] text-textSecondary">Admin Dashboard</div>
        <div className="flex flex-row gap-[16px] items-center">
          <a href="/" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-textMuted hover:text-green cursor-pointer no-underline">
            &larr; View Site
          </a>
          <button onClick={handleLogout} className="bg-transparent border-none font-mono text-[11px] text-textMuted hover:text-red cursor-pointer p-0">
            logout
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="row-start-2 col-start-1 w-[220px] bg-bgSurface border-r border-border overflow-y-auto py-[16px]">
        <div className="font-mono text-[10px] text-textMuted px-[20px] py-[8px] mt-[8px]">
          // content
        </div>
        
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-[20px] py-[8px] flex items-center gap-[10px] cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-bgRaised text-amber border-l-[2px] border-amber' 
                  : 'text-textMuted border-l-[2px] border-transparent hover:bg-bgRaised hover:text-textPrimary'
              }`}
            >
              <span className="font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(74,222,128,0.12)] text-green">
                GET
              </span>
              <span className={`font-mono text-[12px] ${isActive ? 'text-amber' : ''}`}>
                {item.label}
              </span>
            </div>
          );
        })}

        <div className="font-mono text-[10px] text-textMuted px-[20px] py-[8px] mt-[8px]">
          // inbox
        </div>
        <div 
          onClick={() => navigate('/admin/messages')}
          className={`px-[20px] py-[8px] flex items-center gap-[10px] cursor-pointer transition-colors ${
            location.pathname.startsWith('/admin/messages') 
              ? 'bg-bgRaised text-amber border-l-[2px] border-amber' 
              : 'text-textMuted border-l-[2px] border-transparent hover:bg-bgRaised hover:text-textPrimary'
          }`}
        >
          <span className="font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(74,222,128,0.12)] text-green">
            GET
          </span>
          <span className={`font-mono text-[12px] ${location.pathname.startsWith('/admin/messages') ? 'text-amber' : ''}`}>
            Messages
          </span>
        </div>
        <div 
          onClick={() => navigate('/admin/payments')}
          className={`px-[20px] py-[8px] flex items-center gap-[10px] cursor-pointer transition-colors ${
            location.pathname.startsWith('/admin/payments') 
              ? 'bg-bgRaised text-amber border-l-[2px] border-amber' 
              : 'text-textMuted border-l-[2px] border-transparent hover:bg-bgRaised hover:text-textPrimary'
          }`}
        >
          <span className="font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(74,222,128,0.12)] text-green">
            GET
          </span>
          <span className={`font-mono text-[12px] ${location.pathname.startsWith('/admin/payments') ? 'text-amber' : ''}`}>
            Payments
          </span>
        </div>

        <div className="font-mono text-[10px] text-textMuted px-[20px] py-[8px] mt-[8px]">
          // system
        </div>
        <div 
          onClick={() => navigate('/admin/analytics')}
          className={`px-[20px] py-[8px] flex items-center gap-[10px] cursor-pointer transition-colors ${
            location.pathname.startsWith('/admin/analytics') 
              ? 'bg-bgRaised text-amber border-l-[2px] border-amber' 
              : 'text-textMuted border-l-[2px] border-transparent hover:bg-bgRaised hover:text-textPrimary'
          }`}
        >
          <span className="font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(74,222,128,0.12)] text-green">
            GET
          </span>
          <span className={`font-mono text-[12px] ${location.pathname.startsWith('/admin/analytics') ? 'text-amber' : ''}`}>
            Analytics
          </span>
        </div>
        <div className="px-[20px] py-[8px] flex items-center gap-[10px] cursor-not-allowed text-textMuted border-l-[2px] border-transparent">
          <span className="font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(255,255,255,0.1)] text-textSecondary">
            GET
          </span>
          <span className="font-mono text-[12px]">
            Settings
          </span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="row-start-2 col-start-2 overflow-y-auto p-[32px] bg-bgBase">
        {children}
      </div>
      
    </div>
  );
};
