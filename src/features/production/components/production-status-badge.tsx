import React from 'react';
import type {
  PlanStatus,
  ShiftStatus,
  OrderStatus,
  OrderPriority,
  ResourceType,
} from '../types';

export const PlanStatusBadge: React.FC<{ status: PlanStatus }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          Dự thảo
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          Đã phê duyệt
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Đang thực hiện
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Đã hoàn thành
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          Đã hủy
        </span>
      );
    default:
      return null;
  }
};

export const ShiftStatusBadge: React.FC<{ status: ShiftStatus }> = ({ status }) => {
  switch (status) {
    case 'in_progress':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Đang vận hành
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          Đã chốt ca
        </span>
      );
    case 'verified':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Đã nghiệm thu
        </span>
      );
    default:
      return null;
  }
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          Dự thảo
        </span>
      );
    case 'scheduled':
      return (
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
          Đã lên lịch
        </span>
      );
    case 'released':
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
          Đã phát lệnh
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Đang gia công
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Hoàn thành
        </span>
      );
    case 'on_hold':
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
          Tạm dừng
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          Đã hủy
        </span>
      );
    default:
      return null;
  }
};

export const OrderPriorityBadge: React.FC<{ priority: OrderPriority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          Khẩn cấp
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Cao
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          Trung bình
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          Thấp
        </span>
      );
    default:
      return null;
  }
};

export const NormResourceTypeBadge: React.FC<{ type: ResourceType }> = ({ type }) => {
  switch (type) {
    case 'electricity':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300">
          ⚡ Điện năng
        </span>
      );
    case 'water':
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/20 dark:bg-blue-950 dark:text-blue-300">
          💧 Nước tuần hoàn
        </span>
      );
    case 'chemical':
      return (
        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/20 dark:bg-purple-950 dark:text-purple-300">
          🧪 Hóa chất / Trợ lắng
        </span>
      );
    case 'diesel':
      return (
        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/20 dark:bg-orange-950 dark:text-orange-300">
          ⛽ Dầu Diesel
        </span>
      );
    case 'coal':
      return (
        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-600/20 dark:bg-stone-900 dark:text-stone-300">
          🪵 Than đốt
        </span>
      );
    case 'explosive':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-700/20 dark:bg-rose-950 dark:text-rose-300">
          💥 Vật liệu nổ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-900 dark:text-slate-300">
          Khác
        </span>
      );
  }
};
