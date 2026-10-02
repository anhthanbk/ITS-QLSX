import { supabase } from '@/lib/supabase/client';
import type {
  Employee,
  Department,
  Position,
  EmployeeFilterParams,
  PaginatedResult,
  PendingRegistration,
  ApproveRegistrationParams,
  RejectRegistrationParams,
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
      profiles:profiles!profiles_employee_id_fkey(id, avatar_url, date_of_birth, id_card_number, full_name)
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

  const rawRows = (data ?? []) as unknown as Array<
    Employee & {
      profiles?:
        | {
            id: string;
            avatar_url: string | null;
            date_of_birth: string | null;
            id_card_number: string | null;
            full_name: string | null;
          }
        | Array<{
            id: string;
            avatar_url: string | null;
            date_of_birth: string | null;
            id_card_number: string | null;
            full_name: string | null;
          }>
        | null;
    }
  >;

  const mappedEmployees = rawRows.map((emp) => {
    const prof = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
    return {
      ...emp,
      avatar_url: prof?.avatar_url ?? null,
      date_of_birth: prof?.date_of_birth ?? null,
      id_card_number: prof?.id_card_number ?? null,
      profile_id: prof?.id ?? null,
    };
  });

  return {
    data: mappedEmployees,
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
      direct_manager:direct_manager_id(id, first_name, last_name, employee_code),
      profiles:profiles!profiles_employee_id_fkey(id, avatar_url, date_of_birth, id_card_number, full_name)
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Failed to fetch employee ${id}:`, error);
    throw new Error(error.message);
  }

  const emp = data as unknown as Employee & {
    profiles?:
      | {
          id: string;
          avatar_url: string | null;
          date_of_birth: string | null;
          id_card_number: string | null;
          full_name: string | null;
        }
      | Array<{
          id: string;
          avatar_url: string | null;
          date_of_birth: string | null;
          id_card_number: string | null;
          full_name: string | null;
        }>
      | null;
  };

  const prof = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;

  return {
    ...emp,
    avatar_url: prof?.avatar_url ?? null,
    date_of_birth: prof?.date_of_birth ?? null,
    id_card_number: prof?.id_card_number ?? null,
    profile_id: prof?.id ?? null,
  };
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
 * Updates an existing employee and synchronized profile.
 */
export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<Employee> {
  const { error } = await supabase.rpc('admin_update_employee_with_profile', {
    p_employee_id: id,
    p_first_name: values.first_name.trim(),
    p_last_name: values.last_name.trim(),
    p_email: values.email?.trim() || '',
    p_phone: values.phone?.trim() || '',
    p_department_id: values.department_id,
    p_position_id: values.position_id,
    p_direct_manager_id: values.direct_manager_id || null,
    p_hire_date: values.hire_date,
    p_status: values.status,
    p_date_of_birth: values.date_of_birth?.trim() || undefined,
    p_id_card_number: values.id_card_number?.trim() || undefined,
    p_avatar_url: values.avatar_url?.trim() || undefined,
    p_new_password: values.new_password?.trim() || undefined,
  });

  if (error) {
    console.error(`Failed to update employee ${id}:`, error);
    throw new Error(error.message);
  }

  const updated = await fetchEmployeeById(id);
  if (!updated) {
    throw new Error('Không thể tải lại thông tin nhân viên sau cập nhật.');
  }

  return updated;
}

/**
 * Resets an employee user password directly (Admin only).
 */
export async function adminResetEmployeePassword(userId: string, newPassword: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_reset_user_password', {
    p_user_id: userId,
    p_new_password: newPassword.trim(),
  });

  if (error) {
    console.error('Failed to reset password:', error);
    throw new Error(error.message);
  }

  return !!data;
}

/**
 * Deletes or deactivates an employee and completely removes login access from auth.users.
 */
export async function deleteEmployee(id: string): Promise<{ success: boolean; mode: string }> {
  const { data, error } = await supabase.rpc('admin_delete_employee_and_account', {
    p_employee_id: id,
  });

  if (error) {
    console.error(`Failed to delete employee ${id}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as { success: boolean; mode: string };
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
 * Fetches all pending/rejected employee registrations awaiting admin approval.
 */
export async function fetchPendingRegistrations(): Promise<PendingRegistration[]> {
  const { data, error } = await supabase.rpc('get_pending_registrations');

  if (error) {
    console.error('Failed to fetch pending registrations:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as PendingRegistration[];
}

/**
 * Approves a candidate registration, creates official employee record, and activates account.
 */
export async function approveRegistration(
  params: ApproveRegistrationParams,
): Promise<{ success: boolean; employee_id: string; employee_code: string }> {
  const { data, error } = await supabase.rpc('admin_approve_registration', {
    p_profile_id: params.profileId,
    p_employee_code: params.employeeCode.trim(),
    p_role_code: params.roleCode,
    p_hire_date: params.hireDate,
    p_department_id: params.departmentId || undefined,
    p_position_id: params.positionId || undefined,
    p_direct_manager_id: params.directManagerId || undefined,
  });

  if (error) {
    console.error('Failed to approve registration:', error);
    throw new Error(error.message);
  }

  return data as unknown as { success: boolean; employee_id: string; employee_code: string };
}

/**
 * Rejects a candidate registration with a required reason.
 */
export async function rejectRegistration(
  params: RejectRegistrationParams,
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('admin_reject_registration', {
    p_profile_id: params.profileId,
    p_reason: params.reason.trim(),
  });

  if (error) {
    console.error('Failed to reject registration:', error);
    throw new Error(error.message);
  }

  return data as unknown as { success: boolean };
}

/**
 * Fetches all system roles for assignment.
 */
export async function fetchRoles(): Promise<Array<{ id: string; code: string; name: string; description: string | null }>> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, code, name, description')
    .order('name');

  if (error) {
    console.error('Failed to fetch roles:', error);
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Array<{ id: string; code: string; name: string; description: string | null }>;
}

/**
 * Completely deletes a pending or rejected registration profile and its auth user.
 */
export async function deleteRegistrationProfile(profileId: string): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('admin_delete_registration_profile', {
    p_profile_id: profileId,
  });

  if (error) {
    console.error(`Failed to delete registration profile ${profileId}:`, error);
    throw new Error(error.message);
  }

  return data as unknown as { success: boolean };
}



