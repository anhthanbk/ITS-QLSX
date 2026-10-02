import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type {
  Machine,
  MachineStatus,
  MachineAdjustment,
  MachineAdjustmentFilterParams,
  MaintenancePlan,
  MaintenanceWorkOrder,
  MachineFilterParams,
  MaintenancePlanFilterParams,
  WorkOrderFilterParams,
  PaginatedResult,
  MaintenanceMetrics,
  MaintenanceSparePart,
  MaintenanceSparePartFilterParams,
} from '../types';
import type {
  MachineFormValues,
  MachineAdjustmentFormValues,
  MaintenancePlanFormValues,
  WorkOrderFormValues,
  WorkOrderStatusUpdateValues,
} from '../validation/maintenance-schemas';

type MachineUpdate = Database['public']['Tables']['machines']['Update'];
type MachineAdjustmentInsert = Database['public']['Tables']['machine_adjustments']['Insert'];
type MachineAdjustmentUpdate = Database['public']['Tables']['machine_adjustments']['Update'];
type MaintenancePlanInsert = Database['public']['Tables']['maintenance_plans']['Insert'];
type MaintenancePlanUpdate = Database['public']['Tables']['maintenance_plans']['Update'];
type WorkOrderInsert = Database['public']['Tables']['maintenance_work_orders']['Insert'];
type WorkOrderUpdate = Database['public']['Tables']['maintenance_work_orders']['Update'];

/* =========================================================
   1. MACHINES API
   ========================================================= */

const MACHINE_COLUMNS = `
  id,
  machine_code,
  name,
  line_id,
  department_id,
  model,
  serial_number,
  line_location,
  rated_capacity_per_hour,
  power_rating_kw,
  installation_date,
  status,
  extra_specs,
  created_at,
  updated_at,
  departments:department_id(id, name, code),
  production_lines:line_id(id, name, code)
`;

