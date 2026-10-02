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
  avatar_url?: string | null;
  date_of_birth?: string | null;
  id_card_number?: string | null;
  profile_id?: string | null;
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
  profiles?: {
    id: string;
    avatar_url: string | null;
    date_of_birth: string | null;
    id_card_number: string | null;
    full_name: string | null;
  } | null;
}

export interface PendingRegistration {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  id_card_number: string | null;
  department_id: string | null;
  position_id: string | null;
  temp_employee_code: string | null;
  status: 'pending' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  department_name: string | null;
  department_code: string | null;
  position_title: string | null;
  position_code: string | null;
}

export interface ApproveRegistrationParams {
  profileId: string;
  employeeCode: string;
  roleCode: string;
  hireDate: string;
  departmentId?: string;
  positionId?: string;
  directManagerId?: string;
}

export interface RejectRegistrationParams {
  profileId: string;
  reason: string;
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
