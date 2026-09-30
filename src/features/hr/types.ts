export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  manager_employee_id: string | null;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  } | null;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  department_id: string;
  level: number;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department_id: string;
  position_id: string;
  direct_manager_id: string | null;
  hire_date: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
  departments?: {
    id: string;
    name: string;
    code: string;
  };
  positions?: {
    id: string;
    title: string;
    code: string;
    level: number;
  };
  direct_manager?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
  } | null;
  account?: {
    id: string;
    status: 'active' | 'suspended';
    roles: Array<{
      id?: string;
      code: string;
      name: string;
    }>;
  } | null;
}

export interface SystemRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface ProvisionAccountParams {
  employeeId: string;
  email: string;
  password?: string;
  roleCode: string;
}


export interface EmployeeFilterParams {
  search?: string;
  departmentId?: string;
  positionId?: string;
  status?: EmployeeStatus | 'all';
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
