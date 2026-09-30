import { supabase } from '@/lib/supabase/client';
import type {
  Employee,
  Department,
  Position,
  EmployeeFilterParams,
  PaginatedResult,
} from '../types';
import type {
  EmployeeFormValues,
  DepartmentFormValues,
  PositionFormValues,
} from '../validation/hr-schemas';

/**
 * Fetches paginated employees with explicit column projection and joined relations.
 */
export async function fetchEmployees(
  params: EmployeeFilterParams,
): Promise<PaginatedResult<Employee>> {
  const { search, departmentId, positionId, status, page, pageSize } = params;

  let query = supabase
    .from('employees')
    .select(
      `
      id,
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position_id,
      direct_manager_id,
      hire_date,
      status,
      created_at,
      updated_at,
      departments:department_id(id, name, code),
      positions:position_id(id, title, code, level),
      direct_manager:direct_manager_id(id, first_name, last_name, employee_code)
    `,
      { count: 'exact' },
    );

  // Filter by department
  if (departmentId && departmentId !== 'all') {
    query = query.eq('department_id', departmentId);
  }

  // Filter by position
  if (positionId && positionId !== 'all') {
    query = query.eq('position_id', positionId);
  }

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Full text search by code, name, or email
  if (search && search.trim() !== '') {
    const term = search.trim();
    query = query.or(
      `employee_code.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  // Server-side pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch employees:', error);
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Cast through unknown to resolve PostgREST joined relation types
  return {
    data: (data ?? []) as unknown as Employee[],
    totalCount,
    page,
    pageSize,
    totalPages: totalPages > 0 ? totalPages : 1,
  };
}

/**
 * Fetches a single employee by ID.
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(
      `
      id,
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position_id,
      direct_manager_id,
      hire_date,
      status,
      created_at,
      updated_at,
      departments:department_id(id, name, code),
      positions:position_id(id, title, code, level),
      direct_manager:direct_manager_id(id, first_name, last_name, employee_code)
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Failed to fetch employee ${id}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as Employee;
}

/**
 * Creates a new employee record.
 */
export async function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  const payload = {
    employee_code: values.employee_code.trim().toUpperCase(),
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    department_id: values.department_id,
    position_id: values.position_id,
    direct_manager_id: values.direct_manager_id || null,
    hire_date: values.hire_date,
    status: values.status,
  };

  const { data, error } = await supabase
    .from('employees')
    .insert(payload)
    .select(
      `
      id,
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position_id,
      direct_manager_id,
      hire_date,
      status,
      created_at,
      updated_at
    `,
    )
    .single();

  if (error) {
    console.error('Failed to create employee:', error);
    throw new Error(error.message);
  }

  return data as unknown as Employee;
}

/**
 * Updates an existing employee.
 */
export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<Employee> {
  const payload = {
    employee_code: values.employee_code.trim().toUpperCase(),
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    department_id: values.department_id,
    position_id: values.position_id,
    direct_manager_id: values.direct_manager_id || null,
    hire_date: values.hire_date,
    status: values.status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select(
      `
      id,
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position_id,
      direct_manager_id,
      hire_date,
      status,
      created_at,
      updated_at
    `,
    )
    .single();

  if (error) {
    console.error(`Failed to update employee ${id}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as Employee;
}

/**
 * Deletes or deactivates an employee.
 */
export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);

  if (error) {
    console.error(`Failed to delete employee ${id}:`, error);
    throw new Error(error.message);
  }
}

/**
 * Fetches all departments for dropdowns and listing.
 */
export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select(
      `
      id,
      code,
      name,
      parent_id,
      manager_employee_id,
      status,
      created_at,
      updated_at,
      manager:manager_employee_id(id, first_name, last_name, employee_code)
    `,
    )
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch departments:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Department[];
}

/**
 * Creates a department.
 */
export async function createDepartment(values: DepartmentFormValues): Promise<Department> {
  const payload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    parent_id: values.parent_id || null,
    status: values.status,
  };

  const { data, error } = await supabase
    .from('departments')
    .insert(payload)
    .select('id, code, name, parent_id, manager_employee_id, status, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to create department:', error);
    throw new Error(error.message);
  }

  return data as unknown as Department;
}

/**
 * Updates a department.
 */
export async function updateDepartment(
  id: string,
  values: DepartmentFormValues,
): Promise<Department> {
  const payload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    parent_id: values.parent_id || null,
    status: values.status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('departments')
    .update(payload)
    .eq('id', id)
    .select('id, code, name, parent_id, manager_employee_id, status, created_at, updated_at')
    .single();

  if (error) {
    console.error(`Failed to update department ${id}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as Department;
}

/**
 * Fetches all positions, optionally filtered by department.
 */
export async function fetchPositions(departmentId?: string): Promise<Position[]> {
  let query = supabase
    .from('positions')
    .select(
      `
      id,
      code,
      title,
      department_id,
      level,
      created_at,
      updated_at,
      department:department_id(id, name, code)
    `,
    )
    .order('level', { ascending: false });

  if (departmentId && departmentId !== 'all') {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch positions:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Position[];
}

/**
 * Creates a position.
 */
export async function createPosition(values: PositionFormValues): Promise<Position> {
  const payload = {
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    department_id: values.department_id,
    level: values.level,
  };

  const { data, error } = await supabase
    .from('positions')
    .insert(payload)
    .select('id, code, title, department_id, level, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to create position:', error);
    throw new Error(error.message);
  }

  return data as unknown as Position;
}
