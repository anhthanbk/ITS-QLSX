import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeTable } from '@/features/hr/components/employee-table';
import type { Employee, PaginatedResult } from '@/features/hr/types';

// Mock Auth context hook
vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@its-qlsx.vn', roles: [{ code: 'admin', name: 'Admin' }] },
    hasRole: () => true,
    hasPermission: () => true,
  }),
}));

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employee_code: 'EMP-001',
    first_name: 'An',
    last_name: 'Nguyễn Văn',
    email: 'an.nguyen@its-qlsx.vn',
    phone: '0901234567',
    department_id: 'dept-1',
    position_id: 'pos-1',
    direct_manager_id: null,
    hire_date: '2026-01-15',
    status: 'active',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    departments: { id: 'dept-1', name: 'Phòng Sản Xuất', code: 'SX' },
    positions: { id: 'pos-1', title: 'Quản Đốc Phân Xưởng', code: 'QD_SX', level: 4 },
  },
  {
    id: 'emp-2',
    employee_code: 'EMP-002',
    first_name: 'Mai',
    last_name: 'Trần Thị',
    email: 'mai.tran@its-qlsx.vn',
    phone: '0912345678',
    department_id: 'dept-2',
    position_id: 'pos-2',
    direct_manager_id: null,
    hire_date: '2026-02-01',
    status: 'on_leave',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    departments: { id: 'dept-2', name: 'Phòng KCS', code: 'KCS' },
    positions: { id: 'pos-2', title: 'Nhân Viên KCS', code: 'NV_KCS', level: 2 },
  },
];

const mockPaginatedData: PaginatedResult<Employee> = {
  data: mockEmployees,
  totalCount: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe('EmployeeTable UI Component', () => {
  it('renders employee table with headers and data rows', () => {
    render(
      <EmployeeTable
        data={mockPaginatedData}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onPageChange={() => {}}
        onViewDetail={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText('EMP-001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Phòng Sản Xuất')).toBeInTheDocument();
    expect(screen.getByText('Quản Đốc Phân Xưởng')).toBeInTheDocument();
    expect(screen.getByText('Đang làm việc')).toBeInTheDocument();

    expect(screen.getByText('EMP-002')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ phép')).toBeInTheDocument();
  });

  it('renders empty state when data has 0 rows', () => {
    render(
      <EmployeeTable
        data={{ data: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 }}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onPageChange={() => {}}
        onViewDetail={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText('Chưa có nhân viên nào')).toBeInTheDocument();
  });

  it('triggers onViewDetail callback when Eye icon is clicked', async () => {
    const user = userEvent.setup();
    const onViewDetail = vi.fn();

    render(
      <EmployeeTable
        data={mockPaginatedData}
        isLoading={false}
        isError={false}
        onRetry={() => {}}
        onPageChange={() => {}}
        onViewDetail={onViewDetail}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    const viewButtons = screen.getAllByTitle('Xem chi tiết');
    await user.click(viewButtons[0]!);

    expect(onViewDetail).toHaveBeenCalledWith(mockEmployees[0]);
  });
});
