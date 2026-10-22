import type { LucideIcon } from 'lucide-react';
import {
  Landmark,
  Factory,
  Warehouse,
  Wrench,
  ShoppingCart,
  Users,
  Settings,
  LayoutGrid,
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
  // 0. Cổng chức năng AppSheet Portal Hub
  {
    id: 'portal-hub',
    title: 'Cổng chức năng (Portal Hub)',
    path: '/',
    icon: LayoutGrid,
  },

  // 1. Điều Hành (Executive)
  {
    id: 'dashboard',
    title: 'Điều hành',
    path: '/executive/overview',
    icon: Landmark,
    children: [
      {
        id: 'executive-overview',
        title: 'Tổng quan điều hành',
        path: '/executive/overview',
      },
    ],
  },

  // 2. Sản Xuất (Production)
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
      'production.plan.read',
      'production.shift.read',
    ],
    children: [
      {
        id: 'production-annual-plan',
        title: 'Kế hoạch',
        path: '/production/annual-plan',
        requiredPermission: ['production.plan.view', 'production.plan.read'],
      },
      {
        id: 'production-shifts',
        title: 'Nhập liệu',
        path: '/production/shifts',
        requiredPermission: ['production.shift.view', 'production.shift.read'],
      },
      {
        id: 'production-patrols',
        title: 'Tuần kiểm',
        path: '/production/patrols',
        requiredPermission: ['production.shift.view', 'production.shift.read'],
      },
      {
        id: 'production-incidents',
        title: 'Downtime',
        path: '/production/incidents',
        requiredPermission: ['production.shift.view', 'production.shift.read'],
      },
    ],
  },

  // 3. Kho Vận (Warehouse & Logistics)
  {
    id: 'warehouse',
    title: 'Kho vận',
    path: '/warehouse',
    icon: Warehouse,
    requiredPermission: ['warehouse.view', 'warehouse.stock.view'],
    children: [
      {
        id: 'warehouse-stock',
        title: 'Báo cáo tồn kho tổng hợp',
        path: '/warehouse/stock',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-transactions',
        title: 'Biên bản giao nhận & Nhập xuất',
        path: '/warehouse/transactions',
        requiredPermission: 'warehouse.transaction.create',
      },
      {
        id: 'warehouse-products',
        title: 'Danh mục sản phẩm & BTP',
        path: '/warehouse/products',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-materials',
        title: 'Danh mục vật tư & hóa chất',
        path: '/warehouse/materials',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-inventory',
        title: 'Kiểm kê kho định kỳ',
        path: '/warehouse/inventory',
        requiredPermission: 'warehouse.view',
      },
    ],
  },

  // 4. Bảo Trì (Maintenance)
  {
    id: 'maintenance',
    title: 'Bảo trì',
    path: '/maintenance',
    icon: Wrench,
    requiredPermission: 'maintenance.machine.view',
    children: [
      {
        id: 'maintenance-machines',
        title: 'Danh mục thiết bị máy móc',
        path: '/maintenance/machines',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-orders',
        title: 'Phiếu sửa chữa (Work Orders)',
        path: '/maintenance/orders',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-schedules',
        title: 'Lịch bảo dưỡng định kỳ',
        path: '/maintenance/schedules',
        requiredPermission: 'maintenance.schedule.view',
      },
      {
        id: 'maintenance-spares',
        title: 'Kho phụ tùng & linh kiện',
        path: '/maintenance/spares',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-adjustments',
        title: 'Cải tiến & hiệu chỉnh máy',
        path: '/maintenance/adjustments',
        requiredPermission: 'maintenance.machine.view',
      },
    ],
  },

  // 5. Kinh Doanh (Sales & Procurement)
  {
    id: 'sales',
    title: 'Kinh doanh',
    path: '/sales',
    icon: ShoppingCart,
    children: [
      {
        id: 'sales-dashboard',
        title: 'Dashboard Kinh Doanh',
        path: '/sales/dashboard',
        requiredPermission: 'sales.order.view',
      },
      {
        id: 'sales-orders',
        title: 'Kế hoạch bán hàng & Đơn hàng',
        path: '/sales/orders',
        requiredPermission: 'sales.order.view',
      },
      {
        id: 'sales-customers',
        title: 'Danh mục Khách hàng',
        path: '/sales/customers',
        requiredPermission: 'sales.order.view',
      },
    ],
  },

  // 6. Nhân Sự - HR
  {
    id: 'hr',
    title: 'Nhân sự',
    path: '/hr',
    icon: Users,
    requiredPermission: ['hr.employee.read', 'master_data.read'],
    children: [
      {
        id: 'hr-employees',
        title: 'Hồ sơ nhân viên',
        path: '/hr',
        requiredPermission: 'hr.employee.read',
      },
      {
        id: 'hr-departments',
        title: 'Cơ cấu phòng ban',
        path: '/hr?tab=departments',
        requiredPermission: 'master_data.read',
      },
      {
        id: 'hr-positions',
        title: 'Chức danh & vị trí',
        path: '/hr?tab=positions',
        requiredPermission: 'master_data.read',
      },
      {
        id: 'hr-pending',
        title: 'Xét duyệt tài khoản',
        path: '/hr?tab=pending',
        requiredPermission: 'hr.employee.read',
      },
    ],
  },

  // 7. Hệ Thống (Dành riêng cho Admin)
  {
    id: 'admin',
    title: 'Hệ thống',
    path: '/admin',
    icon: Settings,
    requiredRole: 'admin',
    children: [
      {
        id: 'admin-users',
        title: 'Người dùng & phân quyền',
        path: '/admin-only',
        requiredRole: 'admin',
      },
      {
        id: 'admin-audit',
        title: 'Nhật ký thao tác hệ thống',
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
