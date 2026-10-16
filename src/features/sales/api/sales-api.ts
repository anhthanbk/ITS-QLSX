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
} from '../types';
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
