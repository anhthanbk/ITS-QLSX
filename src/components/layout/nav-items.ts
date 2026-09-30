import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Factory,
  Warehouse,
  Wrench,
  Pickaxe,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  ShoppingCart,
  Settings,
  Users,
} from 'lucide-react';

export interface NavSubItem {
  id: string;
  title: string;
  path: string;
  requiredPermission?: string | string[];
  requiredRole?: string | string[];
}

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  requiredPermission?: string | string[];
  requiredRole?: string | string[];
  children?: NavSubItem[];
  badge?: string;
}

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Tổng quan',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'production',
    title: 'Sản xuất',
    path: '/production',
    icon: Factory,
    requiredPermission: [
      'production.plan.view',
      'production.shift.view',
      'production.norms.view',
      'production.batch.view',
    ],
    children: [
      {
        id: 'production-plans',
        title: 'Kế hoạch sản xuất',
        path: '/production/plans',
        requiredPermission: 'production.plan.view',
      },
      {
        id: 'production-shifts',
        title: 'Theo dõi ca & nhập liệu',
        path: '/production/shifts',
        requiredPermission: 'production.shift.view',
      },
      {
        id: 'production-norms',
        title: 'Định mức KT - KT',
        path: '/production/norms',
        requiredPermission: 'production.norms.view',
      },
      {
        id: 'production-batches',
        title: 'Lô thành phẩm',
        path: '/production/batches',
        requiredPermission: 'production.batch.view',
      },
    ],
  },
  {
    id: 'warehouse',
    title: 'Kho & Vật tư',
    path: '/warehouse',
    icon: Warehouse,
    requiredPermission: ['warehouse.view', 'warehouse.stock.view'],
    children: [
      {
        id: 'warehouse-stock',
        title: 'Tồn kho & vật tư',
        path: '/warehouse/stock',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-transactions',
        title: 'Nhập / Xuất kho',
        path: '/warehouse/transactions',
        requiredPermission: 'warehouse.transaction.create',
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Thiết bị & Bảo trì',
    path: '/maintenance',
    icon: Wrench,
    requiredPermission: 'maintenance.machine.view',
    children: [
      {
        id: 'maintenance-machines',
        title: 'Danh sách thiết bị',
        path: '/maintenance/machines',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-schedules',
        title: 'Lịch bảo dưỡng',
        path: '/maintenance/schedules',
        requiredPermission: 'maintenance.schedule.view',
      },
    ],
  },
  {
    id: 'mining',
    title: 'Khai thác mỏ',
    path: '/mining',
    icon: Pickaxe,
    requiredPermission: 'mining.plan.view',
    children: [
      {
        id: 'mining-plans',
        title: 'Kế hoạch khai thác',
        path: '/mining/plans',
        requiredPermission: 'mining.plan.view',
      },
      {
        id: 'mining-logs',
        title: 'Nhật ký vận chuyển',
        path: '/mining/logs',
        requiredPermission: 'mining.log.view',
      },
    ],
  },
  {
    id: 'quality',
    title: 'Quản lý Chất lượng',
    path: '/quality',
    icon: ShieldCheck,
    requiredPermission: 'quality.inspection.view',
  },
  {
    id: 'hsse',
    title: 'An toàn & Môi trường',
    path: '/hsse',
    icon: ShieldAlert,
    requiredPermission: 'hsse.incident.view',
  },
  {
    id: 'finance',
    title: 'Giá thành sản xuất',
    path: '/finance',
    icon: DollarSign,
    requiredPermission: 'finance.costing.view',
  },
  {
    id: 'sales',
    title: 'Bán hàng & Đơn hàng',
    path: '/sales',
    icon: ShoppingCart,
    requiredPermission: 'sales.order.view',
  },
  {
    id: 'hr',
    title: 'Nhân sự & Tổ chức',
    path: '/hr',
    icon: Users,
    requiredPermission: ['hr.employee.read', 'master_data.read'],
  },
  {
    id: 'admin',
    title: 'Quản trị hệ thống',
    path: '/admin',
    icon: Settings,
    requiredRole: 'admin',
    children: [
      {
        id: 'admin-users',
        title: 'Người dùng & Phân quyền',
        path: '/admin-only',
        requiredRole: 'admin',
      },
      {
        id: 'admin-audit',
        title: 'Nhật ký thao tác',
        path: '/admin/audit',
        requiredRole: 'admin',
      },
    ],
  },
];

export function filterNavItems(
  items: NavItem[],
  hasPermission: (perm: string) => boolean,
  hasRole: (role: string) => boolean,
): NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    // Check role gate
    if (item.requiredRole) {
      const roles = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
      if (!roles.some((r) => hasRole(r))) {
        continue;
      }
    }

    // Filter children first if present
    let allowedChildren: NavSubItem[] | undefined;
    if (item.children) {
      allowedChildren = item.children.filter((child) => {
        if (child.requiredRole) {
          const childRoles = Array.isArray(child.requiredRole)
            ? child.requiredRole
            : [child.requiredRole];
          if (!childRoles.some((r) => hasRole(r))) return false;
        }
        if (child.requiredPermission) {
          const childPerms = Array.isArray(child.requiredPermission)
            ? child.requiredPermission
            : [child.requiredPermission];
          if (!childPerms.some((p) => hasPermission(p))) return false;
        }
        return true;
      });

      // If item has children, but none are allowed, and parent requires permission, skip
      if (allowedChildren.length === 0 && item.children.length > 0) {
        if (item.requiredPermission) {
          const perms = Array.isArray(item.requiredPermission)
            ? item.requiredPermission
            : [item.requiredPermission];
          if (!perms.some((p) => hasPermission(p))) {
            continue;
          }
        }
      }
    }

    // Check item permissions
    if (item.requiredPermission) {
      const perms = Array.isArray(item.requiredPermission)
        ? item.requiredPermission
        : [item.requiredPermission];
      const isPermitted = perms.some((p) => hasPermission(p));
      if (!isPermitted && (!allowedChildren || allowedChildren.length === 0)) {
        continue;
      }
    }

    result.push({
      ...item,
      children: allowedChildren,
    });
  }

  return result;
}
