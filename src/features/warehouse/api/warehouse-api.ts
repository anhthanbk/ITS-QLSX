import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type {
  Warehouse,
  InventoryStockBalance,
  InventoryTransaction,
  ItemAggregatedStockBalance,
  WarehouseTransferValues,
  PaginatedResult,
  WarehouseFilterParams,
  StockBalanceFilterParams,
  TransactionFilterParams,
  WarehouseMetrics,
  ItemType,
  WarehouseItemOption,
  MaterialCatalogItem,
  MaterialCatalogFilterParams,
  ProductCatalogItem,
  ProductCatalogFilterParams,
} from '@/features/warehouse/types';
import type { MaterialFormValues, ProductFormValues } from '../validation/warehouse-schemas';

// Explicit column lists - never SELECT *
const WAREHOUSE_SELECT_COLUMNS = `
  id,
  code,
  name,
  warehouse_type,
  location,
  manager_employee_id,
  status,
  created_at,
  updated_at,
  employees:manager_employee_id (
    id,
    employee_code,
    first_name,
    last_name
  )
`;

const STOCK_BALANCE_SELECT_COLUMNS = `
  warehouse_id,
  item_type,
  item_id,
  current_quantity,
  reserved_quantity,
  last_transaction_at,
  warehouses:warehouse_id (
    code,
    name
  )
`;

const TRANSACTION_SELECT_COLUMNS = `
  id,
  transaction_number,
  warehouse_id,
  item_type,
  item_id,
  transaction_type,
  quantity,
  unit_cost,
  reference_doc_type,
  reference_doc_id,
  notes,
  created_by,
  created_at,
  warehouses:warehouse_id (
    code,
    name
  ),
  profiles:created_by (
    id,
    full_name
  )
`;

interface WarehouseQueryResult {
  id: string;
  code: string;
  name: string;
  warehouse_type: Warehouse['warehouse_type'];
  location: string | null;
  manager_employee_id: string | null;
  status: Warehouse['status'];
  created_at: string;
  updated_at: string;
  employees: {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
  } | null;
}

/**
 * Fetch paginated list of warehouses with search and filtering
 */
