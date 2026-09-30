import { supabase } from '@/lib/supabase/client';
import type {
  Employee,
  Department,
  Position,
  EmployeeFilterParams,
  PaginatedResult,
  SystemRole,
  ProvisionAccountParams,
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
      direct_manager:direct_manager_id(id, first_name, last_name, employee_code),
      profiles(id, status, user_roles(role_id, roles(id, code, name)))
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

  // Map PostgREST relation to Employee model with account
  interface RawUserRole {
    roles?: {
      id: string;
      code: string;
      name: string;
    } | null;
  }

  interface RawProfile {
    id: string;
    status: 'active' | 'suspended';
    user_roles?: RawUserRole[] | null;
  }

  interface RawEmployeeRecord extends Omit<Employee, 'account'> {
    profiles?: RawProfile | RawProfile[] | null;
  }

  const mappedData: Employee[] = ((data ?? []) as unknown as RawEmployeeRecord[]).map((emp) => {
    const rawProfile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
    let account = null;
    if (rawProfile) {
      const roles = (rawProfile.user_roles ?? [])
        .map((ur) => ur.roles)
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
      account = {
        id: rawProfile.id,
        status: rawProfile.status,
        roles,
      };
    }
    return {
      ...emp,
      account,
    };
  });

  return {
    data: mappedData,
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

  // Option C: If create_account is selected, provision user account via secure RPC
  if (values.create_account && values.email && values.account_password) {
    const { error: rpcError } = await supabase.rpc(
      'admin_provision_employee_account',
      {
        p_employee_id: data.id,
        p_email: values.email.trim().toLowerCase(),
        p_password: values.account_password,
        p_role_code: values.account_role || 'operator',
      },
    );

    if (rpcError) {
      console.error('Account provision RPC failed:', rpcError);
      throw new Error(
        `Đã tạo hồ sơ nhân viên, nhưng cấp tài khoản thất bại: ${rpcError.message}`,
      );
    }
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

/**
 * Deletes a department with referential integrity error handling.
 */
export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id);

  if (error) {
    console.error(`Failed to delete department ${id}:`, error);
    if (error.code === '23503') {
      throw new Error(
        'Không thể xóa phòng ban do đang có chức danh, nhân viên hoặc máy móc liên kết. Vui lòng chuyển hoặc xóa liên kết trước.',
      );
    }
    throw new Error(error.message);
  }
}

/**
 * Updates a position.
 */
export async function updatePosition(
  id: string,
  values: PositionFormValues,
): Promise<Position> {
  const payload = {
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    department_id: values.department_id,
    level: values.level,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('positions')
    .update(payload)
    .eq('id', id)
    .select('id, code, title, department_id, level, created_at, updated_at')
    .single();

  if (error) {
    console.error(`Failed to update position ${id}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as Position;
}

/**
 * Deletes a position with referential integrity error handling.
 */
export async function deletePosition(id: string): Promise<void> {
  const { error } = await supabase.from('positions').delete().eq('id', id);

  if (error) {
    console.error(`Failed to delete position ${id}:`, error);
    if (error.code === '23503') {
      throw new Error('Không thể xóa chức danh do đang có nhân viên giữ vị trí này.');
    }
    throw new Error(error.message);
  }
}

/**
 * Provisions or links an account for an existing employee.
 */
export async function provisionEmployeeAccount(
  params: ProvisionAccountParams,
): Promise<{ user_id: string; email: string; role_code: string }> {
  const { data, error } = await supabase.rpc('admin_provision_employee_account', {
    p_employee_id: params.employeeId,
    p_email: params.email.trim().toLowerCase(),
    p_password: params.password || 'P@ssword123',
    p_role_code: params.roleCode,
  });

  if (error) {
    console.error('Failed to provision employee account:', error);
    throw new Error(error.message);
  }

  return data as unknown as { user_id: string; email: string; role_code: string };
}

/**
 * Unlinks an account from an employee.
 */
export async function unlinkEmployeeAccount(employeeId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unlink_employee_account', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Failed to unlink employee account:', error);
    throw new Error(error.message);
  }
}

/**
 * Toggles user account status (active vs suspended).
 */
export async function toggleUserStatus(
  userId: string,
  status: 'active' | 'suspended',
): Promise<void> {
  const { error } = await supabase.rpc('admin_toggle_user_status', {
    p_user_id: userId,
    p_status: status,
  });

  if (error) {
    console.error('Failed to toggle user status:', error);
    throw new Error(error.message);
  }
}

/**
 * Changes a user's system role.
 */
export async function changeUserRole(
  userId: string,
  roleCode: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_change_user_role', {
    p_user_id: userId,
    p_new_role_code: roleCode,
  });

  if (error) {
    console.error('Failed to change user role:', error);
    throw new Error(error.message);
  }
}

/**
 * Resets a user's password.
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_reset_user_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  });

  if (error) {
    console.error('Failed to reset user password:', error);
    throw new Error(error.message);
  }
}

/**
 * Fetches all system roles for assignment.
 */
export async function fetchRoles(): Promise<SystemRole[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, code, name, description')
    .order('name');

  if (error) {
    console.error('Failed to fetch roles:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as SystemRole[];
}


