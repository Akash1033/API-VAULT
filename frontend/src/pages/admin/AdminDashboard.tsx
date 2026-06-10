// Path: src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../api/admin';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => getDashboardStats()
  });

  const counts = stats?.counts;
  const recentEntries = stats?.recentEntries || [];

  return (
    <div>
      <div className="font-mono text-[12px] text-green mb-[24px]">
        GET /admin/overview &rarr; 200 OK
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px] mb-[32px]">
        
        <div 
          data-testid="admin-stat-card" 
          className="bg-bgSurface border border-border rounded-[8px] p-[20px] cursor-pointer hover:border-green transition-colors"
          onClick={() => navigate('/admin/projects')}
        >
          <div className="font-mono text-[11px] text-textMuted flex items-center justify-between">
            <span>Projects</span>
            <span className="px-[6px] py-[1px] bg-[rgba(74,222,128,0.12)] text-green rounded-[8px] text-[9px]">GET</span>
          </div>
          <div className="font-sans text-[32px] font-medium text-textPrimary my-[8px]">
            {isLoading ? '-' : counts?.projects}
          </div>
          <div className="font-mono text-[10px] text-textMuted">total entries</div>
        </div>
        
        <div 
          data-testid="admin-stat-card" 
          className="bg-bgSurface border border-border rounded-[8px] p-[20px] cursor-pointer hover:border-green transition-colors"
          onClick={() => navigate('/admin/skills')}
        >
          <div className="font-mono text-[11px] text-textMuted flex items-center justify-between">
            <span>Skills</span>
            <span className="px-[6px] py-[1px] bg-[rgba(74,222,128,0.12)] text-green rounded-[8px] text-[9px]">GET</span>
          </div>
          <div className="font-sans text-[32px] font-medium text-textPrimary my-[8px]">
            {isLoading ? '-' : counts?.skills}
          </div>
          <div className="font-mono text-[10px] text-textMuted">total entries</div>
        </div>
        
        <div 
          data-testid="admin-stat-card" 
          className="bg-bgSurface border border-border rounded-[8px] p-[20px] cursor-pointer hover:border-green transition-colors"
          onClick={() => navigate('/admin/articles')}
        >
          <div className="font-mono text-[11px] text-textMuted flex items-center justify-between">
            <span>Articles</span>
            <span className="px-[6px] py-[1px] bg-[rgba(74,222,128,0.12)] text-green rounded-[8px] text-[9px]">GET</span>
          </div>
          <div className="font-sans text-[32px] font-medium text-textPrimary my-[8px]">
            {isLoading ? '-' : counts?.articles}
          </div>
          <div className="font-mono text-[10px] text-textMuted">total published</div>
        </div>
        
        <div 
          data-testid="admin-stat-card" 
          className="bg-bgSurface border border-border rounded-[8px] p-[20px] cursor-pointer hover:border-green transition-colors"
          onClick={() => navigate('/admin/messages')}
        >
          <div className="font-mono text-[11px] text-textMuted flex items-center justify-between">
            <span>Messages</span>
            <span className="px-[6px] py-[1px] bg-[rgba(74,222,128,0.12)] text-green rounded-[8px] text-[9px]">GET</span>
          </div>
          <div className={`font-sans text-[32px] font-medium my-[8px] ${counts?.messages && counts.messages > 0 ? 'text-amber' : 'text-textPrimary'}`}>
            {isLoading ? '-' : counts?.messages}
          </div>
          <div className="font-mono text-[10px] text-textMuted">total unread</div>
        </div>

      </div>

      <div className="font-mono text-[11px] text-textMuted mb-[12px]">
        // recent_entries
      </div>
      
      <div className="w-full overflow-x-auto bg-bgSurface border border-border rounded-[8px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[8px_12px] text-left font-normal">Resource</th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[8px_12px] text-left font-normal">Title/Name</th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[8px_12px] text-left font-normal">Status</th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[8px_12px] text-left font-normal">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-[10px_12px] text-textMuted font-mono text-[11px]" colSpan={4}>
                  Loading recent entries...
                </td>
              </tr>
            ) : recentEntries.length === 0 ? (
              <tr>
                <td className="p-[10px_12px] text-textMuted font-mono text-[11px]" colSpan={4}>
                  No recent entries found.
                </td>
              </tr>
            ) : (
              recentEntries.map((entry) => (
                <tr key={`${entry.resource}-${entry.id}`} className="border-b border-border hover:bg-bgRaised transition-colors">
                  <td className="p-[10px_12px]">
                    <span className={`font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] ${
                      entry.resource === 'messages' ? 'bg-[rgba(251,191,36,0.12)] text-amber' : 
                      entry.resource === 'projects' ? 'bg-[rgba(74,222,128,0.12)] text-green' : 
                      'bg-[rgba(96,165,250,0.12)] text-blue'
                    }`}>
                      {entry.resource.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-sans text-[13px] text-textPrimary p-[10px_12px]">{entry.title}</td>
                  <td className="p-[10px_12px]">
                    <span className={`font-mono text-[10px] px-[6px] py-[2px] rounded-[3px] ${
                      ['published', 'read'].includes(entry.status) ? 'bg-[rgba(74,222,128,0.1)] text-green' :
                      entry.status === 'unread' ? 'bg-[rgba(251,191,36,0.1)] text-amber' :
                      'bg-[rgba(255,255,255,0.05)] text-textMuted'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-textMuted p-[10px_12px]">
                    {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