export async function fetchMachines(
  params: MachineFilterParams,
): Promise<PaginatedResult<Machine>> {
  const { search, status, departmentId, page, pageSize } = params;

  let query = supabase
    .from('machines')
    .select(MACHINE_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (departmentId && departmentId !== 'all') {
    query = query.eq('department_id', departmentId);
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(
      `machine_code.ilike.%${term}%,name.ilike.%${term}%,model.ilike.%${term}%,serial_number.ilike.%${term}%,line_location.ilike.%${term}%`,
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch machines:', error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: (data ?? []) as unknown as Machine[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function fetchMachineById(id: string): Promise<Machine> {
  const { data, error } = await supabase
    .from('machines')
    .select(MACHINE_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch machine detail:', error);
    throw new Error(error.message);
  }

  return data as unknown as Machine;
}

export async function createMachine(values: MachineFormValues): Promise<Machine> {
  const payload = {
    machine_code: values.machine_code.trim().toUpperCase(),
    name: values.name.trim(),
    line_id: values.line_id || null,
    department_id: values.department_id || null,
    model: values.model?.trim() || null,
    serial_number: values.serial_number?.trim() || null,
    line_location: values.line_location?.trim() || null,
    rated_capacity_per_hour: values.rated_capacity_per_hour ?? null,
    power_rating_kw: values.power_rating_kw ?? null,
    installation_date: values.installation_date || null,
    status: values.status,
    extra_specs: values.extra_specs ?? null,
  };

  const { data, error } = await supabase
    .from('machines')
    .insert([payload])
    .select(MACHINE_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to create machine:', error);
    throw new Error(error.message);
  }

  return data as unknown as Machine;
}

export async function updateMachine(
  id: string,
  values: Partial<MachineFormValues>,
): Promise<Machine> {
  const payload: MachineUpdate = {};

  if (values.machine_code !== undefined) payload.machine_code = values.machine_code.trim().toUpperCase();
  if (values.name !== undefined) payload.name = values.name.trim();
  if (values.line_id !== undefined) payload.line_id = values.line_id || null;
  if (values.department_id !== undefined) payload.department_id = values.department_id || null;
  if (values.model !== undefined) payload.model = values.model?.trim() || null;
  if (values.serial_number !== undefined) payload.serial_number = values.serial_number?.trim() || null;
  if (values.line_location !== undefined) payload.line_location = values.line_location?.trim() || null;
  if (values.rated_capacity_per_hour !== undefined) payload.rated_capacity_per_hour = values.rated_capacity_per_hour ?? null;
  if (values.power_rating_kw !== undefined) payload.power_rating_kw = values.power_rating_kw ?? null;
  if (values.installation_date !== undefined) payload.installation_date = values.installation_date || null;
  if (values.status !== undefined) payload.status = values.status;
  if (values.extra_specs !== undefined) payload.extra_specs = values.extra_specs ?? null;

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('machines')
    .update(payload)
    .eq('id', id)
    .select(MACHINE_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to update machine:', error);
    throw new Error(error.message);
  }

  return data as unknown as Machine;
}

export async function deleteMachine(id: string): Promise<void> {
  const { error } = await supabase.from('machines').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete machine:', error);
    throw new Error(error.message);
  }
}

/* =========================================================
   2. MAINTENANCE PLANS API
   ========================================================= */

const PLAN_COLUMNS = `
  id,
  plan_code,
  machine_id,
  title,
  frequency_days,
  last_performed_date,
  next_due_date,
  standard_duration_hours,
  is_active,
  created_at,
  updated_at,
  machines:machine_id(id, machine_code, name, status)
`;

export async function fetchMaintenancePlans(
  params: MaintenancePlanFilterParams,
): Promise<PaginatedResult<MaintenancePlan>> {
  const { search, machineId, isActive, page, pageSize } = params;

  let query = supabase
    .from('maintenance_plans')
    .select(PLAN_COLUMNS, { count: 'exact' });

  if (machineId && machineId !== 'all') {
    query = query.eq('machine_id', machineId);
  }

  if (isActive !== undefined && isActive !== 'all') {
    query = query.eq('is_active', isActive);
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(`plan_code.ilike.%${term}%,title.ilike.%${term}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch maintenance plans:', error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: (data ?? []) as unknown as MaintenancePlan[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function createMaintenancePlan(
  values: MaintenancePlanFormValues,
): Promise<MaintenancePlan> {
  const fallbackDueDate: string = new Date(Date.now() + values.frequency_days * 86400000)
    .toISOString()
    .slice(0, 10);

  const nextDueDate: string =
    values.next_due_date && values.next_due_date.trim() !== ''
      ? values.next_due_date
      : fallbackDueDate;

  const payload: MaintenancePlanInsert = {
    plan_code: values.plan_code.trim().toUpperCase(),
    machine_id: values.machine_id,
    title: values.title.trim(),
    frequency_days: values.frequency_days,
    last_performed_date: values.last_performed_date || null,
    next_due_date: nextDueDate,
    standard_duration_hours: values.standard_duration_hours ?? null,
    is_active: values.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('maintenance_plans')
    .insert([payload])
    .select(PLAN_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to create maintenance plan:', error);
    throw new Error(error.message);
  }

  return data as unknown as MaintenancePlan;
}

export async function updateMaintenancePlan(
  id: string,
  values: Partial<MaintenancePlanFormValues>,
): Promise<MaintenancePlan> {
  const payload: MaintenancePlanUpdate = {};

  if (values.plan_code !== undefined) payload.plan_code = values.plan_code.trim().toUpperCase();
  if (values.machine_id !== undefined) payload.machine_id = values.machine_id;
  if (values.title !== undefined) payload.title = values.title.trim();
  if (values.frequency_days !== undefined) payload.frequency_days = values.frequency_days;
  if (values.last_performed_date !== undefined) payload.last_performed_date = values.last_performed_date || null;
  if (values.next_due_date) payload.next_due_date = values.next_due_date;
  if (values.standard_duration_hours !== undefined) payload.standard_duration_hours = values.standard_duration_hours ?? null;
  if (values.is_active !== undefined) payload.is_active = values.is_active;

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('maintenance_plans')
    .update(payload)
    .eq('id', id)
    .select(PLAN_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to update maintenance plan:', error);
    throw new Error(error.message);
  }

  return data as unknown as MaintenancePlan;
}

export async function deleteMaintenancePlan(id: string): Promise<void> {
  const { error } = await supabase.from('maintenance_plans').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete maintenance plan:', error);
    throw new Error(error.message);
  }
}

/* =========================================================
   3. WORK ORDERS API
   ========================================================= */

const WORK_ORDER_COLUMNS = `
  id,
  work_order_number,
  machine_id,
  maintenance_plan_id,
  type,
  priority,
  assigned_technician_id,
  reported_issue,
  root_cause,
  resolution_summary,
  downtime_minutes,
  labor_hours,
  spare_parts_cost,
  status,
  scheduled_date,
  completed_at,
  created_at,
  updated_at,
  machines:machine_id(id, machine_code, name, line_location),
  assigned_technician:assigned_technician_id(id, employee_code, first_name, last_name),
  maintenance_plans:maintenance_plan_id(id, plan_code, title)
`;

export async function fetchWorkOrders(
  params: WorkOrderFilterParams,
): Promise<PaginatedResult<MaintenanceWorkOrder>> {
  const { search, machineId, status, priority, type, page, pageSize } = params;

  let query = supabase
    .from('maintenance_work_orders')
    .select(WORK_ORDER_COLUMNS, { count: 'exact' });

  if (machineId && machineId !== 'all') {
    query = query.eq('machine_id', machineId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (priority && priority !== 'all') {
    query = query.eq('priority', priority);
  }

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(
      `work_order_number.ilike.%${term}%,reported_issue.ilike.%${term}%,root_cause.ilike.%${term}%`,
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch work orders:', error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: (data ?? []) as unknown as MaintenanceWorkOrder[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function createWorkOrder(
  values: WorkOrderFormValues,
): Promise<MaintenanceWorkOrder> {
  const payload: WorkOrderInsert = {
    work_order_number: values.work_order_number.trim().toUpperCase(),
    machine_id: values.machine_id,
    maintenance_plan_id: values.maintenance_plan_id || null,
    type: values.type,
    priority: values.priority,
    assigned_technician_id: values.assigned_technician_id,
    reported_issue: values.reported_issue.trim(),
    root_cause: values.root_cause?.trim() || null,
    resolution_summary: values.resolution_summary?.trim() || null,
    downtime_minutes: values.downtime_minutes ?? 0,
    labor_hours: values.labor_hours ?? 0,
    spare_parts_cost: values.spare_parts_cost ?? 0,
    status: values.status,
    scheduled_date: values.scheduled_date,
    completed_at: values.status === 'completed' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('maintenance_work_orders')
    .insert([payload])
    .select(WORK_ORDER_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to create work order:', error);
    throw new Error(error.message);
  }

  return data as unknown as MaintenanceWorkOrder;
}

export async function updateWorkOrder(
  id: string,
  values: Partial<WorkOrderFormValues>,
): Promise<MaintenanceWorkOrder> {
  const payload: WorkOrderUpdate = {};

  if (values.work_order_number !== undefined) payload.work_order_number = values.work_order_number.trim().toUpperCase();
  if (values.machine_id !== undefined) payload.machine_id = values.machine_id;
  if (values.maintenance_plan_id !== undefined) payload.maintenance_plan_id = values.maintenance_plan_id || null;
  if (values.type !== undefined) payload.type = values.type;
  if (values.priority !== undefined) payload.priority = values.priority;
  if (values.assigned_technician_id !== undefined) payload.assigned_technician_id = values.assigned_technician_id;
  if (values.reported_issue !== undefined) payload.reported_issue = values.reported_issue.trim();
  if (values.root_cause !== undefined) payload.root_cause = values.root_cause?.trim() || null;
  if (values.resolution_summary !== undefined) payload.resolution_summary = values.resolution_summary?.trim() || null;
  if (values.downtime_minutes !== undefined) payload.downtime_minutes = values.downtime_minutes ?? 0;
  if (values.labor_hours !== undefined) payload.labor_hours = values.labor_hours ?? 0;
  if (values.spare_parts_cost !== undefined) payload.spare_parts_cost = values.spare_parts_cost ?? 0;
  if (values.status !== undefined) {
    payload.status = values.status;
    if (values.status === 'completed') {
      payload.completed_at = new Date().toISOString();
    }
  }
  if (values.scheduled_date !== undefined) payload.scheduled_date = values.scheduled_date;

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('maintenance_work_orders')
    .update(payload)
    .eq('id', id)
    .select(WORK_ORDER_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to update work order:', error);
    throw new Error(error.message);
  }

  return data as unknown as MaintenanceWorkOrder;
}

export async function updateWorkOrderStatus(
  id: string,
  values: WorkOrderStatusUpdateValues,
): Promise<MaintenanceWorkOrder> {
  const payload: WorkOrderUpdate = {
    status: values.status,
    updated_at: new Date().toISOString(),
  };

  if (values.status === 'completed') {
    payload.completed_at = new Date().toISOString();
  }
  if (values.root_cause !== undefined) payload.root_cause = values.root_cause?.trim() || null;
  if (values.resolution_summary !== undefined) payload.resolution_summary = values.resolution_summary?.trim() || null;
  if (values.downtime_minutes !== undefined) payload.downtime_minutes = values.downtime_minutes ?? 0;
  if (values.labor_hours !== undefined) payload.labor_hours = values.labor_hours ?? 0;
  if (values.spare_parts_cost !== undefined) payload.spare_parts_cost = values.spare_parts_cost ?? 0;

  const { data, error } = await supabase
    .from('maintenance_work_orders')
    .update(payload)
    .eq('id', id)
    .select(WORK_ORDER_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to update work order status:', error);
    throw new Error(error.message);
  }

  return data as unknown as MaintenanceWorkOrder;
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase.from('maintenance_work_orders').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete work order:', error);
    throw new Error(error.message);
  }
}

/* =========================================================
   4. METRICS & LOOKUP UTILITIES
   ========================================================= */

export async function fetchMaintenanceMetrics(): Promise<MaintenanceMetrics> {
  const [
    totalMachinesRes,
    operationalRes,
    inMaintenanceRes,
    breakdownRes,
    activeOrdersRes,
    pmPlansRes,
  ] = await Promise.all([
    supabase.from('machines').select('id', { count: 'exact', head: true }),
    supabase.from('machines').select('id', { count: 'exact', head: true }).eq('status', 'operational'),
    supabase.from('machines').select('id', { count: 'exact', head: true }).eq('status', 'in_maintenance'),
    supabase.from('machines').select('id', { count: 'exact', head: true }).eq('status', 'breakdown'),
    supabase
      .from('maintenance_work_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'pending_parts']),
    supabase.from('maintenance_plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    totalMachines: totalMachinesRes.count ?? 0,
    operationalMachines: operationalRes.count ?? 0,
    inMaintenanceMachines: inMaintenanceRes.count ?? 0,
    breakdownMachines: breakdownRes.count ?? 0,
    activeWorkOrders: activeOrdersRes.count ?? 0,
    totalPlannedPMs: pmPlansRes.count ?? 0,
  };
}

export async function fetchMachineOptions(): Promise<
  Array<{ id: string; machine_code: string; name: string; status: MachineStatus }>
> {
  const { data, error } = await supabase
    .from('machines')
    .select('id, machine_code, name, status')
    .neq('status', 'decommissioned')
    .order('machine_code', { ascending: true });

  if (error) {
    console.error('Failed to fetch machine options:', error);
    return [];
  }

  return (data ?? []) as unknown as Array<{
    id: string;
    machine_code: string;
    name: string;
    status: MachineStatus;
  }>;
}

export async function fetchTechnicianOptions(): Promise<
  Array<{ id: string; employee_code: string; first_name: string; last_name: string }>
> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name')
    .eq('status', 'active')
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Failed to fetch technician options:', error);
    return [];
  }

  return data ?? [];
}

export async function fetchProductionLines(): Promise<
  Array<{ id: string; name: string; code: string }>
> {
  const { data, error } = await supabase
    .from('production_lines')
    .select('id, name, code')
    .order('code', { ascending: true });

  if (error) {
    console.error('Failed to fetch production lines:', error);
    return [];
  }

  return data ?? [];
}

/* =========================================================
   5. MACHINE ADJUSTMENTS & IMPROVEMENTS API
   ========================================================= */

const MACHINE_ADJUSTMENT_COLUMNS = `
  id,
  machine_id,
  status_before,
  status_after,
  operating_condition_before,
  improvement_content,
  result,
  changed_params,
  applied_to_machine,
  performed_at,
  created_at,
  updated_at,
  created_by,
  profiles:created_by(id, full_name),
  machines:machine_id(id, machine_code, name)
`;

export async function fetchMachineAdjustments(
  params: MachineAdjustmentFilterParams,
): Promise<PaginatedResult<MachineAdjustment>> {
  const { machineId, search, page = 1, pageSize = 20 } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('machine_adjustments')
    .select(MACHINE_ADJUSTMENT_COLUMNS, { count: 'exact' });

  if (machineId && machineId !== 'all') {
    query = query.eq('machine_id', machineId);
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(
      `improvement_content.ilike.%${term}%,result.ilike.%${term}%,operating_condition_before.ilike.%${term}%`,
    );
  }

  query = query
    .order('performed_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch machine adjustments:', error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: (data ?? []) as unknown as MachineAdjustment[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function createMachineAdjustment(
  values: MachineAdjustmentFormValues,
): Promise<MachineAdjustment> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || null;

  const payload: MachineAdjustmentInsert = {
    machine_id: values.machine_id,
    status_before: values.status_before,
    status_after: values.status_after,
    operating_condition_before: values.operating_condition_before?.trim() || null,
    improvement_content: values.improvement_content.trim(),
    result: values.result.trim(),
    changed_params: values.changed_params || null,
    applied_to_machine: values.applied_to_machine ?? true,
    performed_at: values.performed_at,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('machine_adjustments')
    .insert([payload])
    .select(MACHINE_ADJUSTMENT_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to create machine adjustment:', error);
    throw new Error(error.message);
  }

  // If applied_to_machine is checked, sync updates directly to machines table
  if (values.applied_to_machine) {
    const machineUpdates: MachineUpdate = {
      status: values.status_after,
      updated_at: new Date().toISOString(),
    };

    if (values.changed_params && Object.keys(values.changed_params).length > 0) {
      const { data: currentMachine } = await supabase
        .from('machines')
        .select('extra_specs')
        .eq('id', values.machine_id)
        .single();

      const existingSpecs = (currentMachine?.extra_specs && typeof currentMachine.extra_specs === 'object')
        ? (currentMachine.extra_specs as Record<string, string>)
        : {};

      const updatedSpecs = { ...existingSpecs, ...values.changed_params };
      machineUpdates.extra_specs = updatedSpecs;
    }

    const { error: updateMachineError } = await supabase
      .from('machines')
      .update(machineUpdates)
      .eq('id', values.machine_id);

    if (updateMachineError) {
      console.warn('Machine adjustment logged, but failed to sync to machine:', updateMachineError);
    }
  }

  return data as unknown as MachineAdjustment;
}

export async function updateMachineAdjustment(
  id: string,
  values: Partial<MachineAdjustmentFormValues>,
): Promise<MachineAdjustment> {
  const payload: MachineAdjustmentUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (values.machine_id !== undefined) payload.machine_id = values.machine_id;
  if (values.status_before !== undefined) payload.status_before = values.status_before;
  if (values.status_after !== undefined) payload.status_after = values.status_after;
  if (values.operating_condition_before !== undefined) {
    payload.operating_condition_before = values.operating_condition_before?.trim() || null;
  }
  if (values.improvement_content !== undefined) {
    payload.improvement_content = values.improvement_content.trim();
  }
  if (values.result !== undefined) payload.result = values.result.trim();
  if (values.changed_params !== undefined) payload.changed_params = values.changed_params || null;
  if (values.applied_to_machine !== undefined) payload.applied_to_machine = values.applied_to_machine;
  if (values.performed_at !== undefined) payload.performed_at = values.performed_at;

  const { data, error } = await supabase
    .from('machine_adjustments')
    .update(payload)
    .eq('id', id)
    .select(MACHINE_ADJUSTMENT_COLUMNS)
    .single();

  if (error) {
    console.error('Failed to update machine adjustment:', error);
    throw new Error(error.message);
  }

  // If applied_to_machine is checked, sync updates directly to machines table
  if (values.applied_to_machine && values.machine_id && values.status_after) {
    const machineUpdates: MachineUpdate = {
      status: values.status_after,
      updated_at: new Date().toISOString(),
    };

    if (values.changed_params && Object.keys(values.changed_params).length > 0) {
      const { data: currentMachine } = await supabase
        .from('machines')
        .select('extra_specs')
        .eq('id', values.machine_id)
        .single();

      const existingSpecs =
        currentMachine?.extra_specs && typeof currentMachine.extra_specs === 'object'
          ? (currentMachine.extra_specs as Record<string, string>)
          : {};

      const updatedSpecs = { ...existingSpecs, ...values.changed_params };
      machineUpdates.extra_specs = updatedSpecs;
    }

    const { error: updateMachineError } = await supabase
      .from('machines')
      .update(machineUpdates)
      .eq('id', values.machine_id);

    if (updateMachineError) {
      console.warn('Machine adjustment updated, but failed to sync to machine:', updateMachineError);
    }
  }

  return data as unknown as MachineAdjustment;
}

export async function deleteMachineAdjustment(id: string): Promise<void> {
  const { error } = await supabase
    .from('machine_adjustments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete machine adjustment:', error);
    throw new Error(error.message);
  }
}

/* =========================================================
   5. SPARE PARTS & WAREHOUSE INVENTORY INTEGRATION
   ========================================================= */

const SPARE_PART_MATERIAL_COLUMNS = `
  id,
  code,
  name,
  category,
  unit_of_measure,
  min_stock_level,
  reorder_point,
  standard_cost,
  status
`;

export async function fetchMaintenanceSpareParts(
  params: MaintenanceSparePartFilterParams = {},
): Promise<PaginatedResult<MaintenanceSparePart>> {
  const { search, status = 'all', page = 1, pageSize = 20 } = params;

  let query = supabase
    .from('materials')
    .select(SPARE_PART_MATERIAL_COLUMNS, { count: 'exact' })
    .eq('category', 'spare_part')
    .order('code', { ascending: true });

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: materials, error: matError, count } = await query.range(from, to);

  if (matError) {
    console.error('Failed to fetch spare parts materials:', matError);
    throw new Error(matError.message);
  }

  const totalCount = count ?? 0;
  if (!materials || materials.length === 0) {
    return {
      data: [],
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  const materialIds = materials.map((m) => m.id);

  // Fetch balances for spare parts from warehouse inventory balance
  const { data: balances, error: balError } = await supabase
    .from('inventory_stock_balance')
    .select(`
      item_id,
      warehouse_id,
      current_quantity,
      reserved_quantity,
      last_transaction_at,
      warehouses:warehouse_id (
        id,
        name,
        code,
        warehouse_type
      )
    `)
    .in('item_id', materialIds);

  if (balError) {
    console.warn('Failed to fetch stock balances for spare parts:', balError);
  }

  type BalanceRow = {
    item_id: string;
    warehouse_id: string;
    current_quantity: number | null;
    reserved_quantity: number | null;
    last_transaction_at: string | null;
    warehouses: {
      id: string;
      name: string;
      code: string;
      warehouse_type: string;
    } | null;
  };

  const balanceMap = new Map<string, BalanceRow>();
  (balances as unknown as BalanceRow[] | null)?.forEach((b) => {
    const existing = balanceMap.get(b.item_id);
    if (!existing || b.warehouses?.warehouse_type === 'spare_parts') {
      balanceMap.set(b.item_id, b);
    }
  });

  const parts: MaintenanceSparePart[] = materials.map((m) => {
    const bal = balanceMap.get(m.id);
    const currentStock = bal?.current_quantity ?? 0;
    const reservedStock = bal?.reserved_quantity ?? 0;
    const availableStock = Math.max(0, currentStock - reservedStock);
    const minStock = m.min_stock_level ?? 0;
    const reorderPoint = m.reorder_point ?? minStock;

    let partStatus: 'safe' | 'low' | 'critical' = 'safe';
    if (currentStock <= 0 || (minStock > 0 && currentStock <= minStock * 0.5)) {
      partStatus = 'critical';
    } else if (minStock > 0 && currentStock <= minStock) {
      partStatus = 'low';
    }

    return {
      id: m.id,
      code: m.code,
      name: m.name,
      category: 'Phụ tùng cơ điện',
      unit: m.unit_of_measure,
      currentStock,
      reservedStock,
      availableStock,
      minStock,
      reorderPoint,
      standardCost: m.standard_cost ?? 0,
      status: partStatus,
      warehouseId: bal?.warehouse_id ?? null,
      warehouseName: bal?.warehouses?.name ?? 'Kho Phụ Tùng Cơ Điện (K-PT)',
      warehouseCode: bal?.warehouses?.code ?? 'K-PT',
      lastTransactionAt: bal?.last_transaction_at ?? null,
    };
  });

  // Filter by status if requested
  const filteredParts = status === 'all' ? parts : parts.filter((p) => p.status === status);

  return {
    data: filteredParts,
    totalCount: status === 'all' ? totalCount : filteredParts.length,
    page,
    pageSize,
    totalPages: Math.ceil((status === 'all' ? totalCount : filteredParts.length) / pageSize),
  };
}

