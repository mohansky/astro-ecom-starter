import React from 'react';
import { DataTable } from '../react-ui/DataTable';
import { createStatusHistoryColumns } from '../columns/status-history-columns';

interface StatusHistoryEntry {
  id: number;
  orderId: number;
  previousStatus: string | null;
  newStatus: string;
  changedByUsername: string | null;
  changedByName: string;
  notes: string | null;
  createdAt: string;
}

interface StatusHistoryTableProps {
  statusHistory: StatusHistoryEntry[];
  loading?: boolean;
}

export function StatusHistoryTable({ statusHistory, loading = false }: StatusHistoryTableProps) {
  const columns = createStatusHistoryColumns();

  if (!loading && statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        <p>No status changes recorded yet.</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={statusHistory}
      loading={loading}
      showRefresh={false}
    />
  );
}