import { supabase } from '@/lib/supabase/client';
import type {
  Customer,
  Supplier,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesMetrics,
  PaginatedResult,
  SalesOrderFilterParams,
  PurchaseOrderFilterParams,
  CustomerFilterParams,
  SupplierFilterParams,
  ProductOption,
  MaterialOption,
  SalesOrderStatus,
  PurchaseOrderStatus,
  DispatchSalesOrderParams,
  SalesProcurementDashboardData,
  SalesProcurementKPIs,
  SalesActionAlert,
  SalesFunnelStage,
  TopPartnerSummary,
  CarrierLogisticsSummary,
  ProcurementRequest,
} from '../types';
import { INITIAL_REQUESTS } from '../types';
import type {
  CustomerFormValues,
  SupplierFormValues,
  SalesOrderFormValues,
  PurchaseOrderFormValues,
} from '../validation/sales-schemas';

// Explicit column lists - never SELECT *
const CUSTOMER_COLUMNS = `
  id,
  code,
  name,
  tax_id,
  email,
  phone,
  address,
  credit_limit,
  status,
  created_at,
  updated_at
`;

const SUPPLIER_COLUMNS = `
  id,
  code,
  name,
  tax_id,
  email,
  phone,
  address,
  status,
  created_at,
  updated_at
`;

const SALES_ORDER_COLUMNS = `
  id,
  order_code,
  customer_id,
  order_date,
  promised_delivery_date,
  carrier_name,
  vehicle_plate,
  driver_info,
  delivery_location,
  currency,
  subtotal_amount,
  tax_amount,
  total_amount,
  status,
  payment_terms,
  notes,
  created_by,
  created_at,
  updated_at,
  customer:customers!sales_orders_customer_id_fkey (
    id,
    code,
    name,
    phone,
    email
  )
`;

const SALES_ORDER_ITEM_COLUMNS = `
  id,
  sales_order_id,
  product_id,
  quantity,
  unit_price,
  line_total,
  fulfilled_quantity,
  created_at,
  product:products!sales_order_items_product_id_fkey (
    id,
    sku,
    name,
    unit_of_measure
  )
`;

const PURCHASE_ORDER_COLUMNS = `
  id,
  po_code,
  supplier_id,
  order_date,
  expected_delivery_date,
  currency,
  subtotal_amount,
  tax_amount,
  total_amount,
  status,
  payment_terms,
  notes,
  created_by,
  created_at,
  updated_at,
  supplier:suppliers!purchase_orders_supplier_id_fkey (
    id,
    code,
    name,
    phone,
    email
  )
`;

const PURCHASE_ORDER_ITEM_COLUMNS = `
  id,
  purchase_order_id,
  material_id,
  quantity,
  unit_price,
  line_total,
  received_quantity,
  created_at,
  material:materials!purchase_order_items_material_id_fkey (
    id,
    code,
    name,
    unit_of_measure
  )
`;

const PRODUCT_OPTION_COLUMNS = `
  id,
  sku,
  name,
  unit_of_measure,
  base_sales_price
`;

const MATERIAL_OPTION_COLUMNS = `
  id,
  code,
  name,
  unit_of_measure,
  standard_cost
`;

// ==========================================
// CUSTOMERS
// ==========================================

