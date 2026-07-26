// Path: src/components/admin/AdminTable.tsx
// Purpose: Reusable table component for CRUD pages
// Dependencies: react

import React from 'react';

export interface AdminTableProps<T> {
  columns: Array<{ key: string; label: string; width?: string; render?: (row: T) => React.ReactNode }>;
  data: T[];
  isLoading: boolean;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

export const AdminTable = <T,>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
  extraActions,
  emptyMessage = 'No items found.'
}: AdminTableProps<T>) => {
  return (
    <div className="w-full overflow-x-auto bg-bgSurface border border-border rounded-[8px]">
      <table className="w-full border-collapse text-left whitespace-nowrap md:whitespace-normal">
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ width: col.width }}
                className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal"
              >
                {col.label}
              </th>
            ))}
            <th className="font-mono text-[10px] text-textMuted border-b border-border p-[10px_14px] uppercase tracking-[0.06em] font-normal text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-border">
                <td colSpan={columns.length + 1} className="p-0">
                  <div className="h-[44px] bg-bgRaised skeleton-shimmer w-full" />
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center font-mono text-[12px] text-textMuted p-[40px]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const rowData = row as Record<string, unknown>;
              return (
              <tr key={(rowData._id as string) || (rowData.id as string) || i} className="border-b border-border hover:bg-bgRaised transition-colors duration-150">
                {columns.map((col) => (
                  <td key={col.key} className="p-[12px_14px] font-sans text-[13px] text-textPrimary">
                    {col.render ? col.render(row) : (rowData[col.key] as React.ReactNode)}
                  </td>
                ))}
                <td className="p-[12px_14px] flex flex-wrap md:flex-nowrap justify-end gap-[8px]">
                  {extraActions && extraActions(row)}
                  <button 
                    onClick={() => onEdit(row)}
                    className="font-mono text-[11px] text-textMuted border border-border bg-transparent px-[10px] py-[3px] rounded-[4px] hover:border-amber hover:text-amber cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(row)}
                    className="font-mono text-[11px] text-textMuted border border-border bg-transparent px-[10px] py-[3px] rounded-[4px] hover:border-red hover:text-red cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
