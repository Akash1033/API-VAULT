// Path: src/pages/NotFound.tsx
// Purpose: 404 page with JSON error payload theme
// Dependencies: react, react-router-dom

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center p-6">
      <div className="max-w-[500px] w-full">
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
            <span className="text-purple">404</span>
            <span className="text-textMuted">,</span>
          </div>
          
          <div className="pl-4">
            <span className="text-blue">"message"</span>
            <span className="text-textMuted">: </span>
            <span className="text-amber">"Route not registered on this server."</span>
            <span className="text-textMuted">,</span>
          </div>
          
          <div className="pl-4">
            <span className="text-blue">"errors"</span>
            <span className="text-textMuted">: </span>
            <span className="text-textMuted">{'{'}</span>
            
            <div className="pl-4">
              <span className="text-blue">"code"</span>
              <span className="text-textMuted">: </span>
              <span className="text-amber">"ROUTE_NOT_FOUND"</span>
              <span className="text-textMuted">,</span>
            </div>
            
            <div className="pl-4">
              <span className="text-blue">"path"</span>
              <span className="text-textMuted">: </span>
              <span className="text-amber">"{location.pathname}"</span>
            </div>
            
            <span className="text-textMuted">{'}'}</span>
          </div>
          
          <div className="text-textMuted">{'}'}</div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="border border-border text-textMuted bg-transparent font-mono text-[12px] px-[18px] py-[8px] rounded-[4px] hover:border-borderHover transition-colors mt-[24px] cursor-pointer"
        >
          &larr; GET /
        </button>
      </div>
    </div>
  );
};


