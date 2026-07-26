// Path: src/pages/admin/AdminSettings.tsx
// Purpose: Admin settings page — maintenance mode toggle with confirmation dialog
// Dependencies: react, @tanstack/react-query, admin API, ToggleSwitch component

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaintenanceStatus, updateMaintenanceStatus } from '../../api/admin';
import { useToast } from '../../store/uiStore';

export const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: getMaintenanceStatus,
  });

  // Sync form state from query data
  useEffect(() => {
    if (data?.data) {
      setMaintenanceMode(data.data.maintenanceMode);
      setMaintenanceMessage(data.data.maintenanceMessage);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateMaintenanceStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
      const mode = res.data?.maintenanceMode;
      showToast(
        mode ? 'Maintenance mode enabled — site is offline' : 'Maintenance mode disabled — site is live',
        'success'
      );
      setHasChanges(false);
      setShowConfirmDialog(false);
    },
    onError: () => {
      showToast('Failed to update maintenance settings', 'error');
      setShowConfirmDialog(false);
    },
  });

  const handleToggle = (newValue: boolean) => {
    if (newValue) {
      // Enabling maintenance — show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // Disabling maintenance — apply immediately
      setMaintenanceMode(false);
      mutation.mutate({ maintenanceMode: false });
    }
  };

  const confirmEnable = () => {
    setMaintenanceMode(true);
    mutation.mutate({ maintenanceMode: true, maintenanceMessage });
  };

  const handleSaveMessage = () => {
    mutation.mutate({ maintenanceMessage });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">
            GET /api/v1/settings/maintenance &rarr; 200 OK
          </div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Settings</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-bgSurface border border-border rounded-[8px] p-[24px]">
          <div className="h-[20px] w-[200px] bg-bgRaised skeleton-shimmer rounded-[3px] relative overflow-hidden" />
        </div>
      ) : (
        <div className="flex flex-col gap-[24px]">
          {/* ─── MAINTENANCE MODE CARD ─── */}
          <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] sm:p-[24px]">
            <div className="font-mono text-[10px] text-textMuted mb-[16px]">
              // maintenance_mode
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[16px] mb-[20px]">
              <div>
                <div className="font-sans text-[15px] text-textPrimary font-medium">
                  Maintenance Mode
                </div>
                <div className="font-mono text-[11px] text-textMuted mt-[4px]">
                  When enabled, all public-facing routes return 503 and the site shows a maintenance page.
                  Admin panel and login remain accessible.
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-[10px] cursor-pointer select-none shrink-0">
                <div
                  onClick={() => handleToggle(!maintenanceMode)}
                  className="relative w-[44px] h-[22px] rounded-full transition-colors duration-200"
                  style={{
                    background: maintenanceMode ? 'var(--amber)' : 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="absolute top-[3px] w-[14px] h-[14px] rounded-full transition-all duration-200"
                    style={{
                      left: maintenanceMode ? '25px' : '4px',
                      background: maintenanceMode ? 'var(--bg-base)' : 'var(--text-muted)',
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[11px]"
                  style={{
                    color: maintenanceMode ? 'var(--amber)' : 'var(--text-muted)',
                  }}
                >
                  {maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-[8px] mb-[20px]">
              <span
                className="inline-block w-[8px] h-[8px] rounded-full"
                style={{
                  background: maintenanceMode ? 'var(--amber)' : 'var(--green)',
                  boxShadow: maintenanceMode
                    ? '0 0 6px var(--amber)'
                    : '0 0 6px var(--green)',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}
              />
              <span
                className="font-mono text-[11px]"
                style={{
                  color: maintenanceMode ? 'var(--amber)' : 'var(--green)',
                }}
              >
                {maintenanceMode ? 'Site is offline' : 'Site is live'}
              </span>
            </div>

            {/* Maintenance message editor */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-mono text-[11px] text-textMuted">maintenance message</label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => {
                  setMaintenanceMessage(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="We're currently performing maintenance. Please check back shortly."
                rows={3}
                className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[12px] py-[8px] outline-none focus:border-green w-full resize-y"
              />
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-textMuted">
                  {maintenanceMessage.length}/500 characters
                </span>
                {hasChanges && (
                  <button
                    onClick={handleSaveMessage}
                    disabled={mutation.isPending || maintenanceMessage.length === 0 || maintenanceMessage.length > 500}
                    className="font-mono text-[11px] border border-green text-green bg-transparent px-[14px] py-[5px] rounded-[4px] cursor-pointer hover:bg-[rgba(74,222,128,0.08)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? 'Saving...' : 'Save Message'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── INFO CARD ─── */}
          <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] sm:p-[24px]">
            <div className="font-mono text-[10px] text-textMuted mb-[12px]">
              // excluded_routes
            </div>
            <div className="font-mono text-[11px] text-textMuted leading-[1.8]">
              <div className="text-textSecondary mb-[8px]">
                These routes remain accessible during maintenance:
              </div>
              <div className="pl-[12px] border-l-[2px] border-border flex flex-col gap-[2px]">
                <span><span className="text-green">✓</span> /api/v1/auth/* <span className="text-textMuted">— login, refresh, logout</span></span>
                <span><span className="text-green">✓</span> /api/v1/settings/* <span className="text-textMuted">— this page</span></span>
                <span><span className="text-green">✓</span> /api/v1/dashboard/* <span className="text-textMuted">— admin stats</span></span>
                <span><span className="text-green">✓</span> /api/v1/upload/* <span className="text-textMuted">— image uploads</span></span>
                <span><span className="text-green">✓</span> /api/v1/analytics/(stats|live|stream) <span className="text-textMuted">— admin analytics</span></span>
                <span><span className="text-green">✓</span> /api/v1/payment/(admin|stats) <span className="text-textMuted">— admin payments</span></span>
                <span><span className="text-green">✓</span> /api/health <span className="text-textMuted">— health check</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG ─── */}
      {showConfirmDialog && (
        <>
          <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[100]"
            onClick={() => setShowConfirmDialog(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-bgSurface border border-border rounded-[8px] w-[calc(100%-32px)] max-w-[440px] p-[24px]"
          >
            <div className="font-mono text-[13px] text-textPrimary mb-[16px]">
              // confirm_maintenance_mode
            </div>

            <div className="bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.2)] rounded-[6px] p-[14px] mb-[20px]">
              <div className="font-mono text-[11px] text-amber leading-[1.7]">
                ⚠ This will take your live site down immediately.
              </div>
              <div className="font-mono text-[10px] text-textMuted mt-[6px] leading-[1.6]">
                All public visitors will see a 503 maintenance page.
                All public API endpoints will return 503.
                The admin panel will remain accessible so you can turn it back off.
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-[10px]">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="bg-transparent border border-border text-textMuted px-[16px] py-[8px] rounded-[4px] font-mono text-[12px] cursor-pointer hover:border-textMuted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnable}
                disabled={mutation.isPending}
                className="bg-[rgba(251,191,36,0.15)] border border-[rgba(251,191,36,0.3)] text-amber px-[16px] py-[8px] rounded-[4px] font-mono text-[12px] cursor-pointer hover:bg-[rgba(251,191,36,0.25)] transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Enabling...' : 'Enable Maintenance Mode'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminSettings;