export async function fetchWarehouses(params: WarehouseFilterParams): Promise<PaginatedResult<Warehouse>> {
  const { search = '', warehouseType, status, page, pageSize } = params;
  let query = supabase.from('warehouses').select(WAREHOUSE_SELECT_COLUMNS, { count: 'exact' });

  if (search.trim()) {
    const term = search.trim();
    query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%,location.ilike.%${term}%`);
  }
  if (warehouseType && warehouseType !== 'all') {
    query = query.eq('warehouse_type', warehouseType);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  if (error) throw new Error(error.message);

  const formatted: Warehouse[] = ((data as unknown as WarehouseQueryResult[]) || []).map((row) => {
    const emp = row.employees;
    const managerName = emp ? `${emp.last_name || ''} ${emp.first_name || ''}`.trim() : null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      warehouse_type: row.warehouse_type,
      location: row.location,
      manager_employee_id: row.manager_employee_id,
      manager_name: managerName || null,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { data: formatted, totalCount, page, pageSize, totalPages };
}

/**
 * Fetch a single warehouse by ID
 */
export async function fetchWarehouseById(id: string): Promise<Warehouse> {
  const { data, error } = await supabase
    .from('warehouses')
    .select(WAREHOUSE_SELECT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const row = data as unknown as WarehouseQueryResult;
  const emp = row.employees;
  const managerName = emp ? `${emp.last_name || ''} ${emp.first_name || ''}`.trim() : null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    warehouse_type: row.warehouse_type,
    location: row.location,
    manager_employee_id: row.manager_employee_id,
    manager_name: managerName || null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(values: {
  code: string;
  name: string;
  warehouse_type: Warehouse['warehouse_type'];
  location?: string | null;
  manager_employee_id?: string | null;
  status: Warehouse['status'];
}): Promise<Warehouse> {
  const payload: Database['public']['Tables']['warehouses']['Insert'] = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    warehouse_type: values.warehouse_type,
    location: values.location?.trim() || null,
    manager_employee_id: values.manager_employee_id || null,
    status: values.status,
  };

  const { data, error } = await supabase
    .from('warehouses')
    .insert([payload])
    .select(WAREHOUSE_SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return fetchWarehouseById(data.id);
}

/**
 * Update an existing warehouse
 */
export async function updateWarehouse(
  id: string,
  values: Partial<{
    code: string;
    name: string;
    warehouse_type: Warehouse['warehouse_type'];
    location?: string | null;
    manager_employee_id?: string | null;
    status: Warehouse['status'];
  }>
): Promise<Warehouse> {
  const payload: Database['public']['Tables']['warehouses']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (values.code !== undefined) payload.code = values.code.trim().toUpperCase();
  if (values.name !== undefined) payload.name = values.name.trim();
  if (values.warehouse_type !== undefined) payload.warehouse_type = values.warehouse_type;
  if (values.location !== undefined) payload.location = values.location?.trim() || null;
  if (values.manager_employee_id !== undefined) payload.manager_employee_id = values.manager_employee_id || null;
  if (values.status !== undefined) payload.status = values.status;

  const { error } = await supabase.from('warehouses').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  return fetchWarehouseById(id);
}

/**
 * Delete a warehouse (verifies dependencies first)
 */
export async function deleteWarehouse(id: string): Promise<void> {
  // Check if warehouse has transactions
  const { count: txCount, error: txErr } = await supabase
    .from('inventory_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('warehouse_id', id);

  if (txErr) throw new Error(txErr.message);
  if (txCount && txCount > 0) {
    throw new Error('Không thể xóa kho đã có lịch sử giao dịch nhập / xuất. Vui lòng chuyển trạng thái sang "Tạm dừng".');
  }

  // Check if warehouse has non-zero stock
  const { data: balances, error: balErr } = await supabase
    .from('inventory_stock_balance')
    .select('current_quantity')
    .eq('warehouse_id', id)
    .gt('current_quantity', 0);

  if (balErr) throw new Error(balErr.message);
  if (balances && balances.length > 0) {
    throw new Error('Kho vẫn còn hàng tồn kho. Vui lòng xuất hết hàng trước khi xóa.');
  }

  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Helper to get item maps (materials and products) with category metadata
 */
async function getItemMetadataMap() {
  const [materialsRes, productsRes] = await Promise.all([
    supabase.from('materials').select('id, code, name, category, unit_of_measure, standard_cost'),
    supabase.from('products').select('id, sku, name, product_type, unit_of_measure, base_sales_price'),
  ]);

  const map = new Map<
    string,
    {
      code: string;
      name: string;
      category: string;
      category_label: string;
      unit: string;
      cost: number;
    }
  >();

  const CATEGORY_LABELS: Record<string, string> = {
    raw_material: 'Nguyên vật liệu chính',
    chemical: 'Hóa chất công nghiệp',
    spare_part: 'Phụ tùng & Linh kiện cơ điện',
    packaging: 'Vật tư bao bì & Đóng gói',
    consumable: 'Vật tư tiêu hao / BHLĐ',
    fuel_energy: 'Nhiên liệu & Năng lượng',
    other: 'Vật tư phụ trợ khác',
    finished_good: 'Thành phẩm sản xuất',
    semi_finished: 'Bán thành phẩm',
    by_product: 'Phụ phẩm thu hồi',
    byproduct: 'Phụ phẩm thu hồi',
  };

  (materialsRes.data || []).forEach((m) => {
    const cat = m.category || 'raw_material';
    map.set(m.id, {
      code: m.code,
      name: m.name,
      category: cat,
      category_label: CATEGORY_LABELS[cat] || 'Vật tư',
      unit: m.unit_of_measure,
      cost: Number(m.standard_cost) || 0,
    });
  });

  (productsRes.data || []).forEach((p) => {
    const isByProduct = p.product_type === 'by_product' || p.product_type === 'byproduct';
    const cat = p.product_type || (isByProduct ? 'by_product' : 'finished_good');
    map.set(p.id, {
      code: p.sku,
      name: p.name,
      category: cat,
      category_label: CATEGORY_LABELS[cat] || (isByProduct ? 'Phụ phẩm thu hồi' : 'Sản phẩm'),
      unit: p.unit_of_measure,
      cost: Number(p.base_sales_price) || 0,
    });
  });

  return map;
}

interface StockBalanceQueryResult {
  warehouse_id: string;
  item_type: ItemType;
  item_id: string;
  current_quantity: number | string;
  reserved_quantity: number | string;
  last_transaction_at: string;
  warehouses: {
    code: string;
    name: string;
  } | null;
}

interface TransactionQueryResult {
  id: string;
  transaction_number: string;
  warehouse_id: string;
  item_type: ItemType;
  item_id: string;
  transaction_type: InventoryTransaction['transaction_type'];
  quantity: number | string;
  unit_cost: number | string;
  reference_doc_type: string | null;
  reference_doc_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  warehouses: {
    code: string;
    name: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

/**
 * Fetch paginated inventory stock balance
 */
export async function fetchStockBalances(params: StockBalanceFilterParams): Promise<PaginatedResult<InventoryStockBalance>> {
  const { search = '', warehouseId, itemType, page, pageSize } = params;
  let query = supabase.from('inventory_stock_balance').select(STOCK_BALANCE_SELECT_COLUMNS, { count: 'exact' });

  if (warehouseId && warehouseId !== 'all') {
    query = query.eq('warehouse_id', warehouseId);
  }

  const isBroadType = itemType === 'material' || itemType === 'product' || itemType === 'byproduct';
  if (itemType && itemType !== 'all' && isBroadType) {
    query = query.eq('item_type', itemType);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.order('last_transaction_at', { ascending: false }).range(from, to);

  if (error) throw new Error(error.message);

  const itemMap = await getItemMetadataMap();

  let formatted: InventoryStockBalance[] = ((data as unknown as StockBalanceQueryResult[]) || []).map((row) => {
    const itemMeta = itemMap.get(row.item_id);
    const curr = Number(row.current_quantity) || 0;
    const reserved = Number(row.reserved_quantity) || 0;
    return {
      warehouse_id: row.warehouse_id,
      warehouse_code: row.warehouses?.code,
      warehouse_name: row.warehouses?.name,
      item_type: row.item_type,
      category: itemMeta?.category,
      category_label: itemMeta?.category_label,
      item_id: row.item_id,
      item_code: itemMeta?.code || '---',
      item_name: itemMeta?.name || 'Mặt hàng chưa xác định',
      unit_of_measure: itemMeta?.unit || '',
      current_quantity: curr,
      reserved_quantity: reserved,
      available_quantity: Math.max(0, curr - reserved),
      last_transaction_at: row.last_transaction_at,
    };
  });

  // Granular category filter if not broad DB type
  if (itemType && itemType !== 'all' && !isBroadType) {
    formatted = formatted.filter((b) => {
      if (itemType === 'by_product' || itemType === 'byproduct') {
        return b.category === 'by_product' || b.category === 'byproduct' || b.item_type === 'byproduct';
      }
      return b.category === itemType;
    });
  }

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    formatted = formatted.filter(
      (b) =>
        b.item_code?.toLowerCase().includes(term) ||
        b.item_name?.toLowerCase().includes(term) ||
        b.warehouse_name?.toLowerCase().includes(term) ||
        b.category_label?.toLowerCase().includes(term)
    );
  }

  // Calculate actual total_inbound and total_outbound for items on current page
  if (formatted.length > 0) {
    const itemIds = Array.from(new Set(formatted.map((f) => f.item_id)));
    const warehouseIds = Array.from(new Set(formatted.map((f) => f.warehouse_id)));
    const { data: txSums } = await supabase
      .from('inventory_transactions')
      .select('warehouse_id, item_type, item_id, quantity')
      .in('warehouse_id', warehouseIds)
      .in('item_id', itemIds);

    if (txSums) {
      // Map theo (warehouse_id, item_type, item_id) để khớp chính xác với từng dòng balance
      const sumMap = new Map<string, { inbound: number; outbound: number }>();
      for (const tx of txSums) {
        const key = `${tx.warehouse_id}-${tx.item_type}-${tx.item_id}`;
        const entry = sumMap.get(key) || { inbound: 0, outbound: 0 };
        const q = Number(tx.quantity) || 0;
        if (q > 0) entry.inbound += q;
        else if (q < 0) entry.outbound += Math.abs(q);
        sumMap.set(key, entry);
      }
      formatted = formatted.map((b) => {
        const key = `${b.warehouse_id}-${b.item_type}-${b.item_id}`;
        const s = sumMap.get(key);
        // Nếu có giao dịch thì lấy chuẩn xác từ giao dịch, nếu chưa có giao dịch thì fallback bảo toàn toán học
        const inQty = s ? s.inbound : (b.current_quantity > 0 ? b.current_quantity : 0);
        const outQty = s ? s.outbound : (b.current_quantity < 0 ? Math.abs(b.current_quantity) : 0);
        return {
          ...b,
          total_inbound: inQty,
          total_outbound: outQty,
        };
      });
    }
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { data: formatted, totalCount, page, pageSize, totalPages };
}

/**
 * Fetch company-wide aggregated stock balance by material/item (Total Inbound - Total Outbound)
 */
export async function fetchItemAggregatedStockBalances(): Promise<ItemAggregatedStockBalance[]> {
  const { data: balances, error } = await supabase
    .from('inventory_stock_balance')
    .select(`
      warehouse_id,
      item_type,
      item_id,
      current_quantity,
      reserved_quantity,
      last_transaction_at,
      warehouses:warehouses(id, code, name)
    `);

  if (error) throw new Error(error.message);

  const itemMap = await getItemMetadataMap();

  // Query transaction quantities to get accurate in/out totals per item & warehouse
  const { data: txList } = await supabase
    .from('inventory_transactions')
    .select('warehouse_id, item_type, item_id, quantity');

  // Map transaction totals theo warehouse_id + item_id (cộng tất cả loại giao dịch của item trong kho đó)
  const txSumMap = new Map<string, { inbound: number; outbound: number }>();
  if (txList) {
    for (const tx of txList) {
      const key = `${tx.warehouse_id}-${tx.item_id}`;
      const entry = txSumMap.get(key) || { inbound: 0, outbound: 0 };
      const q = Number(tx.quantity) || 0;
      if (q > 0) entry.inbound += q;
      else if (q < 0) entry.outbound += Math.abs(q);
      txSumMap.set(key, entry);
    }
  }

  // Gom nhóm theo từng item_id, bên trong có danh sách các kho duy nhất
  const itemGroupMap = new Map<string, {
    item_id: string;
    item_type: 'material' | 'product' | 'byproduct';
    item_code: string;
    item_name: string;
    category?: string;
    category_label?: string;
    unit_of_measure: string;
    warehousesMap: Map<string, {
      warehouse_id: string;
      warehouse_code: string;
      warehouse_name: string;
      current_quantity: number;
      reserved_quantity: number;
      available_quantity: number;
      total_inbound: number;
      total_outbound: number;
      last_transaction_at?: string;
    }>;
  }>();

  for (const b of (balances as unknown as StockBalanceQueryResult[]) || []) {
    const itemMeta = itemMap.get(b.item_id);
    const curr = Number(b.current_quantity) || 0;
    const reserved = Number(b.reserved_quantity) || 0;
    const avail = Math.max(0, curr - reserved);
    const whId = b.warehouse_id;

    let itemEntry = itemGroupMap.get(b.item_id);
    if (!itemEntry) {
      itemEntry = {
        item_id: b.item_id,
        item_type: b.item_type,
        item_code: itemMeta?.code || '---',
        item_name: itemMeta?.name || 'Mặt hàng chưa xác định',
        category: itemMeta?.category,
        category_label: itemMeta?.category_label,
        unit_of_measure: itemMeta?.unit || '',
        warehousesMap: new Map(),
      };
      itemGroupMap.set(b.item_id, itemEntry);
    }

    // Merge vào kho tương ứng của item đó để tránh trùng lặp kho
    const existingWh = itemEntry.warehousesMap.get(whId);
    if (!existingWh) {
      const key = `${whId}-${b.item_id}`;
      const txSum = txSumMap.get(key) || {
        inbound: curr > 0 ? curr : 0,
        outbound: curr < 0 ? Math.abs(curr) : 0,
      };

      itemEntry.warehousesMap.set(whId, {
        warehouse_id: whId,
        warehouse_code: b.warehouses?.code || '',
        warehouse_name: b.warehouses?.name || '',
        current_quantity: curr,
        reserved_quantity: reserved,
        available_quantity: avail,
        total_inbound: txSum.inbound,
        total_outbound: txSum.outbound,
        last_transaction_at: b.last_transaction_at,
      });
    } else {
      // Nếu cùng kho mà có nhiều dòng (ví dụ điều chỉnh phân loại), cộng dồn số dư
      existingWh.current_quantity += curr;
      existingWh.reserved_quantity += reserved;
      existingWh.available_quantity = Math.max(0, existingWh.current_quantity - existingWh.reserved_quantity);
      if (b.last_transaction_at && (!existingWh.last_transaction_at || b.last_transaction_at > existingWh.last_transaction_at)) {
        existingWh.last_transaction_at = b.last_transaction_at;
      }
    }
  }

  // Chuyển Map thành mảng ItemAggregatedStockBalance với tổng cộng chuẩn xác
  const result: ItemAggregatedStockBalance[] = [];
  for (const item of itemGroupMap.values()) {
    const whList = Array.from(item.warehousesMap.values());
    const totalInbound = whList.reduce((sum, w) => sum + w.total_inbound, 0);
    const totalOutbound = whList.reduce((sum, w) => sum + w.total_outbound, 0);
    const totalCurr = whList.reduce((sum, w) => sum + w.current_quantity, 0);
    const totalReserved = whList.reduce((sum, w) => sum + w.reserved_quantity, 0);
    const totalAvail = whList.reduce((sum, w) => sum + w.available_quantity, 0);

    result.push({
      item_id: item.item_id,
      item_type: item.item_type,
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      category_label: item.category_label,
      unit_of_measure: item.unit_of_measure,
      total_inbound: totalInbound,
      total_outbound: totalOutbound,
      total_current_quantity: totalCurr,
      total_reserved_quantity: totalReserved,
      total_available_quantity: totalAvail,
      warehouse_count: whList.length,
      warehouses: whList,
    });
  }

  return result.sort((a, b) => a.item_code.localeCompare(b.item_code));
}

/**
 * Fetch paginated inventory transactions
 */
export async function fetchInventoryTransactions(params: TransactionFilterParams): Promise<PaginatedResult<InventoryTransaction>> {
  const { search = '', warehouseId, transactionType, itemType, startDate, endDate, page, pageSize } = params;
  let query = supabase.from('inventory_transactions').select(TRANSACTION_SELECT_COLUMNS, { count: 'exact' });

  if (warehouseId && warehouseId !== 'all') {
    query = query.eq('warehouse_id', warehouseId);
  }
  if (transactionType && transactionType !== 'all') {
    query = query.eq('transaction_type', transactionType);
  }
  const isBroadType = itemType === 'material' || itemType === 'product' || itemType === 'byproduct';
  if (itemType && itemType !== 'all' && isBroadType) {
    query = query.eq('item_type', itemType);
  }
  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59Z`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  if (error) throw new Error(error.message);

  const itemMap = await getItemMetadataMap();

  let formatted: InventoryTransaction[] = ((data as unknown as TransactionQueryResult[]) || []).map((row) => {
    const itemMeta = itemMap.get(row.item_id);
    return {
      id: row.id,
      transaction_number: row.transaction_number,
      warehouse_id: row.warehouse_id,
      warehouse_code: row.warehouses?.code,
      warehouse_name: row.warehouses?.name,
      item_type: row.item_type,
      category: itemMeta?.category,
      category_label: itemMeta?.category_label,
      item_id: row.item_id,
      item_code: itemMeta?.code || '---',
      item_name: itemMeta?.name || 'Mặt hàng chưa xác định',
      transaction_type: row.transaction_type,
      quantity: Number(row.quantity) || 0,
      unit_cost: Number(row.unit_cost) || 0,
      reference_doc_type: row.reference_doc_type,
      reference_doc_id: row.reference_doc_id,
      notes: row.notes,
      created_by: row.created_by,
      created_by_name: row.profiles?.full_name || null,
      created_at: row.created_at,
      unit_of_measure: itemMeta?.unit || '',
    };
  });

  // Granular category filter if not broad DB type
  if (itemType && itemType !== 'all' && !isBroadType) {
    formatted = formatted.filter((t) => {
      if (itemType === 'by_product' || itemType === 'byproduct') {
        return t.category === 'by_product' || t.category === 'byproduct' || t.item_type === 'byproduct';
      }
      return t.category === itemType;
    });
  }

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    formatted = formatted.filter(
      (t) =>
        t.transaction_number.toLowerCase().includes(term) ||
        t.item_code?.toLowerCase().includes(term) ||
        t.item_name?.toLowerCase().includes(term) ||
        t.category_label?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term)
    );
  }

  // Calculate instantaneous running stock balance after each transaction
  if (formatted.length > 0) {
    const itemIds = Array.from(new Set(formatted.map((f) => f.item_id)));
    const warehouseIds = Array.from(new Set(formatted.map((f) => f.warehouse_id)));

    const { data: allHistory } = await supabase
      .from('inventory_transactions')
      .select('id, warehouse_id, item_id, quantity, created_at')
      .in('warehouse_id', warehouseIds)
      .in('item_id', itemIds)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (allHistory) {
      const runningBalanceMap = new Map<string, number>();
      const txBalanceAfterMap = new Map<string, number>();

      for (const h of allHistory) {
        const pairKey = `${h.warehouse_id}:::${h.item_id}`;
        const prev = runningBalanceMap.get(pairKey) || 0;
        const current = prev + (Number(h.quantity) || 0);
        runningBalanceMap.set(pairKey, current);
        txBalanceAfterMap.set(h.id, current);
      }

      formatted = formatted.map((tx) => ({
        ...tx,
        balance_after_transaction: txBalanceAfterMap.get(tx.id) ?? tx.quantity,
      }));
    }
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { data: formatted, totalCount, page, pageSize, totalPages };
}