export async function fetchCustomers(
  params: CustomerFilterParams,
): Promise<PaginatedResult<Customer>> {
  const { search, status, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('customers')
    .select(CUSTOMER_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,code.ilike.%${s}%,phone.ilike.%${s}%,tax_id.ilike.%${s}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count || 0;
  return {
    items: (data as unknown as Customer[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function createCustomer(values: CustomerFormValues): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      tax_id: values.tax_id ? values.tax_id.trim() : null,
      email: values.email ? values.email.trim() : null,
      phone: values.phone ? values.phone.trim() : null,
      address: values.address ? values.address.trim() : null,
      credit_limit: values.credit_limit,
      status: values.status,
    })
    .select(CUSTOMER_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as Customer;
}

export async function updateCustomer(
  id: string,
  values: CustomerFormValues,
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      tax_id: values.tax_id ? values.tax_id.trim() : null,
      email: values.email ? values.email.trim() : null,
      phone: values.phone ? values.phone.trim() : null,
      address: values.address ? values.address.trim() : null,
      credit_limit: values.credit_limit,
      status: values.status,
    })
    .eq('id', id)
    .select(CUSTOMER_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// SUPPLIERS
// ==========================================

export async function fetchSuppliers(
  params: SupplierFilterParams,
): Promise<PaginatedResult<Supplier>> {
  const { search, status, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('suppliers')
    .select(SUPPLIER_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,code.ilike.%${s}%,phone.ilike.%${s}%,tax_id.ilike.%${s}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count || 0;
  return {
    items: (data as unknown as Supplier[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function createSupplier(values: SupplierFormValues): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      tax_id: values.tax_id ? values.tax_id.trim() : null,
      email: values.email ? values.email.trim() : null,
      phone: values.phone ? values.phone.trim() : null,
      address: values.address ? values.address.trim() : null,
      status: values.status,
    })
    .select(SUPPLIER_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as Supplier;
}

export async function updateSupplier(
  id: string,
  values: SupplierFormValues,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      tax_id: values.tax_id ? values.tax_id.trim() : null,
      email: values.email ? values.email.trim() : null,
      phone: values.phone ? values.phone.trim() : null,
      address: values.address ? values.address.trim() : null,
      status: values.status,
    })
    .eq('id', id)
    .select(SUPPLIER_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// SALES ORDERS
// ==========================================

export async function fetchSalesOrders(
  params: SalesOrderFilterParams,
): Promise<PaginatedResult<SalesOrder>> {
  const { search, status, customerId, fromDate, toDate, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('sales_orders')
    .select(SALES_ORDER_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (customerId && customerId !== 'all') {
    query = query.eq('customer_id', customerId);
  }

  if (fromDate) {
    query = query.gte('order_date', fromDate);
  }

  if (toDate) {
    query = query.lte('order_date', toDate);
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query = query.or(`order_code.ilike.%${s}%,notes.ilike.%${s}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count || 0;
  return {
    items: (data as unknown as SalesOrder[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function fetchSalesOrderDetail(id: string): Promise<SalesOrder | null> {
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(SALES_ORDER_COLUMNS)
    .eq('id', id)
    .single();

  if (orderError) throw orderError;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('sales_order_items')
    .select(SALES_ORDER_ITEM_COLUMNS)
    .eq('sales_order_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  return {
    ...(order as unknown as SalesOrder),
    items: (items as unknown as SalesOrderItem[]) || [],
  };
}

export async function createSalesOrder(
  values: SalesOrderFormValues,
  userId?: string,
): Promise<SalesOrder> {
  const subtotal = values.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const tax = subtotal * (values.tax_rate / 100);
  const total = subtotal + tax;

  // 1. Insert header
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_code: values.order_code.trim().toUpperCase(),
      customer_id: values.customer_id,
      order_date: values.order_date,
      promised_delivery_date: values.promised_delivery_date || null,
      carrier_name: values.carrier_name ? values.carrier_name.trim() : null,
      vehicle_plate: values.vehicle_plate ? values.vehicle_plate.trim().toUpperCase() : null,
      driver_info: values.driver_info ? values.driver_info.trim() : null,
      delivery_location: values.delivery_location ? values.delivery_location.trim() : null,
      currency: values.currency || 'VND',
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      status: values.status,
      payment_terms: values.payment_terms ? values.payment_terms.trim() : null,
      notes: values.notes ? values.notes.trim() : null,
      created_by: userId || null,
    })
    .select(SALES_ORDER_COLUMNS)
    .single();

  if (orderError) throw orderError;
  const createdOrder = order as unknown as SalesOrder;

  // 2. Insert items
  if (values.items.length > 0) {
    const itemsToInsert = values.items.map((item) => ({
      sales_order_id: createdOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      fulfilled_quantity: item.fulfilled_quantity || 0,
    }));

    const { error: itemsError } = await supabase.from('sales_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return createdOrder;
}

export async function updateSalesOrder(
  id: string,
  values: SalesOrderFormValues,
): Promise<SalesOrder> {
  const subtotal = values.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const tax = subtotal * (values.tax_rate / 100);
  const total = subtotal + tax;

  // 1. Update header
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .update({
      order_code: values.order_code.trim().toUpperCase(),
      customer_id: values.customer_id,
      order_date: values.order_date,
      promised_delivery_date: values.promised_delivery_date || null,
      carrier_name: values.carrier_name ? values.carrier_name.trim() : null,
      vehicle_plate: values.vehicle_plate ? values.vehicle_plate.trim().toUpperCase() : null,
      driver_info: values.driver_info ? values.driver_info.trim() : null,
      delivery_location: values.delivery_location ? values.delivery_location.trim() : null,
      currency: values.currency || 'VND',
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      status: values.status,
      payment_terms: values.payment_terms ? values.payment_terms.trim() : null,
      notes: values.notes ? values.notes.trim() : null,
    })
    .eq('id', id)
    .select(SALES_ORDER_COLUMNS)
    .single();

  if (orderError) throw orderError;

  // 2. Replace items: delete old items and insert updated ones
  const { error: deleteError } = await supabase
    .from('sales_order_items')
    .delete()
    .eq('sales_order_id', id);

  if (deleteError) throw deleteError;

  if (values.items.length > 0) {
    const itemsToInsert = values.items.map((item) => ({
      sales_order_id: id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      fulfilled_quantity: item.fulfilled_quantity || 0,
    }));

    const { error: itemsError } = await supabase.from('sales_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return order as unknown as SalesOrder;
}

export async function updateSalesOrderStatus(
  id: string,
  status: SalesOrderStatus,
): Promise<void> {
  const { error } = await supabase.from('sales_orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteSalesOrder(id: string): Promise<void> {
  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// PURCHASE ORDERS
// ==========================================

export async function fetchPurchaseOrders(
  params: PurchaseOrderFilterParams,
): Promise<PaginatedResult<PurchaseOrder>> {
  const { search, status, supplierId, fromDate, toDate, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('purchase_orders')
    .select(PURCHASE_ORDER_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (supplierId && supplierId !== 'all') {
    query = query.eq('supplier_id', supplierId);
  }

  if (fromDate) {
    query = query.gte('order_date', fromDate);
  }

  if (toDate) {
    query = query.lte('order_date', toDate);
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query = query.or(`po_code.ilike.%${s}%,notes.ilike.%${s}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalCount = count || 0;
  return {
    items: (data as unknown as PurchaseOrder[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function fetchPurchaseOrderDetail(id: string): Promise<PurchaseOrder | null> {
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .select(PURCHASE_ORDER_COLUMNS)
    .eq('id', id)
    .single();

  if (orderError) throw orderError;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select(PURCHASE_ORDER_ITEM_COLUMNS)
    .eq('purchase_order_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  return {
    ...(order as unknown as PurchaseOrder),
    items: (items as unknown as PurchaseOrderItem[]) || [],
  };
}

export async function createPurchaseOrder(
  values: PurchaseOrderFormValues,
  userId?: string,
): Promise<PurchaseOrder> {
  const subtotal = values.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const tax = subtotal * (values.tax_rate / 100);
  const total = subtotal + tax;

  // 1. Insert header
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      po_code: values.po_code.trim().toUpperCase(),
      supplier_id: values.supplier_id,
      order_date: values.order_date,
      expected_delivery_date: values.expected_delivery_date || null,
      currency: values.currency || 'VND',
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      status: values.status,
      payment_terms: values.payment_terms ? values.payment_terms.trim() : null,
      notes: values.notes ? values.notes.trim() : null,
      created_by: userId || null,
    })
    .select(PURCHASE_ORDER_COLUMNS)
    .single();

  if (orderError) throw orderError;
  const createdOrder = order as unknown as PurchaseOrder;

  // 2. Insert items
  if (values.items.length > 0) {
    const itemsToInsert = values.items.map((item) => ({
      purchase_order_id: createdOrder.id,
      material_id: item.material_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      received_quantity: item.received_quantity || 0,
    }));

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return createdOrder;
}

export async function updatePurchaseOrder(
  id: string,
  values: PurchaseOrderFormValues,
): Promise<PurchaseOrder> {
  const subtotal = values.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const tax = subtotal * (values.tax_rate / 100);
  const total = subtotal + tax;

  // 1. Update header
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .update({
      po_code: values.po_code.trim().toUpperCase(),
      supplier_id: values.supplier_id,
      order_date: values.order_date,
      expected_delivery_date: values.expected_delivery_date || null,
      currency: values.currency || 'VND',
      subtotal_amount: subtotal,
      tax_amount: tax,
      total_amount: total,
      status: values.status,
      payment_terms: values.payment_terms ? values.payment_terms.trim() : null,
      notes: values.notes ? values.notes.trim() : null,
    })
    .eq('id', id)
    .select(PURCHASE_ORDER_COLUMNS)
    .single();

  if (orderError) throw orderError;

  // 2. Replace items
  const { error: deleteError } = await supabase
    .from('purchase_order_items')
    .delete()
    .eq('purchase_order_id', id);

  if (deleteError) throw deleteError;

  if (values.items.length > 0) {
    const itemsToInsert = values.items.map((item) => ({
      purchase_order_id: id,
      material_id: item.material_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      received_quantity: item.received_quantity || 0,
    }));

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
  }

  return order as unknown as PurchaseOrder;
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): Promise<void> {
  const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw error;
}

export interface ReceivePOItemInput {
  order_item_id: string;
  material_id: string;
  received_quantity: number;
  unit_cost: number;
}

export interface ReceivePurchaseOrderParams {
  purchase_order_id: string;
  po_code: string;
  receipt_mode: 'warehouse_storage' | 'direct_issue';
  warehouse_id: string;
  receipt_number?: string;
  receipt_date?: string;
  production_period_code?: string;
  delivery_note_number?: string;
  target_department?: string;
  target_equipment?: string;
  receiver_name?: string;
  notes?: string;
  items: ReceivePOItemInput[];
}

export async function receivePurchaseOrder(
  params: ReceivePurchaseOrderParams,
  userId?: string,
): Promise<{ success: boolean; message: string }> {
  const validItems = params.items.filter((item) => Number(item.received_quantity) > 0);
  if (validItems.length === 0) {
    throw new Error('Vui lòng nhập số lượng nhận lớn hơn 0 cho ít nhất một mặt hàng.');
  }

  // Base transaction number from user input or auto-generated
  const baseTxNum = params.receipt_number?.trim() || `PNK-PO-${Date.now().toString().slice(-6)}`;
  const txCreatedAt = params.receipt_date
    ? new Date(params.receipt_date).toISOString()
    : new Date().toISOString();

  // Period tag if provided
  const periodTag = params.production_period_code?.trim()
    ? `[${params.production_period_code.trim()}] `
    : '';

  // 1. Process each item: insert transaction(s) and update purchase_order_items.received_quantity
  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i]!;
    const qty = Number(item.received_quantity);
    const txNum = validItems.length === 1 ? baseTxNum : `${baseTxNum}-${i + 1}`;

    const inboundNotes =
      params.receipt_mode === 'direct_issue'
        ? `${periodTag}[Nhập & Bàn giao dùng ngay] Đơn PO: ${params.po_code} - Phiếu GH: ${params.delivery_note_number || 'N/A'} - Bộ phận: ${params.target_department || 'Xưởng'}${params.target_equipment ? ` (${params.target_equipment})` : ''}${params.receiver_name ? ` - Người nhận: ${params.receiver_name}` : ''}${params.notes ? ` - ${params.notes}` : ''}`
        : `${periodTag}[Nhập kho dự trữ] Đơn PO: ${params.po_code} - Phiếu GH: ${params.delivery_note_number || 'N/A'}${params.notes ? ` - ${params.notes}` : ''}`;

    // A. Insert inbound_receipt transaction (automatically adds to inventory_stock_balance via DB trigger)
    const { error: inboundErr } = await supabase.from('inventory_transactions').insert({
      transaction_number: txNum,
      warehouse_id: params.warehouse_id,
      item_type: 'material',
      item_id: item.material_id,
      transaction_type: 'inbound_receipt',
      quantity: qty,
      unit_cost: item.unit_cost,
      reference_doc_type: 'purchase_order',
      reference_doc_id: params.purchase_order_id,
      notes: inboundNotes,
      created_by: userId || null,
      created_at: txCreatedAt,
    });

    if (inboundErr) throw inboundErr;

    // B. If direct issue mode (Kịch bản 2: Bàn giao xuất dùng ngay cho ca/xưởng)
    if (params.receipt_mode === 'direct_issue') {
      const issueTxNum = validItems.length === 1 ? `PXK-${baseTxNum.replace(/^PNK-/, '')}` : `PXK-${baseTxNum.replace(/^PNK-/, '')}-${i + 1}`;
      const issueNotes = `${periodTag}[Xuất dùng trực tiếp] Bàn giao vật tư từ đơn PO: ${params.po_code} cho ${params.target_department || 'Bộ phận đề xuất'}${params.target_equipment ? ` - Thiết bị: ${params.target_equipment}` : ''}${params.receiver_name ? ` - Người nhận: ${params.receiver_name}` : ''}${params.notes ? ` - ${params.notes}` : ''}`;

      const { error: issueErr } = await supabase.from('inventory_transactions').insert({
        transaction_number: issueTxNum,
        warehouse_id: params.warehouse_id,
        item_type: 'material',
        item_id: item.material_id,
        transaction_type: 'production_issue',
        quantity: -Math.abs(qty),
        unit_cost: item.unit_cost,
        reference_doc_type: 'purchase_order',
        reference_doc_id: params.purchase_order_id,
        notes: issueNotes,
        created_by: userId || null,
        created_at: txCreatedAt,
      });

      if (issueErr) throw issueErr;
    }

    // C. Update received_quantity in purchase_order_items
    const { data: currentItem, error: fetchItemErr } = await supabase
      .from('purchase_order_items')
      .select('received_quantity')
      .eq('id', item.order_item_id)
      .single();

    if (fetchItemErr) throw fetchItemErr;

    const newReceivedQty = (Number(currentItem?.received_quantity) || 0) + qty;
    const { error: updateItemErr } = await supabase
      .from('purchase_order_items')
      .update({ received_quantity: newReceivedQty })
      .eq('id', item.order_item_id);

    if (updateItemErr) throw updateItemErr;
  }

  // 2. Check total items in purchase_orders to update PO status
  const { data: allItems, error: allItemsErr } = await supabase
    .from('purchase_order_items')
    .select('quantity, received_quantity')
    .eq('purchase_order_id', params.purchase_order_id);

  if (allItemsErr) throw allItemsErr;

  if (allItems && allItems.length > 0) {
    const isFullyReceived = allItems.every(
      (it) => Number(it.received_quantity) >= Number(it.quantity),
    );
    const newPoStatus: PurchaseOrderStatus = isFullyReceived ? 'received' : 'partially_received';

    const { error: updatePoErr } = await supabase
      .from('purchase_orders')
      .update({ status: newPoStatus })
      .eq('id', params.purchase_order_id);

    if (updatePoErr) throw updatePoErr;
  }

  return {
    success: true,
    message:
      params.receipt_mode === 'direct_issue'
        ? `Đã hoàn tất thủ tục nhập kho và bàn giao xuất dùng ngay cho đơn hàng ${params.po_code}`
        : `Đã hoàn tất nhập kho dự trữ và cộng tồn kho cho đơn hàng ${params.po_code}`,
  };
}

// ==========================================
// METRICS & OPTIONS
// ==========================================

export async function fetchSalesMetrics(): Promise<SalesMetrics> {
  const [
    salesOrdersRes,
    customersRes,
    purchaseOrdersRes,
    suppliersRes,
  ] = await Promise.all([
    supabase.from('sales_orders').select('id, status, total_amount'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('purchase_orders').select('id, status, total_amount'),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }),
  ]);

  const salesOrders = salesOrdersRes.data || [];
  const totalSalesOrders = salesOrders.length;
  const confirmedSalesOrders = salesOrders.filter((o) =>
    ['confirmed', 'in_production', 'ready_to_ship', 'shipped', 'delivered'].includes(o.status),
  ).length;
  const totalSalesAmount = salesOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const purchaseOrders = purchaseOrdersRes.data || [];
  const totalPurchaseOrders = purchaseOrders.length;
  const confirmedPurchaseOrders = purchaseOrders.filter((o) =>
    ['confirmed', 'partially_received', 'received'].includes(o.status),
  ).length;
  const totalPurchaseAmount = purchaseOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0,
  );

  return {
    totalSalesOrders,
    confirmedSalesOrders,
    totalSalesAmount,
    totalCustomers: customersRes.count || 0,
    totalPurchaseOrders,
    confirmedPurchaseOrders,
    totalPurchaseAmount,
    totalSuppliers: suppliersRes.count || 0,
  };
}

/**
 * Fetch Executive Dashboard Analytics for Sales & Procurement
 */
export async function fetchSalesProcurementDashboardData(): Promise<SalesProcurementDashboardData> {
  const [salesOrdersRes, purchaseOrdersRes, customersRes, suppliersRes] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(`
        id,
        order_code,
        customer_id,
        order_date,
        promised_delivery_date,
        carrier_name,
        vehicle_plate,
        total_amount,
        status,
        created_at,
        customer:customers!sales_orders_customer_id_fkey(id, code, name)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchase_orders')
      .select(`
        id,
        po_code,
        supplier_id,
        order_date,
        expected_delivery_date,
        total_amount,
        status,
        created_at,
        supplier:suppliers!purchase_orders_supplier_id_fkey(id, code, name)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, code, name, status, credit_limit')
      .order('name', { ascending: true }),
    supabase
      .from('suppliers')
      .select('id, code, name, status')
      .order('name', { ascending: true }),
  ]);

  if (salesOrdersRes.error) throw salesOrdersRes.error;
  if (purchaseOrdersRes.error) throw purchaseOrdersRes.error;
  if (customersRes.error) throw customersRes.error;
  if (suppliersRes.error) throw suppliersRes.error;

  const salesOrders = (salesOrdersRes.data || []) as unknown as {
    id: string;
    order_code: string;
    customer_id: string;
    order_date: string;
    promised_delivery_date: string | null;
    carrier_name: string | null;
    vehicle_plate: string | null;
    total_amount: number;
    status: SalesOrderStatus;
    created_at: string;
    customer: { id: string; code: string; name: string } | null;
  }[];

  const purchaseOrders = (purchaseOrdersRes.data || []) as unknown as {
    id: string;
    po_code: string;
    supplier_id: string;
    order_date: string;
    expected_delivery_date: string | null;
    total_amount: number;
    status: PurchaseOrderStatus;
    created_at: string;
    supplier: { id: string; code: string; name: string } | null;
  }[];

  const customers = customersRes.data || [];
  const suppliers = suppliersRes.data || [];

  // 1. Calculate Financial & Volume KPIs
  // Only include valid commercial commitments (exclude draft quotes and cancelled orders)
  const totalSalesRevenue = salesOrders
    .filter((o) =>
      ['confirmed', 'in_production', 'ready_to_ship', 'shipped', 'delivered'].includes(o.status),
    )
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const totalPurchaseCost = purchaseOrders
    .filter((o) =>
      ['sent', 'confirmed', 'partially_received', 'received'].includes(o.status),
    )
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const grossCommercialMargin = totalSalesRevenue - totalPurchaseCost;
  const commercialMarginRate =
    totalSalesRevenue > 0
      ? Math.round((grossCommercialMargin / totalSalesRevenue) * 1000) / 10
      : 0;

  const salesOrdersCount = salesOrders.length;
  const confirmedSalesOrdersCount = salesOrders.filter((o) =>
    ['confirmed', 'in_production', 'ready_to_ship', 'shipped', 'delivered'].includes(o.status),
  ).length;

  const now = new Date();
  const overdueSOCount = salesOrders.filter(
    (o) =>
      ['confirmed', 'in_production', 'ready_to_ship', 'shipped'].includes(o.status) &&
      o.promised_delivery_date &&
      new Date(o.promised_delivery_date) < now,
  ).length;

  const salesDeliveryRate =
    confirmedSalesOrdersCount > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((confirmedSalesOrdersCount - overdueSOCount) / confirmedSalesOrdersCount) * 100,
            ),
          ),
        )
      : 100;

  const purchaseOrdersCount = purchaseOrders.length;
  const receivedPurchaseOrdersCount = purchaseOrders.filter((o) =>
    ['partially_received', 'received'].includes(o.status),
  ).length;
  const confirmedPOCount = purchaseOrders.filter((o) =>
    ['confirmed', 'sent', 'partially_received', 'received'].includes(o.status),
  ).length;
  const purchaseFulfillmentRate =
    confirmedPOCount > 0
      ? Math.round((receivedPurchaseOrdersCount / confirmedPOCount) * 100)
      : 100;

  const pendingSOActionCount = salesOrders.filter((o) =>
    ['confirmed', 'in_production', 'ready_to_ship'].includes(o.status),
  ).length;
  const pendingPOReceiveCount = purchaseOrders.filter((o) =>
    ['sent', 'confirmed', 'partially_received'].includes(o.status),
  ).length;

  // Retrieve Procurement Requests from localStorage if available, fallback to INITIAL_REQUESTS
  let procurementRequests: ProcurementRequest[] = INITIAL_REQUESTS;
  try {
    const savedPR = localStorage.getItem('its_procurement_requests');
    if (savedPR) procurementRequests = JSON.parse(savedPR);
  } catch {
    // ignore
  }
  const pendingPRReviewCount = procurementRequests.filter((pr) =>
    ['draft', 'pending_approval'].includes(pr.status),
  ).length;

  const kpis: SalesProcurementKPIs = {
    totalSalesRevenue,
    totalPurchaseCost,
    grossCommercialMargin,
    commercialMarginRate,
    salesOrdersCount,
    confirmedSalesOrdersCount,
    salesDeliveryRate,
    purchaseOrdersCount,
    receivedPurchaseOrdersCount,
    purchaseFulfillmentRate,
    pendingSOActionCount,
    pendingPOReceiveCount,
    pendingPRReviewCount,
    activeCustomersCount: customers.filter((c) => c.status === 'active').length,
    activeSuppliersCount: suppliers.filter((s) => s.status === 'active').length,
  };

  // 2. Action Alerts (Urgent items requiring management attention)
  const alerts: SalesActionAlert[] = [];
  const twoDaysLater = new Date(now.getTime() + 48 * 3600 * 1000);

  // SO urgent delivery alerts
  for (const so of salesOrders) {
    if (['confirmed', 'in_production', 'ready_to_ship'].includes(so.status)) {
      if (so.promised_delivery_date) {
        const promiseDate = new Date(so.promised_delivery_date);
        const isOverdue = promiseDate < now;
        const isUrgent = promiseDate <= twoDaysLater;

        if (isOverdue) {
          alerts.push({
            id: `so-overdue-${so.id}`,
            type: 'so_urgent_delivery',
            title: `Đơn bán ${so.order_code} đã quá hạn giao`,
            description: `Khách hàng ${so.customer?.name || 'Khách hàng'} - Hẹn ngày ${new Date(so.promised_delivery_date).toLocaleDateString('vi-VN')}. Chưa hoàn tất xuất kho.`,
            severity: 'critical',
            targetId: so.id,
            targetCode: so.order_code,
            date: so.promised_delivery_date,
            amount: so.total_amount,
            partnerName: so.customer?.name,
          });
        } else if (isUrgent) {
          alerts.push({
            id: `so-urgent-${so.id}`,
            type: 'so_urgent_delivery',
            title: `Đơn bán ${so.order_code} sắp đến hạn giao`,
            description: `Hẹn giao ${new Date(so.promised_delivery_date).toLocaleDateString('vi-VN')} cho ${so.customer?.name || 'Khách hàng'}. Xe: ${so.vehicle_plate || 'Chưa gán xe'}.`,
            severity: 'warning',
            targetId: so.id,
            targetCode: so.order_code,
            date: so.promised_delivery_date,
            amount: so.total_amount,
            partnerName: so.customer?.name,
          });
        }
      }
    }
  }

  // PO overdue delivery alerts
  for (const po of purchaseOrders) {
    if (['sent', 'confirmed', 'partially_received'].includes(po.status)) {
      if (po.expected_delivery_date) {
        const expDate = new Date(po.expected_delivery_date);
        if (expDate < now) {
          alerts.push({
            id: `po-overdue-${po.id}`,
            type: 'po_overdue_delivery',
            title: `Đơn mua ${po.po_code} trễ hạn giao hàng`,
            description: `Nhà cung ứng ${po.supplier?.name || 'NCC'} trễ hạn từ ngày ${new Date(po.expected_delivery_date).toLocaleDateString('vi-VN')}.`,
            severity: 'warning',
            targetId: po.id,
            targetCode: po.po_code,
            date: po.expected_delivery_date,
            amount: po.total_amount,
            partnerName: po.supplier?.name,
          });
        }
      }
    }
  }

  // PR pending approval alerts
  for (const pr of procurementRequests) {
    if (pr.status === 'pending_approval' || (pr.status === 'draft' && pr.priority === 'urgent')) {
      alerts.push({
        id: `pr-pending-${pr.id}`,
        type: 'pr_pending_approval',
        title: `Đề xuất ${pr.pr_code} chờ phê duyệt`,
        description: `${pr.department} đề xuất mua ${pr.material_name} (${pr.quantity} ${pr.unit_of_measure}) - Dự kiến ${Number(pr.estimated_cost).toLocaleString('vi-VN')} ₫.`,
        severity: pr.priority === 'urgent' ? 'critical' : 'info',
        targetId: pr.id,
        targetCode: pr.pr_code,
        date: pr.required_date,
        amount: pr.estimated_cost,
        partnerName: pr.department,
      });
    }
  }

  // 3. Sales Funnel Stages
  const stageDefinitions: { stage: SalesOrderStatus; label: string; color: string }[] = [
    { stage: 'draft', label: 'Bản thảo / Báo giá', color: 'bg-slate-500' },
    { stage: 'confirmed', label: 'Đã ký hợp đồng', color: 'bg-blue-500' },
    { stage: 'in_production', label: 'Đang sản xuất', color: 'bg-purple-500' },
    { stage: 'ready_to_ship', label: 'Sẵn sàng giao xe', color: 'bg-amber-500' },
    { stage: 'shipped', label: 'Đang vận chuyển', color: 'bg-cyan-500' },
    { stage: 'delivered', label: 'Đã giao thành công', color: 'bg-emerald-500' },
  ];

  const funnelStages: SalesFunnelStage[] = stageDefinitions.map((def) => {
    const matching = salesOrders.filter((o) => o.status === def.stage);
    const amount = matching.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      stage: def.stage,
      label: def.label,
      count: matching.length,
      amount,
      color: def.color,
    };
  });

  // 4. Top 5 Customers by confirmed revenue
  const customerRevenueMap = new Map<
    string,
    { id: string; code: string; name: string; amount: number; count: number }
  >();
  for (const so of salesOrders) {
    if (so.status !== 'cancelled' && so.customer) {
      const entry = customerRevenueMap.get(so.customer_id) || {
        id: so.customer.id,
        code: so.customer.code,
        name: so.customer.name,
        amount: 0,
        count: 0,
      };
      entry.amount += Number(so.total_amount || 0);
      entry.count += 1;
      customerRevenueMap.set(so.customer_id, entry);
    }
  }
  const topCustomers: TopPartnerSummary[] = Array.from(customerRevenueMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      totalAmount: c.amount,
      orderCount: c.count,
      type: 'customer',
      percentage: totalSalesRevenue > 0 ? Math.round((c.amount / totalSalesRevenue) * 1000) / 10 : 0,
    }));

  // 5. Top 5 Suppliers by purchase spend
  const supplierSpendMap = new Map<
    string,
    { id: string; code: string; name: string; amount: number; count: number }
  >();
  for (const po of purchaseOrders) {
    if (po.status !== 'cancelled' && po.supplier) {
      const entry = supplierSpendMap.get(po.supplier_id) || {
        id: po.supplier.id,
        code: po.supplier.code,
        name: po.supplier.name,
        amount: 0,
        count: 0,
      };
      entry.amount += Number(po.total_amount || 0);
      entry.count += 1;
      supplierSpendMap.set(po.supplier_id, entry);
    }
  }
  const topSuppliers: TopPartnerSummary[] = Array.from(supplierSpendMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((s) => ({
      ...s,
      totalAmount: s.amount,
      orderCount: s.count,
      type: 'supplier',
      percentage: totalPurchaseCost > 0 ? Math.round((s.amount / totalPurchaseCost) * 1000) / 10 : 0,
    }));

  // 6. Active Carriers Summary
  const carrierMap = new Map<
    string,
    {
      carrierName: string;
      activeOrdersCount: number;
      recentVehiclePlate?: string;
      recentDeliveryDate?: string;
    }
  >();
  for (const so of salesOrders) {
    if (
      so.carrier_name &&
      ['confirmed', 'in_production', 'ready_to_ship', 'shipped'].includes(so.status)
    ) {
      const c = carrierMap.get(so.carrier_name) || {
        carrierName: so.carrier_name,
        activeOrdersCount: 0,
        recentVehiclePlate: so.vehicle_plate || undefined,
        recentDeliveryDate: so.promised_delivery_date || undefined,
      };
      c.activeOrdersCount += 1;
      if (so.vehicle_plate) c.recentVehiclePlate = so.vehicle_plate;
      if (so.promised_delivery_date) c.recentDeliveryDate = so.promised_delivery_date;
      carrierMap.set(so.carrier_name, c);
    }
  }
  const carriers: CarrierLogisticsSummary[] = Array.from(carrierMap.values()).sort(
    (a, b) => b.activeOrdersCount - a.activeOrdersCount,
  );

  return {
    kpis,
    alerts: alerts.slice(0, 10),
    funnelStages,
    topCustomers,
    topSuppliers,
    carriers,
  };
}

export async function fetchProductOptions(): Promise<ProductOption[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_OPTION_COLUMNS)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as unknown as ProductOption[]) || [];
}

export async function fetchMaterialOptions(): Promise<MaterialOption[]> {
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_OPTION_COLUMNS)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as unknown as MaterialOption[]) || [];
}

/**
 * Dispatch goods for a Sales Order (Sales Dispatch / Xuất kho thành phẩm/phụ phẩm bán hàng)
 * 1. Creates inventory_transactions of type 'sales_dispatch' with negative quantity
 * 2. Deducts stock from inventory_stock_balance via existing DB trigger
 * 3. Updates fulfilled_quantity in sales_order_items
 * 4. Updates sales_orders status (shipped / delivered or ready_to_ship) & logistics info
 */
export async function dispatchSalesOrder(
  params: DispatchSalesOrderParams,
  userId?: string,
): Promise<{ success: boolean; message: string }> {
  const validItems = params.items.filter((item) => Number(item.dispatch_quantity) > 0);
  if (validItems.length === 0) {
    throw new Error('Vui lòng nhập số lượng xuất bán lớn hơn 0 cho ít nhất một thành phẩm.');
  }

  const baseTxNum = params.dispatch_number?.trim() || `PXK-SO-${Date.now().toString().slice(-6)}`;
  const txCreatedAt = params.dispatch_date
    ? new Date(params.dispatch_date).toISOString()
    : new Date().toISOString();

  // 1. Process each item: insert inventory transaction & increment fulfilled_quantity
  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i]!;
    const qty = Number(item.dispatch_quantity);
    const txNum = validItems.length === 1 ? baseTxNum : `${baseTxNum}-${i + 1}`;

    const dispatchNotes = `[Xuất kho giao hàng SO] Đơn SO: ${params.order_code}${params.carrier_name ? ` - ĐVVT: ${params.carrier_name}` : ''}${params.vehicle_plate ? ` (Xe: ${params.vehicle_plate})` : ''}${params.driver_info ? ` - TX: ${params.driver_info}` : ''}${params.weighbridge_ticket_number ? ` - Phiếu cân: ${params.weighbridge_ticket_number}` : ''}${params.delivery_location ? ` - Giao tại: ${params.delivery_location}` : ''}${params.notes ? ` - ${params.notes}` : ''}`;

    // A. Insert sales_dispatch transaction (triggers negative stock balance deduction)
    const { error: txErr } = await supabase.from('inventory_transactions').insert({
      transaction_number: txNum,
      warehouse_id: params.warehouse_id,
      item_type: 'product',
      item_id: item.product_id,
      transaction_type: 'sales_dispatch',
      quantity: -Math.abs(qty),
      unit_cost: item.unit_price,
      reference_doc_type: 'sales_order',
      reference_doc_id: params.sales_order_id,
      notes: dispatchNotes,
      created_by: userId || null,
      created_at: txCreatedAt,
    });

    if (txErr) throw txErr;

    // B. Update fulfilled_quantity in sales_order_items
    const { data: currentItem, error: fetchItemErr } = await supabase
      .from('sales_order_items')
      .select('fulfilled_quantity')
      .eq('id', item.order_item_id)
      .single();

    if (fetchItemErr) throw fetchItemErr;

    const newFulfilledQty = (Number(currentItem?.fulfilled_quantity) || 0) + qty;
    const { error: updateItemErr } = await supabase
      .from('sales_order_items')
      .update({ fulfilled_quantity: newFulfilledQty })
      .eq('id', item.order_item_id);

    if (updateItemErr) throw updateItemErr;
  }

  // 2. Check total items in sales_order_items to determine new SO status
  const { data: allItems, error: allItemsErr } = await supabase
    .from('sales_order_items')
    .select('quantity, fulfilled_quantity')
    .eq('sales_order_id', params.sales_order_id);

  if (allItemsErr) throw allItemsErr;

  let newSoStatus: SalesOrderStatus = 'shipped';
  if (allItems && allItems.length > 0) {
    const isFullyFulfilled = allItems.every(
      (it) => Number(it.fulfilled_quantity) >= Number(it.quantity),
    );
    newSoStatus = isFullyFulfilled ? 'delivered' : 'shipped';
  }

  // 3. Update sales order status and logistics info if provided
  const updatePayload: {
    status: SalesOrderStatus;
    carrier_name?: string;
    vehicle_plate?: string;
    driver_info?: string;
    delivery_location?: string;
    updated_at: string;
  } = {
    status: newSoStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.carrier_name?.trim()) updatePayload.carrier_name = params.carrier_name.trim();
  if (params.vehicle_plate?.trim()) updatePayload.vehicle_plate = params.vehicle_plate.trim().toUpperCase();
  if (params.driver_info?.trim()) updatePayload.driver_info = params.driver_info.trim();
  if (params.delivery_location?.trim()) updatePayload.delivery_location = params.delivery_location.trim();

  const { error: updateSoErr } = await supabase
    .from('sales_orders')
    .update(updatePayload)
    .eq('id', params.sales_order_id);

  if (updateSoErr) throw updateSoErr;

  return {
    success: true,
    message: `Đã xuất kho thành công ${validItems.length} mặt hàng theo đơn ${params.order_code}. Phiếu xuất: ${baseTxNum}.`,
  };
}
