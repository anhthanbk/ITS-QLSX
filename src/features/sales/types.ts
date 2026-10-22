export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export type CustomerStatus = 'active' | 'inactive';
export type SupplierStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  code: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_limit: number | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  fulfilled_quantity: number;
  created_at: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string;
  };
}

export interface SalesOrder {
  id: string;
  order_code: string;
  customer_id: string;
  order_date: string;
  promised_delivery_date: string | null;
  carrier_name?: string | null;
  vehicle_plate?: string | null;
  driver_info?: string | null;
  delivery_location?: string | null;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: SalesOrderStatus;
  payment_terms: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    code: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  items?: SalesOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  received_quantity: number;
  created_at: string;
  material?: {
    id: string;
    code: string;
    name: string;
    unit_of_measure: string;
  };
}

export interface PurchaseOrder {
  id: string;
  po_code: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date: string | null;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: PurchaseOrderStatus;
  payment_terms: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    code: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  items?: PurchaseOrderItem[];
}

export interface SalesMetrics {
  totalSalesOrders: number;
  confirmedSalesOrders: number;
  totalSalesAmount: number;
  totalCustomers: number;
  totalPurchaseOrders: number;
  confirmedPurchaseOrders: number;
  totalPurchaseAmount: number;
  totalSuppliers: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SalesOrderFilterParams {
  search?: string;
  status?: SalesOrderStatus | 'all';
  customerId?: string | 'all';
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

export interface PurchaseOrderFilterParams {
  search?: string;
  status?: PurchaseOrderStatus | 'all';
  supplierId?: string | 'all';
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

export interface CustomerFilterParams {
  search?: string;
  status?: CustomerStatus | 'all';
  page: number;
  pageSize: number;
}

export interface SupplierFilterParams {
  search?: string;
  status?: SupplierStatus | 'all';
  page: number;
  pageSize: number;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit_of_measure: string;
  base_sales_price: number;
}

export interface MaterialOption {
  id: string;
  code: string;
  name: string;
  unit_of_measure: string;
  standard_cost: number;
}

export type ProcurementRequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProcurementRequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'converted_to_po'
  | 'rejected';

export interface ProcurementRequest {
  id: string;
  pr_code: string;
  department: string;
  material_name: string;
  material_id?: string;
  quantity: number;
  unit_of_measure: string;
  estimated_cost: number;
  required_date: string;
  priority: ProcurementRequestPriority;
  status: ProcurementRequestStatus;
  requested_by: string;
  reason: string;
  created_at: string;
}

export const INITIAL_REQUESTS: ProcurementRequest[] = [
  {
    id: 'pr-001',
    pr_code: 'PR-2026-0081',
    department: 'Xưởng Tuyển Khoáng Cam Ranh',
    material_name: 'Dầu Diesel 0.05S (DO)',
    material_id: '1ff239c0-45d4-4933-a548-c268e67ef092',
    quantity: 12000,
    unit_of_measure: 'Lít',
    estimated_cost: 264000000,
    required_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] ?? '',
    priority: 'high',
    status: 'pending_approval',
    requested_by: 'Nguyễn Văn Hải (Quản đốc Xưởng)',
    reason: 'Bổ sung dự trữ nhiên liệu chạy máy bơm tuyển nổi và máy phát dự phòng mùa mưa',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'pr-002',
    pr_code: 'PR-2026-0082',
    department: 'Xưởng Nghiền & Sấy Cát',
    material_name: 'Cát nguyên khai (CNK)',
    material_id: '7331dc1f-0cb8-4efe-9fe1-e67b611d77d0',
    quantity: 3500,
    unit_of_measure: 'Tấn',
    estimated_cost: 700000000,
    required_date: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0] ?? '',
    priority: 'urgent',
    status: 'approved',
    requested_by: 'Trần Đình Trọng (Tổ trưởng)',
    reason: 'Đảm bảo khối lượng cát thô cấp cho hợp đồng SO-2026-001 của Viglacera',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'pr-003',
    pr_code: 'PR-2026-0083',
    department: 'Phòng Cơ Điện & Bảo Trì',
    material_name: 'Bi nghiền chịu mòn High-Chrome Ø60mm',
    quantity: 15,
    unit_of_measure: 'Tấn',
    estimated_cost: 450000000,
    required_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] ?? '',
    priority: 'normal',
    status: 'converted_to_po',
    requested_by: 'Lê Hoàng Nam (Kỹ sư Cơ Điện)',
    reason: 'Thay thế bi nghiền định kỳ cho máy nghiền bi số 2 theo kế hoạch PM-Q4',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

export interface DispatchSOItemInput {
  order_item_id: string;
  product_id: string;
  dispatch_quantity: number;
  unit_price: number;
}

export interface DispatchSalesOrderParams {
  sales_order_id: string;
  order_code: string;
  warehouse_id: string;
  dispatch_number?: string;
  dispatch_date?: string;
  carrier_name?: string;
  vehicle_plate?: string;
  driver_info?: string;
  delivery_location?: string;
  weighbridge_ticket_number?: string;
  notes?: string;
  items: DispatchSOItemInput[];
}

export interface SalesProcurementKPIs {
  totalSalesRevenue: number;
  totalPurchaseCost: number;
  grossCommercialMargin: number;
  commercialMarginRate: number;
  salesOrdersCount: number;
  confirmedSalesOrdersCount: number;
  salesDeliveryRate: number;
  purchaseOrdersCount: number;
  receivedPurchaseOrdersCount: number;
  purchaseFulfillmentRate: number;
  pendingSOActionCount: number;
  pendingPOReceiveCount: number;
  pendingPRReviewCount: number;
  activeCustomersCount: number;
  activeSuppliersCount: number;
}

export interface SalesActionAlert {
  id: string;
  type:
    | 'so_urgent_delivery'
    | 'po_overdue_delivery'
    | 'pr_pending_approval'
    | 'customer_credit_warning';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  targetId: string;
  targetCode: string;
  date: string;
  amount?: number;
  partnerName?: string;
}

export interface SalesFunnelStage {
  stage: SalesOrderStatus;
  label: string;
  count: number;
  amount: number;
  color: string;
}

export interface TopPartnerSummary {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
  orderCount: number;
  type: 'customer' | 'supplier';
  percentage: number;
}

export interface CarrierLogisticsSummary {
  carrierName: string;
  activeOrdersCount: number;
  recentVehiclePlate?: string;
  recentDeliveryDate?: string;
}

export interface SalesProcurementDashboardData {
  kpis: SalesProcurementKPIs;
  alerts: SalesActionAlert[];
  funnelStages: SalesFunnelStage[];
  topCustomers: TopPartnerSummary[];
  topSuppliers: TopPartnerSummary[];
  carriers: CarrierLogisticsSummary[];
}