/**
 * Generate a unique transaction number
 */
function generateTxNumber(): string {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TX-${yyyymmdd}-${rand}`;
}

/**
 * Create a dual-transaction warehouse transfer
 * Outbound transaction reduces source warehouse (quantity: -X)
 * Inbound transaction increases destination warehouse (quantity: +X)
 */
export async function createWarehouseTransfer(
  values: WarehouseTransferValues
): Promise<{ outboundTx: InventoryTransaction; inboundTx: InventoryTransaction }> {
  if (values.from_warehouse_id === values.to_warehouse_id) {
    throw new Error('Kho nhận hàng phải khác kho xuất hàng.');
  }

  // 1. Verify source warehouse stock availability
  const { data: balance, error: balErr } = await supabase
    .from('inventory_stock_balance')
    .select('current_quantity, reserved_quantity')
    .eq('warehouse_id', values.from_warehouse_id)
    .eq('item_type', values.item_type)
    .eq('item_id', values.item_id)
    .maybeSingle();

  if (balErr) throw new Error(balErr.message);

  const currentQty = Number(balance?.current_quantity) || 0;
  const reservedQty = Number(balance?.reserved_quantity) || 0;
  const availableQty = currentQty - reservedQty;

  if (availableQty < values.quantity) {
    throw new Error(
      `Kho xuất không đủ tồn khả dụng (Khả dụng: ${availableQty}, Yêu cầu chuyển: ${values.quantity}).`
    );
  }

  // 2. Fetch warehouse details for transaction notes
  const [fromWhRes, toWhRes] = await Promise.all([
    supabase.from('warehouses').select('name, code').eq('id', values.from_warehouse_id).single(),
    supabase.from('warehouses').select('name, code').eq('id', values.to_warehouse_id).single(),
  ]);

  const fromName = fromWhRes.data ? `${fromWhRes.data.name} (${fromWhRes.data.code})` : 'Kho nguồn';
  const toName = toWhRes.data ? `${toWhRes.data.name} (${toWhRes.data.code})` : 'Kho đích';

  const baseTxNum = generateTxNumber();
  const outTxNum = `${baseTxNum}-OUT`;
  const inTxNum = `${baseTxNum}-IN`;

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  // 3. Create outbound transaction (quantity < 0)
  const userNotes = values.notes?.trim() ? ` - ${values.notes.trim()}` : '';
  const outPayload: Database['public']['Tables']['inventory_transactions']['Insert'] = {
    transaction_number: outTxNum,
    warehouse_id: values.from_warehouse_id,
    item_type: values.item_type,
    item_id: values.item_id,
    transaction_type: 'warehouse_transfer',
    quantity: -Math.abs(values.quantity),
    unit_cost: 0,
    reference_doc_type: 'warehouse_transfer',
    notes: `Xuất chuyển kho sang [${toName}]${userNotes}`,
    created_by: userId,
  };

  // 4. Create inbound transaction (quantity > 0)
  const inPayload: Database['public']['Tables']['inventory_transactions']['Insert'] = {
    transaction_number: inTxNum,
    warehouse_id: values.to_warehouse_id,
    item_type: values.item_type,
    item_id: values.item_id,
    transaction_type: 'warehouse_transfer',
    quantity: Math.abs(values.quantity),
    unit_cost: 0,
    reference_doc_type: 'warehouse_transfer',
    notes: `Nhập chuyển kho từ [${fromName}]${userNotes}`,
    created_by: userId,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('inventory_transactions')
    .insert([outPayload, inPayload])
    .select('id');

  if (insertErr) throw new Error(insertErr.message);
  if (!inserted || inserted.length < 2 || !inserted[0] || !inserted[1]) {
    throw new Error('Lỗi tạo phiếu chuyển kho.');
  }

  const [outTx, inTx] = await Promise.all([
    fetchInventoryTransactionById(inserted[0].id),
    fetchInventoryTransactionById(inserted[1].id),
  ]);

  return { outboundTx: outTx, inboundTx: inTx };
}

/**
 * Create a new inventory transaction
 */
export async function createInventoryTransaction(values: {
  warehouse_id: string;
  destination_warehouse_id?: string | null;
  item_type: ItemType;
  item_id: string;
  transaction_type: InventoryTransaction['transaction_type'];
  quantity: number;
  unit_cost?: number;
  reference_doc_type?: string | null;
  reference_doc_id?: string | null;
  notes?: string | null;
}): Promise<InventoryTransaction> {
  // If warehouse transfer with destination, execute dual transfer
  if (values.transaction_type === 'warehouse_transfer') {
    if (!values.destination_warehouse_id || values.destination_warehouse_id === values.warehouse_id) {
      throw new Error('Kho nhận hàng phải khác kho xuất hàng khi thực hiện chuyển kho.');
    }
    const res = await createWarehouseTransfer({
      from_warehouse_id: values.warehouse_id,
      to_warehouse_id: values.destination_warehouse_id,
      item_type: values.item_type,
      item_id: values.item_id,
      quantity: values.quantity,
      notes: values.notes,
    });
    return res.outboundTx;
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  // Determine sign of quantity: issues and disposals reduce inventory (negative)
  let signedQty = values.quantity;
  if (['production_issue', 'scrap_disposal', 'sales_dispatch'].includes(values.transaction_type)) {
    signedQty = -Math.abs(values.quantity);
  } else if (['inbound_receipt', 'production_receipt'].includes(values.transaction_type)) {
    signedQty = Math.abs(values.quantity);
  }

  const payload: Database['public']['Tables']['inventory_transactions']['Insert'] = {
    transaction_number: generateTxNumber(),
    warehouse_id: values.warehouse_id,
    item_type: values.item_type,
    item_id: values.item_id,
    transaction_type: values.transaction_type,
    quantity: signedQty,
    unit_cost: values.unit_cost ?? 0,
    reference_doc_type: values.reference_doc_type || null,
    reference_doc_id: values.reference_doc_id || null,
    notes: values.notes?.trim() || null,
    created_by: userId,
  };

  const { error } = await supabase
    .from('inventory_transactions')
    .insert([payload])
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const res = await fetchInventoryTransactions({
    search: payload.transaction_number,
    page: 1,
    pageSize: 1,
  });

  if (!res.data || res.data.length === 0 || !res.data[0]) {
    throw new Error('Không thể tải thông tin giao dịch vừa tạo.');
  }

  return res.data[0];
}

/**
 * Fetch a single inventory transaction by ID
 */
export async function fetchInventoryTransactionById(id: string): Promise<InventoryTransaction> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(TRANSACTION_SELECT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Không tìm thấy phiếu giao dịch.');

  const itemMap = await getItemMetadataMap();
  const row = data as unknown as TransactionQueryResult;
  const itemMeta = itemMap.get(row.item_id);

  // Compute running balance up to this transaction
  const { data: priorHistory } = await supabase
    .from('inventory_transactions')
    .select('quantity')
    .eq('warehouse_id', row.warehouse_id)
    .eq('item_id', row.item_id)
    .lte('created_at', row.created_at);

  let balanceAfter = Number(row.quantity) || 0;
  if (priorHistory && priorHistory.length > 0) {
    balanceAfter = priorHistory.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  }

  return {
    id: row.id,
    transaction_number: row.transaction_number,
    warehouse_id: row.warehouse_id,
    warehouse_code: row.warehouses?.code,
    warehouse_name: row.warehouses?.name,
    item_type: row.item_type,
    category: itemMeta?.category,
    category_label: itemMeta?.category_label,
    item_id: row.item_id,
    item_code: itemMeta?.code || '---',
    item_name: itemMeta?.name || 'Mặt hàng chưa xác định',
    transaction_type: row.transaction_type,
    quantity: Number(row.quantity) || 0,
    unit_cost: Number(row.unit_cost) || 0,
    reference_doc_type: row.reference_doc_type,
    reference_doc_id: row.reference_doc_id,
    notes: row.notes,
    created_by: row.created_by,
    created_by_name: row.profiles?.full_name || null,
    created_at: row.created_at,
    unit_of_measure: itemMeta?.unit || '',
    balance_after_transaction: balanceAfter,
  };
}

/**
 * Update an existing inventory transaction (admin / manager only)
 */
export async function updateInventoryTransaction(
  id: string,
  values: Partial<{
    warehouse_id: string;
    item_type: ItemType;
    item_id: string;
    transaction_type: InventoryTransaction['transaction_type'];
    quantity: number;
    unit_cost: number;
    notes?: string | null;
  }>
): Promise<InventoryTransaction> {
  const payload: Database['public']['Tables']['inventory_transactions']['Update'] = {};

  if (values.warehouse_id !== undefined) payload.warehouse_id = values.warehouse_id;
  if (values.item_type !== undefined) payload.item_type = values.item_type;
  if (values.item_id !== undefined) payload.item_id = values.item_id;
  if (values.transaction_type !== undefined) payload.transaction_type = values.transaction_type;
  if (values.unit_cost !== undefined) payload.unit_cost = values.unit_cost;
  if (values.notes !== undefined) payload.notes = values.notes?.trim() || null;

  if (values.quantity !== undefined) {
    let signedQty = values.quantity;
    const txType = values.transaction_type;
    if (txType) {
      if (['production_issue', 'scrap_disposal', 'sales_dispatch'].includes(txType)) {
        signedQty = -Math.abs(values.quantity);
      } else if (['inbound_receipt', 'production_receipt'].includes(txType)) {
        signedQty = Math.abs(values.quantity);
      }
    }
    payload.quantity = signedQty;
  }

  const { error } = await supabase
    .from('inventory_transactions')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);

  return fetchInventoryTransactionById(id);
}

/**
 * Delete an inventory transaction (admin / manager only)
 */
export async function deleteInventoryTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_transactions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Perform physical inventory adjustment
 */
export async function createInventoryAdjustment(values: {
  warehouse_id: string;
  item_type: ItemType;
  item_id: string;
  actual_quantity: number;
  reason: string;
}): Promise<InventoryTransaction> {
  // Get current system balance
  const { data: balance, error: balErr } = await supabase
    .from('inventory_stock_balance')
    .select('current_quantity')
    .eq('warehouse_id', values.warehouse_id)
    .eq('item_type', values.item_type)
    .eq('item_id', values.item_id)
    .maybeSingle();

  if (balErr) throw new Error(balErr.message);

  const currentQty = Number(balance?.current_quantity) || 0;
  const difference = values.actual_quantity - currentQty;

  if (difference === 0) {
    throw new Error('Số lượng thực tế khớp với tồn sổ sách, không cần điều chỉnh.');
  }

  return createInventoryTransaction({
    warehouse_id: values.warehouse_id,
    item_type: values.item_type,
    item_id: values.item_id,
    transaction_type: 'inventory_adjustment',
    quantity: difference,
    notes: `Kiểm kê điều chỉnh (Sổ sách: ${currentQty}, Thực tế: ${values.actual_quantity}, Chênh lệch: ${difference > 0 ? '+' : ''}${difference}). Lý do: ${values.reason}`,
  });
}

/**
 * Fetch summary metrics for warehouse dashboard
 */
export async function fetchWarehouseMetrics(): Promise<WarehouseMetrics> {
  const [warehousesRes, activeWarehousesRes, balancesRes, txRes] = await Promise.all([
    supabase.from('warehouses').select('id', { count: 'exact', head: true }),
    supabase.from('warehouses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('inventory_stock_balance').select('item_id', { count: 'exact', head: true }),
    supabase.from('inventory_transactions').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalWarehouses: warehousesRes.count ?? 0,
    activeWarehouses: activeWarehousesRes.count ?? 0,
    totalStockItems: balancesRes.count ?? 0,
    totalTransactionsCount: txRes.count ?? 0,
  };
}

/**
 * Fetch item options for dropdown selects with complete categories
 */
export async function fetchItemOptions(): Promise<WarehouseItemOption[]> {
  const [materialsRes, productsRes] = await Promise.all([
    supabase
      .from('materials')
      .select('id, code, name, category, unit_of_measure, standard_cost')
      .eq('status', 'active'),
    supabase
      .from('products')
      .select('id, sku, name, product_type, unit_of_measure, base_sales_price')
      .eq('status', 'active'),
  ]);

  const items: WarehouseItemOption[] = [];

  const CATEGORY_LABELS: Record<string, string> = {
    raw_material: 'Nguyên vật liệu chính',
    chemical: 'Hóa chất công nghiệp',
    spare_part: 'Phụ tùng & Linh kiện cơ điện',
    packaging: 'Vật tư bao bì & Đóng gói',
    consumable: 'Vật tư tiêu hao / BHLĐ',
    fuel_energy: 'Nhiên liệu & Năng lượng',
    other: 'Vật tư phụ trợ khác',
    finished_good: 'Thành phẩm sản xuất',
    semi_finished: 'Bán thành phẩm',
    by_product: 'Phụ phẩm thu hồi',
    byproduct: 'Phụ phẩm thu hồi',
  };

  (materialsRes.data || []).forEach((m) => {
    const cat = m.category || 'raw_material';
    items.push({
      id: m.id,
      code: m.code,
      name: m.name,
      item_type: 'material',
      category: cat,
      category_label: CATEGORY_LABELS[cat] || 'Vật tư',
      unit: m.unit_of_measure,
      cost: Number(m.standard_cost) || 0,
    });
  });

  (productsRes.data || []).forEach((p) => {
    const isByProduct = p.product_type === 'by_product' || p.product_type === 'byproduct';
    const cat = p.product_type || (isByProduct ? 'by_product' : 'finished_good');
    items.push({
      id: p.id,
      code: p.sku,
      name: p.name,
      item_type: isByProduct ? 'byproduct' : 'product',
      category: cat,
      category_label: CATEGORY_LABELS[cat] || (isByProduct ? 'Phụ phẩm thu hồi' : 'Sản phẩm'),
      unit: p.unit_of_measure,
      cost: Number(p.base_sales_price) || 0,
    });
  });

  return items;
}

/**
 * Fetch employee options for warehouse manager dropdown
 */
export async function fetchWarehouseManagerOptions(): Promise<
  Array<{ id: string; employee_code: string; name: string }>
> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name')
    .eq('status', 'active');

  if (error) return [];
  return (data || []).map((e) => ({
    id: e.id,
    employee_code: e.employee_code,
    name: `${e.last_name || ''} ${e.first_name || ''}`.trim(),
  }));
}

const MATERIAL_CATALOG_SELECT_COLUMNS = `
  id,
  code,
  name,
  category,
  unit_of_measure,
  min_stock_level,
  max_stock_level,
  reorder_point,
  standard_cost,
  status,
  created_at
`;

interface MaterialCatalogQueryResult {
  id: string;
  code: string;
  name: string;
  category: string;
  unit_of_measure: string;
  min_stock_level: number | string;
  max_stock_level: number | string | null;
  reorder_point: number | string;
  standard_cost: number | string;
  status: string;
  created_at: string;
}

/**
 * Fetch paginated materials catalog with aggregated total current stock
 */
export async function fetchMaterialsCatalog(
  params: MaterialCatalogFilterParams
): Promise<PaginatedResult<MaterialCatalogItem>> {
  const { search = '', category, page, pageSize } = params;
  let query = supabase.from('materials').select(MATERIAL_CATALOG_SELECT_COLUMNS, { count: 'exact' });

  if (search.trim()) {
    const term = search.trim();
    query = query.or(`code.ilike.%${term}%,name.ilike.%${term}%`);
  }
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.order('code', { ascending: true }).range(from, to);

  if (error) throw new Error(error.message);

  const materials = (data as unknown as MaterialCatalogQueryResult[]) || [];
  const materialIds = materials.map((m) => m.id);
  const stockMap = new Map<string, number>();

  if (materialIds.length > 0) {
    const { data: balances } = await supabase
      .from('inventory_stock_balance')
      .select('item_id, current_quantity')
      .in('item_id', materialIds);

    (balances || []).forEach((b) => {
      const prev = stockMap.get(b.item_id) || 0;
      stockMap.set(b.item_id, prev + (Number(b.current_quantity) || 0));
    });
  }

  const formatted: MaterialCatalogItem[] = materials.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    unit_of_measure: row.unit_of_measure,
    min_stock_level: Number(row.min_stock_level) || 0,
    max_stock_level: row.max_stock_level !== null ? Number(row.max_stock_level) : null,
    reorder_point: Number(row.reorder_point) || 0,
    standard_cost: Number(row.standard_cost) || 0,
    status: row.status,
    total_stock: stockMap.get(row.id) || 0,
    created_at: row.created_at,
  }));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { data: formatted, totalCount, page, pageSize, totalPages };
}

/**
 * Create a new material in the catalog
 */
export async function createMaterial(values: MaterialFormValues): Promise<MaterialCatalogItem> {
  const insertPayload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    category: values.category,
    unit_of_measure: values.unit_of_measure.trim(),
    min_stock_level: values.min_stock_level,
    max_stock_level: values.max_stock_level !== undefined ? values.max_stock_level : null,
    reorder_point: values.reorder_point,
    standard_cost: values.standard_cost,
    status: values.status,
  };

  const { data, error } = await supabase
    .from('materials')
    .insert(insertPayload)
    .select(MATERIAL_CATALOG_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Mã vật tư "${values.code}" đã tồn tại trong hệ thống.`);
    }
    throw new Error(error.message);
  }

  const row = data as unknown as MaterialCatalogQueryResult;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    unit_of_measure: row.unit_of_measure,
    min_stock_level: Number(row.min_stock_level) || 0,
    max_stock_level: row.max_stock_level !== null ? Number(row.max_stock_level) : null,
    reorder_point: Number(row.reorder_point) || 0,
    standard_cost: Number(row.standard_cost) || 0,
    status: row.status,
    total_stock: 0,
    created_at: row.created_at,
  };
}

