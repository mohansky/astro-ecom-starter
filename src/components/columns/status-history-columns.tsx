import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '../../lib/helpers';

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

const statusBadges: Record<string, string> = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-error',
};

function getStatusBadge(status: string): string {
  return statusBadges[status] || 'badge-neutral';
}

export const createStatusHistoryColumns = (): ColumnDef<StatusHistoryEntry>[] => [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return (
        <span className="text-sm">
          {formatDate(createdAt)}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'previousStatus',
    header: 'From',
    cell: ({ row }) => {
      const previousStatus = row.getValue('previousStatus') as string | null;
      return previousStatus ? (
        <span className={`badge badge-xs ${getStatusBadge(previousStatus)}`}>
          {previousStatus}
        </span>
      ) : (
        <span className="text-base-content/50">-</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'newStatus',
    header: 'To',
    cell: ({ row }) => {
      const newStatus = row.getValue('newStatus') as string;
      return (
        <span className={`badge badge-xs ${getStatusBadge(newStatus)}`}>
          {newStatus}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    id: 'changedBy',
    header: 'Changed By',
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            @{entry.changedByUsername || entry.changedByName}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string | null;
      return notes ? (
        <span className="text-sm text-base-content/80 max-w-xs truncate">
          {notes}
        </span>
      ) : (
        <span className="text-sm text-base-content/40 italic">
          No notes
        </span>
      );
    },
    enableSorting: false,
  },
];

export const statusHistoryColumns = createStatusHistoryColumns();