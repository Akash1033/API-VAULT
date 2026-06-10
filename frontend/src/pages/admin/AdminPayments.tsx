// Path: src/pages/admin/AdminPayments.tsx
// Purpose: Admin payments dashboard — revenue stats, donation distribution, payment list, detail modal
// Dependencies: react, recharts, date-fns, tanstack-query, payment API, admin components

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import {
  getAdminPayments,
  getRevenueStats,
  resendThankYouEmail,
  type Payment,
  type RevenueStats,
} from '../../api/payment';
import { AdminModal } from '../../components/admin/AdminModal';
import { Pagination } from '../../components/shared/Pagination';
import { useToast } from '../../store/uiStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PaymentStatusFilter = 'all' | 'captured' | 'created' | 'failed';

function exportToCSV(payments: Payment[]): void {
  const headers = [
    'Date',
    'Donor Name',
    'Email',
    'Amount (INR)',
    'Status',
    'Payment ID',
    'Order ID',
    'Webhook',
    'Message',
  ];
  const rows = payments.map((p) => [
    format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm'),
    p.isAnonymous ? 'Anonymous' : p.donorName,
    p.donorEmail,
    p.amountINR.toString(),
    p.status,
    p.razorpayPaymentId ?? '',
    p.razorpayOrderId,
    p.webhookVerified ? 'yes' : 'no',
    (p.donorMessage ?? '').replace(/,/g, ';'),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getStatusPillClasses(status: Payment['status']): string {
  switch (status) {
    case 'captured':
      return 'bg-[rgba(74,222,128,0.1)] text-green';
    case 'created':
      return 'bg-[rgba(96,165,250,0.1)] text-blue';
    case 'failed':
      return 'bg-[rgba(248,113,113,0.1)] text-red';
    case 'refunded':
      return 'bg-[rgba(251,191,36,0.1)] text-amber';
    default:
      return 'bg-[rgba(255,255,255,0.05)] text-textMuted';
  }
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-bgSurface border border-border rounded-[8px] p-[18px_20px]">
    <div className="h-[12px] w-[100px] bg-bgRaised skeleton-shimmer rounded-[3px] mb-[12px]" />
    <div className="h-[32px] w-[120px] bg-bgRaised skeleton-shimmer rounded-[3px] mb-[8px]" />
    <div className="h-[10px] w-[80px] bg-bgRaised skeleton-shimmer rounded-[3px]" />
  </div>
);

// ─── Revenue Stats Cards ─────────────────────────────────────────────────────

const RevenueStatsCards: React.FC<{
  stats: RevenueStats | undefined;
  isLoading: boolean;
}> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-4 gap-[14px] mb-[28px]">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const pct =
    stats.lastMonth > 0
      ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
      : stats.thisMonth > 0
        ? 100
        : 0;

  return (
    <div className="grid grid-cols-4 gap-[14px] mb-[28px]">
      {/* Card 1 — Total Revenue */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[18px_20px]">
        <div className="font-mono text-[10px] text-textMuted mb-[8px]">// total_revenue</div>
        <div className="font-sans text-[32px] font-medium text-green leading-none">
          ₹{stats.totalRevenue.toLocaleString('en-IN')}
        </div>
        <div className="font-mono text-[10px] text-textMuted mt-[8px]">all time</div>
      </div>

      {/* Card 2 — This Month */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[18px_20px]">
        <div className="font-mono text-[10px] text-textMuted mb-[8px]">// this_month</div>
        <div className="font-sans text-[32px] font-medium text-textPrimary leading-none">
          ₹{stats.thisMonth.toLocaleString('en-IN')}
        </div>
        <div
          className="font-mono text-[10px] mt-[8px]"
          style={{ color: pct >= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs last month
        </div>
      </div>

      {/* Card 3 — Total Donors */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[18px_20px]">
        <div className="font-mono text-[10px] text-textMuted mb-[8px]">// total_donors</div>
        <div className="font-sans text-[32px] font-medium text-textPrimary leading-none">
          {stats.totalDonors}
        </div>
        <div className="font-mono text-[10px] text-textMuted mt-[8px]">unique supporters</div>
      </div>

      {/* Card 4 — Avg Donation */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[18px_20px]">
        <div className="font-mono text-[10px] text-textMuted mb-[8px]">// avg_donation</div>
        <div className="font-sans text-[32px] font-medium text-amber leading-none">
          ₹{stats.avgDonation}
        </div>
        <div className="font-mono text-[10px] text-textMuted mt-[8px]">per donor</div>
      </div>
    </div>
  );
};

// ─── Donation Distribution Chart ──────────────────────────────────────────────

const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  color: 'var(--text-primary)',
};

const DonationDistribution: React.FC<{
  stats: RevenueStats | undefined;
  isLoading: boolean;
}> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] mb-[28px]">
        <div className="h-[160px] w-full bg-bgRaised skeleton-shimmer rounded-[4px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[3fr_2fr] gap-[16px] mb-[28px]">
      {/* LEFT — Horizontal bar chart */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[20px]">
        <div className="font-mono text-[11px] text-textMuted mb-[12px]">
          // donations_by_amount_range
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={stats.byAmount}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{
                fill: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            />
            <YAxis
              type="category"
              dataKey="range"
              tick={{
                fill: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              width={80}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="count" fill="var(--amber)" radius={[0, 3, 3, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RIGHT — Text breakdown */}
      <div className="bg-bgSurface border border-border rounded-[8px] p-[20px]">
        <div className="font-mono text-[11px] text-textMuted mb-[12px]">// breakdown</div>
        <div className="flex flex-col">
          {stats.byAmount.map((item) => (
            <div
              key={item.range}
              className="flex justify-between py-[6px] border-b border-border last:border-b-0"
            >
              <span className="font-mono text-[11px] text-textSecondary">{item.range}</span>
              <span className="font-mono text-[11px] text-textMuted">{item.count} donors</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Payment Detail Modal ─────────────────────────────────────────────────────

const PaymentDetailModal: React.FC<{
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ payment, isOpen, onClose }) => {
  const { showToast } = useToast();

  const resendMutation = useMutation({
    mutationFn: (id: string) => resendThankYouEmail(id),
    onSuccess: () => {
      showToast('Thank you email resent', 'success');
    },
    onError: () => {
      showToast('Failed to resend email', 'error');
    },
  });

  if (!payment) return null;

  // Build the JSON display object
  const jsonData = {
    _id: payment._id,
    razorpayOrderId: payment.razorpayOrderId,
    ...(payment.razorpayPaymentId ? { razorpayPaymentId: payment.razorpayPaymentId } : {}),
    amountINR: payment.amountINR,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    status: payment.status,
    webhookVerified: payment.webhookVerified,
    emailSent: payment.emailSent,
    donor: {
      name: payment.donorName,
      email: payment.donorEmail,
      ...(payment.donorMessage ? { message: payment.donorMessage } : {}),
      ...(payment.donorSocialLink ? { socialLink: payment.donorSocialLink } : {}),
      isAnonymous: payment.isAnonymous,
      showOnWall: payment.showOnWall,
    },
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="payment_detail" size="md">
      <div className="font-mono text-[12px] leading-[1.9] mb-[20px]">
        <JsonViewer data={jsonData} />
      </div>

      <div className="flex justify-between items-center pt-[16px] border-t border-border">
        {payment.status === 'captured' && payment.donorEmail ? (
          <button
            onClick={() => resendMutation.mutate(payment._id)}
            disabled={resendMutation.isPending}
            className="font-mono text-[11px] border border-border text-textMuted bg-transparent px-[14px] py-[6px] rounded-[4px] hover:border-amber hover:text-amber cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendMutation.isPending ? 'Sending...' : 'Resend Thank You Email'}
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          className="font-mono text-[11px] border border-border text-textMuted bg-transparent px-[14px] py-[6px] rounded-[4px] hover:border-borderHover hover:text-textPrimary cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </AdminModal>
  );
};

// ─── JSON Viewer with syntax highlighting ─────────────────────────────────────

const JsonViewer: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  return <div>{renderJsonValue(data, 0)}</div>;
};

function renderJsonValue(value: unknown, indent: number): React.ReactNode {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return <span className="text-textMuted">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-green">{value.toString()}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-purple">{value}</span>;
  }

  if (typeof value === 'string') {
    // Check if it looks like a URL
    const isUrl = /^https?:\/\//.test(value);
    if (isUrl) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green hover:underline no-underline"
        >
          &quot;{value}&quot;
        </a>
      );
    }
    return <span className="text-amber">&quot;{value}&quot;</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-textMuted">[]</span>;
    return (
      <>
        <span className="text-textMuted">[</span>
        {'\n'}
        {value.map((item, i) => (
          <React.Fragment key={i}>
            {padInner}
            {renderJsonValue(item, indent + 1)}
            {i < value.length - 1 && <span className="text-textMuted">,</span>}
            {'\n'}
          </React.Fragment>
        ))}
        {pad}
        <span className="text-textMuted">]</span>
      </>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-textMuted">{'{}'}</span>;
    return (
      <>
        <span className="text-textMuted">{'{'}</span>
        {'\n'}
        {entries.map(([key, val], i) => (
          <React.Fragment key={key}>
            {padInner}
            <span className="text-blue">&quot;{key}&quot;</span>
            <span className="text-textMuted">: </span>
            {renderJsonValue(val, indent + 1)}
            {i < entries.length - 1 && <span className="text-textMuted">,</span>}
            {'\n'}
          </React.Fragment>
        ))}
        {pad}
        <span className="text-textMuted">{'}'}</span>
      </>
    );
  }

  return <span className="text-textMuted">{String(value)}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminPayments: React.FC = () => {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const LIMIT = 15;

  // Revenue stats query
  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: getRevenueStats,
    staleTime: 60 * 1000,
  });

  // Payments list query
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
  } = useQuery({
    queryKey: ['admin-payments', statusFilter, page],
    queryFn: () =>
      getAdminPayments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: LIMIT,
      }),
  });

  const payments = paymentsData?.payments ?? [];
  const meta = paymentsData?.meta;

  const statusFilters: PaymentStatusFilter[] = ['all', 'captured', 'created', 'failed'];

  return (
    <>
      {/* ─── PAGE HEADER ──────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-[28px]">
        <div>
          <div className="font-mono text-[12px] text-green">
            GET /api/v1/payment/admin &rarr; 200 OK
          </div>
          <h1 className="font-sans text-[26px] font-medium text-textPrimary m-0 mt-[4px]">
            Payments
          </h1>
        </div>
        <div className="flex gap-[10px]">
          <button
            onClick={() => {
              if (payments.length === 0) {
                showToast('No payments to export', 'error');
                return;
              }
              exportToCSV(payments);
              showToast('CSV exported', 'success');
            }}
            className="font-mono text-[11px] border border-border text-textMuted bg-transparent px-[14px] py-[7px] rounded-[4px] hover:border-borderHover hover:text-textPrimary cursor-pointer transition-colors"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* ─── SECTION A: Revenue Stats Cards ───────────────────── */}
      <RevenueStatsCards stats={stats} isLoading={statsLoading} />

      {/* ─── SECTION B: Donation Distribution Chart ───────────── */}
      <DonationDistribution stats={stats} isLoading={statsLoading} />

      {/* ─── SECTION C: Payment Transactions Table ────────────── */}

      {/* Filter bar */}
      <div className="flex justify-between items-center mb-[16px]">
        <div className="flex gap-[8px]">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
              className={`font-mono text-[11px] px-[12px] py-[4px] rounded-[12px] border-none cursor-pointer transition-colors ${
                statusFilter === f
                  ? 'bg-[rgba(251,191,36,0.15)] text-amber'
                  : 'bg-transparent text-textMuted hover:bg-bgRaised'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {meta && (
          <span className="font-mono text-[11px] text-textMuted">
            {meta.total} payments{stats ? ` · ₹${stats.totalRevenue.toLocaleString('en-IN')} total captured` : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-bgSurface border border-border rounded-[8px]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal" style={{ width: '200px' }}>
                Donor
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Amount
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Status
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Webhook
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Email
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Wall
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal">
                Date
              </th>
              <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-border">
                  <td colSpan={8} className="p-0">
                    <div className="h-[44px] bg-bgRaised skeleton-shimmer w-full" />
                  </td>
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center font-mono text-[12px] text-textMuted p-[40px]"
                >
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-border hover:bg-bgRaised transition-colors duration-150 relative"
                  onMouseEnter={() => setHoveredRowId(p._id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {/* Donor */}
                  <td className="p-[12px_14px]" style={{ width: '200px' }}>
                    <div className="flex flex-col">
                      <span
                        className={`font-sans text-[13px] ${
                          p.isAnonymous ? 'text-textMuted italic' : 'text-textPrimary'
                        }`}
                      >
                        {p.isAnonymous ? 'Anonymous' : p.donorName}
                      </span>
                      <span className="font-mono text-[10px] text-textMuted">{p.donorEmail}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="p-[12px_14px]">
                    <span
                      className="font-mono text-[13px]"
                      style={{
                        color: p.status === 'captured' ? 'var(--amber)' : 'var(--text-muted)',
                      }}
                    >
                      ₹{p.amountINR.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-[12px_14px]">
                    <span
                      className={`font-mono text-[10px] px-[8px] py-[2px] rounded-[10px] inline-block ${getStatusPillClasses(p.status)}`}
                    >
                      ● {p.status}
                    </span>
                  </td>

                  {/* Webhook */}
                  <td className="p-[12px_14px]">
                    <span
                      className="font-mono text-[10px]"
                      style={{
                        color: p.webhookVerified ? 'var(--green)' : 'var(--text-muted)',
                      }}
                    >
                      {p.webhookVerified ? '✓ verified' : 'pending'}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="p-[12px_14px]">
                    <span
                      className="font-mono text-[10px]"
                      style={{
                        color: p.emailSent ? 'var(--green)' : 'var(--text-muted)',
                      }}
                    >
                      {p.emailSent ? '✓ sent' : '—'}
                    </span>
                  </td>

                  {/* Wall */}
                  <td className="p-[12px_14px]">
                    <span
                      className="font-mono text-[10px]"
                      style={{
                        color: p.showOnWall ? 'var(--green)' : 'var(--text-muted)',
                      }}
                    >
                      {p.showOnWall ? '● public' : '● private'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="p-[12px_14px]">
                    <span className="font-mono text-[10px] text-textMuted">
                      {format(new Date(p.createdAt), 'dd MMM yy · HH:mm')}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-[12px_14px] text-right">
                    <button
                      onClick={() => setDetailPayment(p)}
                      className="font-mono text-[11px] text-textMuted border border-border bg-transparent px-[10px] py-[3px] rounded-[4px] hover:border-amber hover:text-amber cursor-pointer transition-colors"
                    >
                      Details
                    </button>
                  </td>

                  {/* Hover tooltip for donor message */}
                  {hoveredRowId === p._id && p.donorMessage && (
                    <td className="absolute left-[14px] bottom-0 translate-y-full z-10 pointer-events-none" colSpan={8}>
                      <div className="font-mono text-[10px] text-textMuted bg-bgRaised border border-border px-[10px] py-[6px] rounded-[4px] max-w-[400px] whitespace-normal shadow-lg">
                        // message: {p.donorMessage}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          totalItems={meta.total}
          itemsPerPage={LIMIT}
        />
      )}

      {/* ─── PAYMENT DETAIL MODAL ─────────────────────────────── */}
      <PaymentDetailModal
        payment={detailPayment}
        isOpen={!!detailPayment}
        onClose={() => setDetailPayment(null)}
      />
    </>
  );
};

export default AdminPayments;