/**
 * Update an existing material in the catalog
 */
export async function updateMaterial(
  id: string,
  values: MaterialFormValues
): Promise<MaterialCatalogItem> {
  const updatePayload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    category: values.category,
    unit_of_measure: values.unit_of_measure.trim(),
    min_stock_level: values.min_stock_level,
    max_stock_level: values.max_stock_level !== undefined ? values.max_stock_level : null,
    reorder_point: values.reorder_point,
    standard_cost: values.standard_cost,
    status: values.status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('materials')
    .update(updatePayload)
    .eq('id', id)
    .select(MATERIAL_CATALOG_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Mã vật tư "${values.code}" đã được sử dụng bởi vật tư khác.`);
    }
    throw new Error(error.message);
  }

  const row = data as unknown as MaterialCatalogQueryResult;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    unit_of_measure: row.unit_of_measure,
    min_stock_level: Number(row.min_stock_level) || 0,
    max_stock_level: row.max_stock_level !== null ? Number(row.max_stock_level) : null,
    reorder_point: Number(row.reorder_point) || 0,
    standard_cost: Number(row.standard_cost) || 0,
    status: row.status,
    total_stock: 0,
    created_at: row.created_at,
  };
}

/**
 * Delete a material from the catalog
 */
export async function deleteMaterial(id: string): Promise<void> {
  // Check if balance exists
  const { data: balances } = await supabase
    .from('inventory_stock_balance')
    .select('current_quantity')
    .eq('item_id', id)
    .limit(1);

  if (balances && balances.length > 0 && Number(balances[0]?.current_quantity) > 0) {
    throw new Error('Không thể xóa vật tư đang còn số dư tồn kho. Vui lòng xuất kho hoặc điều chỉnh về 0 trước.');
  }

  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Vật tư này đã phát sinh giao dịch hoặc liên kết dữ liệu, không thể xóa.');
    }
    throw new Error(error.message);
  }
}

const PRODUCT_CATALOG_SELECT_COLUMNS = `
  id,
  sku,
  name,
  product_type,
  unit_of_measure,
  standard_cycle_time_mins,
  standard_labor_cost,
  base_sales_price,
  status,
  created_at,
  updated_at
`;

interface ProductCatalogQueryResult {
  id: string;
  sku: string;
  name: string;
  product_type: 'finished_good' | 'semi_finished' | 'by_product';
  unit_of_measure: string;
  standard_cycle_time_mins: number | string | null;
  standard_labor_cost: number | string | null;
  base_sales_price: number | string;
  status: 'active' | 'discontinued';
  created_at: string;
  updated_at: string;
}

/**
 * Fetch paginated products catalog with aggregated total current stock
 */
export async function fetchProductsCatalog(
  params: ProductCatalogFilterParams
): Promise<PaginatedResult<ProductCatalogItem>> {
  const { search = '', productType, status, page, pageSize } = params;
  let query = supabase.from('products').select(PRODUCT_CATALOG_SELECT_COLUMNS, { count: 'exact' });

  if (search.trim()) {
    const term = search.trim();
    query = query.or(`sku.ilike.%${term}%,name.ilike.%${term}%`);
  }
  if (productType && productType !== 'all') {
    query = query.eq('product_type', productType);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.order('sku', { ascending: true }).range(from, to);

  if (error) throw new Error(error.message);

  const products = (data as unknown as ProductCatalogQueryResult[]) || [];
  const productIds = products.map((p) => p.id);
  const stockMap = new Map<string, number>();

  if (productIds.length > 0) {
    const { data: balances } = await supabase
      .from('inventory_stock_balance')
      .select('item_id, current_quantity')
      .in('item_id', productIds);

    (balances || []).forEach((b) => {
      const prev = stockMap.get(b.item_id) || 0;
      stockMap.set(b.item_id, prev + (Number(b.current_quantity) || 0));
    });
  }

  const formatted: ProductCatalogItem[] = products.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    product_type: row.product_type,
    unit_of_measure: row.unit_of_measure,
    standard_cycle_time_mins: Number(row.standard_cycle_time_mins) || 0,
    standard_labor_cost: Number(row.standard_labor_cost) || 0,
    base_sales_price: Number(row.base_sales_price) || 0,
    status: row.status,
    total_stock: stockMap.get(row.id) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { data: formatted, totalCount, page, pageSize, totalPages };
}

/**
 * Create a new product in the catalog
 */
export async function createProduct(values: ProductFormValues): Promise<ProductCatalogItem> {
  const insertPayload = {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    product_type: values.product_type,
    unit_of_measure: values.unit_of_measure.trim(),
    base_sales_price: values.base_sales_price,
    standard_cycle_time_mins: values.standard_cycle_time_mins,
    standard_labor_cost: values.standard_labor_cost,
    status: values.status,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(insertPayload)
    .select(PRODUCT_CATALOG_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Mã SKU "${values.sku}" đã tồn tại trong hệ thống.`);
    }
    throw new Error(error.message);
  }

  const row = data as unknown as ProductCatalogQueryResult;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    product_type: row.product_type,
    unit_of_measure: row.unit_of_measure,
    standard_cycle_time_mins: Number(row.standard_cycle_time_mins) || 0,
    standard_labor_cost: Number(row.standard_labor_cost) || 0,
    base_sales_price: Number(row.base_sales_price) || 0,
    status: row.status,
    total_stock: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Update an existing product in the catalog
 */
