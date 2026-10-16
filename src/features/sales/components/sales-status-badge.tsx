import React from 'react';
import type {
  SalesOrderStatus,
  PurchaseOrderStatus,
  CustomerStatus,
  SupplierStatus,
} from '../types';
import { cn } from '@/lib/utils';

import { salesStatusLabels, purchaseStatusLabels } from '../constants/sales-constants';

interface StatusBadgeProps {
  status: SalesOrderStatus | PurchaseOrderStatus | CustomerStatus | SupplierStatus | string;
  type?: 'sales' | 'purchase' | 'partner';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'sales',
  className,
}) => {
  if (type === 'partner') {
    const isActive = status === 'active';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          isActive
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400',
          className,
        )}
      >
        <span
          className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-zinc-400')}
        />
        {isActive ? 'Đang hoạt động' : 'Ngừng giao dịch'}
      </span>
    );
  }

  if (type === 'purchase') {
    const pStatus = status as PurchaseOrderStatus;
    const label = purchaseStatusLabels[pStatus] || status;

    let badgeClass =
      'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300';
    let dotClass = 'bg-slate-500';

    switch (pStatus) {
      case 'sent':
        badgeClass =
          'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/50 dark:text-blue-300';
        dotClass = 'bg-blue-500';
        break;
      case 'confirmed':
        badgeClass =
          'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20 dark:bg-cyan-950/50 dark:text-cyan-300';
        dotClass = 'bg-cyan-500';
        break;
      case 'partially_received':
        badgeClass =
          'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300';
        dotClass = 'bg-amber-500';
        break;
      case 'received':
        badgeClass =
          'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300';
        dotClass = 'bg-emerald-500';
        break;
      case 'cancelled':
        badgeClass =
          'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300';
        dotClass = 'bg-rose-500';
        break;
      default:
        break;
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          badgeClass,
          className,
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
        {label}
      </span>
    );
  }

  // Sales Order status
  const sStatus = status as SalesOrderStatus;
  const label = salesStatusLabels[sStatus] || status;

  let badgeClass =
    'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300';
  let dotClass = 'bg-slate-500';

  switch (sStatus) {
    case 'confirmed':
      badgeClass =
        'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/50 dark:text-blue-300';
      dotClass = 'bg-blue-500';
      break;
    case 'in_production':
      badgeClass =
        'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950/50 dark:text-indigo-300';
      dotClass = 'bg-indigo-500';
      break;
    case 'ready_to_ship':
      badgeClass =
        'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/50 dark:text-purple-300';
      dotClass = 'bg-purple-500';
      break;
    case 'shipped':
      badgeClass =
        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300';
      dotClass = 'bg-amber-500';
      break;
    case 'delivered':
      badgeClass =
        'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300';
      dotClass = 'bg-emerald-500';
      break;
    case 'cancelled':
      badgeClass =
        'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300';
      dotClass = 'bg-rose-500';
      break;
    default:
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  );
};
