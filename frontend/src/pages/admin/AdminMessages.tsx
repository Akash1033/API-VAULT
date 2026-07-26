// Path: src/pages/admin/AdminMessages.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, markMessageAsRead, markMessageAsUnread, deleteMessage } from '../../api/admin';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { useToast } from '../../store/uiStore';

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const AdminMessages: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const readParam = filter === 'all' ? undefined : filter === 'read' ? true : false;

  const { data, isLoading } = useQuery({
    queryKey: ['messages', filter],
    queryFn: () => getMessages({ read: readParam }),
  });

  const messages: Message[] = data?.data ?? [];
  const unreadCount: number = data?.meta?.unread ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      showToast('Marked as read', 'success');
    },
    onError: () => showToast('Failed to update message', 'error')
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => markMessageAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      showToast('Marked as unread', 'success');
    },
    onError: () => showToast('Failed to update message', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      showToast('Message deleted', 'success');
      setDeleteId(null);
    },
    onError: () => showToast('Failed to delete message', 'error')
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="flex items-center gap-[12px] mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/contact &rarr; 200 OK</div>
          <div className="flex items-center gap-[12px]">
            <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-[rgba(251,191,36,0.15)] text-amber font-mono text-[10px] px-[8px] py-[2px] rounded-[12px]">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-[8px] mb-[24px]">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as 'all' | 'unread' | 'read')}
            className={`font-mono text-[11px] px-[12px] py-[4px] rounded-[12px] border-none cursor-pointer transition-colors ${
              filter === f ? 'bg-[rgba(251,191,36,0.15)] text-amber' : 'bg-transparent text-textMuted hover:bg-bgRaised'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <div className="font-mono text-[12px] text-textMuted">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="bg-bgSurface border border-border p-[40px_0] rounded-[8px] text-center mt-[16px] flex justify-center">
            <div className="font-mono text-[12px] text-left inline-block">
              <span className="text-textMuted">{'{'}</span><br/>
              <span className="text-blue pl-4">"data"</span><span className="text-textMuted">: </span><span className="text-textPrimary">[]</span><span className="text-textMuted">,</span><br/>
              <span className="text-blue pl-4">"meta"</span><span className="text-textMuted">: {'{ '}</span><span className="text-blue">"total"</span><span className="text-textMuted">: </span><span className="text-textPrimary">0</span><span className="text-textMuted">, </span><span className="text-blue">"unread"</span><span className="text-textMuted">: </span><span className="text-textPrimary">0</span><span className="text-textMuted"> {' }'},</span><br/>
              <span className="text-blue pl-4">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"inbox is empty"</span><br/>
              <span className="text-textMuted">{'}'}</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isExpanded = expandedIds[msg._id];
            return (
              <div 
                key={msg._id}
                data-testid="message-card"
                className={`bg-bgSurface border border-border rounded-[8px] p-[16px_20px] mb-[8px] transition-colors border-l-[2px] ${
                  !msg.isRead ? 'border-l-amber bg-[rgba(251,191,36,0.02)]' : 'border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-[10px]">
                  <div>
                    <div className="font-sans text-[14px] font-medium text-textPrimary">{msg.name}</div>
                    <div className="font-mono text-[11px] text-textMuted">{msg.email}</div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <span className="font-mono text-[11px] text-textMuted">
                      {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!msg.isRead && <span className="w-[6px] h-[6px] bg-amber rounded-full" />}
                  </div>
                </div>
                
                <div 
                  className={`font-sans text-[13px] text-textSecondary leading-[1.6] mt-[10px] ${!isExpanded ? 'overflow-hidden line-clamp-2' : ''}`}
                  style={{ display: !isExpanded ? '-webkit-box' : 'block', WebkitBoxOrient: 'vertical', WebkitLineClamp: !isExpanded ? 2 : 'unset' }}
                >
                  {msg.message}
                </div>
                
                {msg.message && msg.message.length > 100 && (
                  <div className="mt-[4px]">
                    <button 
                      onClick={() => toggleExpand(msg._id)}
                      className="bg-transparent border-none p-0 font-mono text-[11px] text-textMuted hover:text-green cursor-pointer transition-colors"
                    >
                      {isExpanded ? 'collapse \u2191' : 'expand \u2193'}
                    </button>
                  </div>
                )}
                
                <div className="mt-[12px] flex flex-wrap sm:flex-nowrap gap-[10px] items-center pt-[12px] border-t border-border">
                  {!msg.isRead ? (
                    <button 
                      onClick={() => markReadMutation.mutate(msg._id)}
                      className="bg-transparent border border-border font-mono text-[11px] text-textMuted px-[10px] py-[3px] rounded-[4px] hover:border-green hover:text-green cursor-pointer transition-colors"
                    >
                      Mark as read
                    </button>
                  ) : (
                    <button 
                      onClick={() => markUnreadMutation.mutate(msg._id)}
                      className="bg-transparent border border-border font-mono text-[11px] text-textMuted px-[10px] py-[3px] rounded-[4px] hover:border-amber hover:text-amber cursor-pointer transition-colors"
                    >
                      Mark as unread
                    </button>
                  )}
                  <button 
                    onClick={() => setDeleteId(msg._id)}
                    className="bg-transparent border border-border font-mono text-[11px] text-textMuted px-[10px] py-[3px] rounded-[4px] hover:border-red hover:text-red cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                  <a 
                    href={`mailto:${msg.email}?subject=Re: Your message on my portfolio`}
                    className="font-mono text-[11px] text-textMuted no-underline hover:text-green ml-auto transition-colors"
                  >
                    Reply &rarr;
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDelete 
        isOpen={!!deleteId} 
        resourceName="message" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