export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<ProductCatalogItem> {
  const updatePayload = {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    product_type: values.product_type,
    unit_of_measure: values.unit_of_measure.trim(),
    base_sales_price: values.base_sales_price,
    standard_cycle_time_mins: values.standard_cycle_time_mins,
    standard_labor_cost: values.standard_labor_cost,
    status: values.status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', id)
    .select(PRODUCT_CATALOG_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Mã SKU "${values.sku}" đã được sử dụng bởi sản phẩm khác.`);
    }
    throw new Error(error.message);
  }

  const row = data as unknown as ProductCatalogQueryResult;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    product_type: row.product_type,
    unit_of_measure: row.unit_of_measure,
    standard_cycle_time_mins: Number(row.standard_cycle_time_mins) || 0,
    standard_labor_cost: Number(row.standard_labor_cost) || 0,
    base_sales_price: Number(row.base_sales_price) || 0,
    status: row.status,
    total_stock: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Delete a product from the catalog
 */
export async function deleteProduct(id: string): Promise<void> {
  // Check if balance exists
  const { data: balances } = await supabase
    .from('inventory_stock_balance')
    .select('current_quantity')
    .eq('item_id', id)
    .limit(1);

  if (balances && balances.length > 0 && Number(balances[0]?.current_quantity) > 0) {
    throw new Error('Không thể xóa sản phẩm đang còn số dư tồn kho. Vui lòng xuất kho hoặc điều chỉnh về 0 trước.');
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Sản phẩm này đã được sử dụng trong BOM, lệnh sản xuất, đơn hàng hoặc liên kết dữ liệu, không thể xóa. Bạn có thể đổi trạng thái sang "Ngừng kinh doanh".');
    }
    throw new Error(error.message);
  }
}


