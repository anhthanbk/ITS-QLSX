export type MachineStatus =
  | 'operational'
  | 'in_maintenance'
  | 'breakdown'
  | 'standby'
  | 'decommissioned';

export type WorkOrderType =
  | 'preventative'
  | 'corrective_breakdown'
  | 'predictive'
  | 'calibration';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkOrderStatus =
  | 'open'
  | 'in_progress'
  | 'pending_parts'
  | 'completed'
  | 'cancelled';

export interface MachineDepartment {
  id: string;
  name: string;
  code: string;
}

export interface MachineLine {
  id: string;
  name: string;
  code: string;
}

export interface Machine {
  id: string;
  machine_code: string;
  name: string;
  line_id: string | null;
  department_id: string | null;
  model: string | null;
  serial_number: string | null;
  line_location: string | null;
  rated_capacity_per_hour: number | null;
  power_rating_kw: number | null;
  installation_date: string | null;
  status: MachineStatus;
  created_at: string;
  updated_at: string;
  departments?: MachineDepartment | null;
  production_lines?: MachineLine | null;
  /** Additional technical specifications as key‑value pairs, e.g. speed, width, length. */
  extra_specs?: Record<string, string> | null;
}

/** Record of adjustments / improvements performed on a machine. */
export interface MachineAdjustment {
  id: string;
  machine_id: string;
  status_before: MachineStatus;
  status_after: MachineStatus;
  operating_condition_before?: string | null;
  improvement_content: string;
  result: string;
  changed_params?: Record<string, string> | null;
  applied_to_machine: boolean;
  performed_at: string;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  profiles?: {
    id?: string;
    full_name: string | null;
  } | null;
  machines?: {
    id: string;
    machine_code: string;
    name: string;
  } | null;
}

export interface MachineAdjustmentFilterParams {
  machineId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MaintenancePlan {
  id: string;
  plan_code: string;
  machine_id: string;
  title: string;
  frequency_days: number;
  last_performed_date: string | null;
  next_due_date: string | null;
  standard_duration_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  machines?: {
    id: string;
    machine_code: string;
    name: string;
    status: MachineStatus;
  } | null;
}

export interface MaintenanceTechnician {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  work_order_number: string;
  machine_id: string;
  maintenance_plan_id: string | null;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  assigned_technician_id: string;
  reported_issue: string;
  root_cause: string | null;
  resolution_summary: string | null;
  downtime_minutes: number | null;
  labor_hours: number | null;
  spare_parts_cost: number | null;
  status: WorkOrderStatus;
  scheduled_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  machines?: {
    id: string;
    machine_code: string;
    name: string;
    line_location: string | null;
  } | null;
  assigned_technician?: MaintenanceTechnician | null;
  maintenance_plans?: {
    id: string;
    plan_code: string;
    title: string;
  } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MachineFilterParams {
  search?: string;
  status?: MachineStatus | 'all';
  departmentId?: string;
  page: number;
  pageSize: number;
}

export interface MaintenancePlanFilterParams {
  search?: string;
  machineId?: string;
  isActive?: boolean | 'all';
  page: number;
  pageSize: number;
}

export interface WorkOrderFilterParams {
  search?: string;
  machineId?: string;
  status?: WorkOrderStatus | 'all';
  priority?: WorkOrderPriority | 'all';
  type?: WorkOrderType | 'all';
  page: number;
  pageSize: number;
}

export interface MaintenanceMetrics {
  totalMachines: number;
  operationalMachines: number;
  inMaintenanceMachines: number;
  breakdownMachines: number;
  activeWorkOrders: number;
  totalPlannedPMs: number;
}

export type MaintenanceSpareStatus = 'safe' | 'low' | 'critical';

export interface MaintenanceSparePart {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  reorderPoint: number;
  standardCost: number;
  status: MaintenanceSpareStatus;
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseCode: string | null;
  lastTransactionAt: string | null;
}

export interface MaintenanceSparePartFilterParams {
  search?: string;
  status?: MaintenanceSpareStatus | 'all';
  page?: number;
  pageSize?: number;
}
