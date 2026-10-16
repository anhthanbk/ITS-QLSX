import type { SalesOrderStatus, PurchaseOrderStatus } from '../types';

export const salesStatusLabels: Record<SalesOrderStatus, string> = {
  draft: 'Dự thảo',
  confirmed: 'Đã xác nhận',
  in_production: 'Đang sản xuất',
  ready_to_ship: 'Sẵn sàng giao',
  shipped: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
};

export const purchaseStatusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Dự thảo',
  sent: 'Đã gửi NCC',
  confirmed: 'NCC xác nhận',
  partially_received: 'Nhập một phần',
  received: 'Đã nhập kho',
  cancelled: 'Đã hủy',
};
