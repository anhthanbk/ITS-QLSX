import type { LucideIcon } from 'lucide-react';
import {
  Landmark,
  Factory,
  Warehouse,
  ShieldCheck,
  Wrench,
  ShieldAlert,
  ShoppingCart,
  DollarSign,
  Users,
  Settings,
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
  // 1. Ban Giám Đốc (Executive / Dashboard)
  {
    id: 'dashboard',
    title: 'Ban Giám Đốc',
    path: '/',
    icon: Landmark,
    children: [
      {
        id: 'executive-overview',
        title: 'Tổng quan điều hành',
        path: '/',
      },
      {
        id: 'executive-oee',
        title: 'Giám sát OEE & Sản lượng',
        path: '/executive/oee',
      },
      {
        id: 'executive-approvals',
        title: 'Phê duyệt & Đề xuất',
        path: '/executive/approvals',
      },
      {
        id: 'executive-reports',
        title: 'Báo cáo điều hành & KPI',
        path: '/executive/reports',
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
        title: 'Kế hoạch sản xuất năm',
        path: '/production/annual-plan',
        requiredPermission: ['production.plan.view', 'production.plan.read'],
      },
      {
        id: 'production-shifts',
        title: 'Theo dõi ca & nhập liệu',
        path: '/production/shifts',
        requiredPermission: ['production.shift.view', 'production.shift.read'],
      },
      {
        id: 'production-norms',
        title: 'Định mức KT - KT',
        path: '/production/norms',
        requiredPermission: ['production.norms.view', 'master_data.read'],
      },
      {
        id: 'production-batches',
        title: 'Lô thành phẩm',
        path: '/production/batches',
        requiredPermission: ['production.batch.view', 'production.plan.read'],
      },
    ],
  },

  // 3. Kho & Vật Tư (Warehouse)
  {
    id: 'warehouse',
    title: 'Kho & Vật tư',
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
        title: 'Nhập / Xuất kho',
        path: '/warehouse/transactions',
        requiredPermission: 'warehouse.transaction.create',
      },
      {
        id: 'warehouse-products',
        title: 'Danh mục sản phẩm & TP',
        path: '/warehouse/products',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-materials',
        title: 'Danh mục vật tư & NVL',
        path: '/warehouse/materials',
        requiredPermission: 'warehouse.stock.view',
      },
      {
        id: 'warehouse-inventory',
        title: 'Kiểm kê kho định kỳ',
        path: '/warehouse/inventory',
        requiredPermission: 'warehouse.view',
      },
      {
        id: 'warehouse-locations',
        title: 'Danh mục kho lưu trữ',
        path: '/warehouse/locations',
        requiredPermission: 'warehouse.view',
      },
    ],
  },

  // 4. Quản Lý Chất Lượng - QC (Quality Control)
  {
    id: 'quality',
    title: 'QC - Quản lý chất lượng',
    path: '/quality',
    icon: ShieldCheck,
    requiredPermission: 'quality.inspection.view',
    children: [
      {
        id: 'quality-incoming',
        title: 'Kiểm tra NVL đầu vào',
        path: '/quality/incoming',
        requiredPermission: 'quality.inspection.view',
      },
      {
        id: 'quality-process',
        title: 'Kiểm tra công đoạn & TP',
        path: '/quality/process',
        requiredPermission: 'quality.inspection.view',
      },
      {
        id: 'quality-ncr',
        title: 'Sự cố không phù hợp (NCR)',
        path: '/quality/ncr',
        requiredPermission: 'quality.inspection.view',
      },
      {
        id: 'quality-standards',
        title: 'Tiêu chuẩn & Hồ sơ KCS',
        path: '/quality/standards',
        requiredPermission: 'quality.inspection.view',
      },
    ],
  },

  // 5. Bảo Trì & Cơ Điện (Maintenance)
  {
    id: 'maintenance',
    title: 'Bảo trì & Cơ điện',
    path: '/maintenance',
    icon: Wrench,
    requiredPermission: 'maintenance.machine.view',
    children: [
      {
        id: 'maintenance-machines',
        title: 'Danh mục thiết bị',
        path: '/maintenance/machines',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-schedules',
        title: 'Lịch bảo dưỡng định kỳ',
        path: '/maintenance/schedules',
        requiredPermission: 'maintenance.schedule.view',
      },
      {
        id: 'maintenance-orders',
        title: 'Phiếu sửa chữa & sự cố',
        path: '/maintenance/orders',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-adjustments',
        title: 'Cải tiến thiết bị',
        path: '/maintenance/adjustments',
        requiredPermission: 'maintenance.machine.view',
      },
      {
        id: 'maintenance-spares',
        title: 'Kho phụ tùng & linh kiện',
        path: '/maintenance/spares',
        requiredPermission: 'maintenance.machine.view',
      },
    ],
  },

  // 6. An Toàn & Môi Trường (HSSE)
  {
    id: 'hsse',
    title: 'HSSE - An toàn & Môi trường',
    path: '/hsse',
    icon: ShieldAlert,
    requiredPermission: 'hsse.incident.view',
    children: [
      {
        id: 'hsse-safety',
        title: 'An toàn hiện trường',
        path: '/hsse/safety',
        requiredPermission: 'hsse.incident.view',
      },
      {
        id: 'hsse-incidents',
        title: 'Báo cáo sự cố & rủi ro',
        path: '/hsse/incidents',
        requiredPermission: 'hsse.incident.view',
      },
      {
        id: 'hsse-environment',
        title: 'Quan trắc môi trường & khí thải',
        path: '/hsse/environment',
        requiredPermission: 'hsse.incident.view',
      },
      {
        id: 'hsse-permits',
        title: 'Cấp phép làm việc (PTW)',
        path: '/hsse/permits',
        requiredPermission: 'hsse.incident.view',
      },
    ],
  },

  // 7. Kinh Doanh - Mua Sắm (Sales & Procurement)
  {
    id: 'sales',
    title: 'Kinh doanh & Mua sắm',
    path: '/sales',
    icon: ShoppingCart,
    requiredPermission: 'sales.order.view',
    children: [
      {
        id: 'sales-orders',
        title: 'Đơn hàng & hợp đồng',
        path: '/sales/orders',
        requiredPermission: 'sales.order.view',
      },
      {
        id: 'sales-customers',
        title: 'Khách hàng & đối tác',
        path: '/sales/customers',
        requiredPermission: 'sales.order.view',
      },
      {
        id: 'procurement-requests',
        title: 'Đề xuất mua sắm (PR)',
        path: '/procurement/requests',
        requiredPermission: 'sales.order.view',
      },
      {
        id: 'procurement-orders',
        title: 'Đơn đặt hàng NCC (PO)',
        path: '/procurement/orders',
        requiredPermission: 'sales.order.view',
      },
    ],
  },

  // 8. Tài Chính - Kế Toán - TCKT (Finance & Accounting)
  {
    id: 'finance',
    title: 'TCKT - Tài chính Kế toán',
    path: '/finance',
    icon: DollarSign,
    requiredPermission: 'finance.costing.view',
    children: [
      {
        id: 'finance-costing',
        title: 'Giá thành sản xuất theo lô',
        path: '/finance/costing',
        requiredPermission: 'finance.costing.view',
      },
      {
        id: 'finance-budget',
        title: 'Chi phí thực tế & ngân sách',
        path: '/finance/budget',
        requiredPermission: 'finance.costing.view',
      },
      {
        id: 'finance-assets',
        title: 'Tài sản cố định & khấu hao',
        path: '/finance/assets',
        requiredPermission: 'finance.costing.view',
      },
      {
        id: 'finance-reports',
        title: 'Báo cáo tài chính quản trị',
        path: '/finance/reports',
        requiredPermission: 'finance.costing.view',
      },
    ],
  },

  // 9. Nhân Sự & Tổ Chức - HR
  {
    id: 'hr',
    title: 'HR - Nhân sự & Tổ chức',
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
        id: 'hr-pending',
        title: 'Chờ xét duyệt tài khoản',
        path: '/hr?tab=pending',
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
        title: 'Chức danh & cấp bậc',
        path: '/hr?tab=positions',
        requiredPermission: 'master_data.read',
      },
    ],
  },

  // 10. Quản Trị Hệ Thống (Dành riêng cho Admin)
  {
    id: 'admin',
    title: 'Quản trị hệ thống',
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
