import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MachineTable } from '@/features/maintenance/components/machine-table';
import { MaintenanceMetricCards } from '@/features/maintenance/components/maintenance-metric-cards';
import { MachineFilterBar } from '@/features/maintenance/components/machine-filter-bar';
import type { Machine, PaginatedResult } from '@/features/maintenance/types';

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@its-qlsx.vn', roles: [{ code: 'admin', name: 'Admin' }] },
    hasRole: () => true,
    hasPermission: () => true,
  }),
}));

const mockMachines: Machine[] = [
  {
    id: 'm-1',
    machine_code: 'MC-CRUSH-01',
    name: 'Máy nghiền búa sơ cấp MB-01',
    line_id: 'line-1',
    department_id: 'dept-1',
    model: 'MB-800',
    serial_number: 'SN-CRUSH-889',
    line_location: 'Trạm nghiền sơ cấp',
    rated_capacity_per_hour: 60,
    power_rating_kw: 110,
    installation_date: '2024-03-15',
    status: 'operational',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
    production_lines: { id: 'line-1', name: 'Dây chuyền tuyển từ 01', code: 'LINE-01' },
    departments: { id: 'dept-1', name: 'Phòng Bảo Trì Cơ Điện', code: 'BT' },
  },
  {
    id: 'm-2',
    machine_code: 'MC-CONV-03',
    name: 'Băng tải cấp liệu BC-03',
    line_id: 'line-1',
    department_id: 'dept-1',
    model: 'BC-B800',
    serial_number: 'SN-CONV-442',
    line_location: 'Khu vực cấp liệu phễu rung',
    rated_capacity_per_hour: 80,
    power_rating_kw: 15,
    installation_date: '2024-04-10',
    status: 'breakdown',
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
    production_lines: { id: 'line-1', name: 'Dây chuyền tuyển từ 01', code: 'LINE-01' },
    departments: { id: 'dept-1', name: 'Phòng Bảo Trì Cơ Điện', code: 'BT' },
  },
];

const mockPaginatedData: PaginatedResult<Machine> = {
  data: mockMachines,
  totalCount: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe('Maintenance Components', () => {
  describe('MachineTable', () => {
    it('renders loading state when isLoading is true', () => {
      const { container } = render(
        <MachineTable
          isLoading={true}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      const pulse = container.querySelector('.animate-pulse');
      expect(pulse).toBeTruthy();
    });

    it('renders error state and handles retry click', async () => {
      const onRetryMock = vi.fn();
      render(
        <MachineTable
          isLoading={false}
          isError={true}
          onRetry={onRetryMock}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      expect(screen.getByText('Không thể tải dữ liệu thiết bị')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /thử lại/i });
      await userEvent.click(retryBtn);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('renders empty state when data array is empty', () => {
      render(
        <MachineTable
          data={{ data: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      expect(screen.getByText('Chưa có thiết bị nào')).toBeInTheDocument();
    });

    it('renders table rows with machine data and badges', () => {
      render(
        <MachineTable
          data={mockPaginatedData}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      expect(screen.getByText('MC-CRUSH-01')).toBeInTheDocument();
      expect(screen.getByText('Máy nghiền búa sơ cấp MB-01')).toBeInTheDocument();
      expect(screen.getByText('Đang vận hành')).toBeInTheDocument();

      expect(screen.getByText('MC-CONV-03')).toBeInTheDocument();
      expect(screen.getByText('Băng tải cấp liệu BC-03')).toBeInTheDocument();
      expect(screen.getByText('Sự cố / Hỏng')).toBeInTheDocument();
    });

    it('triggers view, edit, and delete action callbacks', async () => {
      const onViewMock = vi.fn();
      const onEditMock = vi.fn();
      const onDeleteMock = vi.fn();

      render(
        <MachineTable
          data={mockPaginatedData}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={onViewMock}
          onEdit={onEditMock}
          onDelete={onDeleteMock}
          canManage={true}
        />,
      );

      const viewBtns = screen.getAllByTitle('Xem chi tiết');
      await userEvent.click(viewBtns[0]!);
      expect(onViewMock).toHaveBeenCalledWith(mockMachines[0]);

      const editBtns = screen.getAllByTitle('Chỉnh sửa');
      await userEvent.click(editBtns[0]!);
      expect(onEditMock).toHaveBeenCalledWith(mockMachines[0]);

      const deleteBtns = screen.getAllByTitle('Xóa thiết bị');
      await userEvent.click(deleteBtns[0]!);
      expect(onDeleteMock).toHaveBeenCalledWith(mockMachines[0]);
    });
  });

  describe('MaintenanceMetricCards', () => {
    it('renders metrics data correctly', () => {
      render(
        <MaintenanceMetricCards
          isLoading={false}
          metrics={{
            totalMachines: 15,
            operationalMachines: 12,
            inMaintenanceMachines: 2,
            breakdownMachines: 1,
            activeWorkOrders: 4,
            totalPlannedPMs: 8,
          }}
        />,
      );

      expect(screen.getByText('Tổng số thiết bị')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('MachineFilterBar', () => {
    it('handles search input and status changes', async () => {
      const onSearchMock = vi.fn();
      const onStatusMock = vi.fn();
      const onResetMock = vi.fn();
      const onOpenCreateMock = vi.fn();

      render(
        <MachineFilterBar
          search=""
          status="all"
          onSearchChange={onSearchMock}
          onStatusChange={onStatusMock}
          onReset={onResetMock}
          canCreate={true}
          onOpenCreate={onOpenCreateMock}
        />,
      );

      const input = screen.getByPlaceholderText(/tìm theo mã tb/i);
      await userEvent.type(input, 'CRUSH');
      expect(onSearchMock).toHaveBeenCalled();

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'operational');
      expect(onStatusMock).toHaveBeenCalledWith('operational');

      const createBtn = screen.getByRole('button', { name: /thêm thiết bị/i });
      await userEvent.click(createBtn);
      expect(onOpenCreateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('SparePartsTab', () => {
    it('renders spare parts linked with warehouse inventory and displays KPI summaries', async () => {
      const { MemoryRouter } = await import('react-router-dom');
      const { SparePartsTab } = await import('@/features/maintenance/components/spare-parts-tab');

      // Mock useMaintenanceSpareParts hook
      vi.mock('@/features/maintenance/hooks/use-spare-parts', () => ({
        useMaintenanceSpareParts: () => ({
          data: {
            data: [
              {
                id: 'sp-1',
                code: 'SP-BEAR-6312',
                name: 'Vòng bi SKF 6312',
                category: 'Phụ tùng cơ điện',
                unit: 'Cái',
                currentStock: 12,
                reservedStock: 2,
                availableStock: 10,
                minStock: 4,
                reorderPoint: 6,
                standardCost: 450000,
                status: 'safe',
                warehouseId: 'wh-pt',
                warehouseName: 'Kho Phụ Tùng Cơ Điện (K-PT)',
                warehouseCode: 'K-PT',
                lastTransactionAt: '2026-10-01T00:00:00Z',
              },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 15,
            totalPages: 1,
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        }),
      }));

      render(
        <MemoryRouter>
          <SparePartsTab />
        </MemoryRouter>
      );

      expect(screen.getByText('Kho Phụ Tùng & Vật Tư Tiêu Hao Thiết Bị')).toBeInTheDocument();
      expect(screen.getByText('SP-BEAR-6312')).toBeInTheDocument();
      expect(screen.getByText('Vòng bi SKF 6312')).toBeInTheDocument();
      expect(screen.getByText('Kho Phụ Tùng Cơ Điện (K-PT)')).toBeInTheDocument();
      expect(screen.getAllByText('An toàn').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Xem Kho Tổng')).toBeInTheDocument();
    });
  });

  describe('AdjustmentsTab with Admin Actions', () => {
    it('renders adjustments with Edit and Delete buttons for Admin user', async () => {
      const { AdjustmentsTab } = await import('@/features/maintenance/components/adjustments-tab');

      vi.mock('@/features/maintenance/hooks/use-machine-adjustments', () => ({
        useMachineAdjustments: () => ({
          data: {
            data: [
              {
                id: 'adj-1',
                machine_id: 'm-1',
                status_before: 'operational',
                status_after: 'operational',
                operating_condition_before: 'Băng tải rung lắc khi tải cao',
                improvement_content: 'Gia cố khung đỡ và thay thế bạc đạn SKF',
                result: 'Thiết bị hoạt động êm ái, triệt tiêu độ rung',
                applied_to_machine: true,
                performed_at: '2026-10-01',
                created_at: '2026-10-01T08:00:00Z',
                machines: { id: 'm-1', machine_code: 'MC-CRUSH-01', name: 'Máy nghiền búa sơ cấp MB-01' },
                profiles: { id: 'tech-1', full_name: 'Nguyễn Văn Kỹ Thuật' },
              },
            ],
            totalCount: 1,
            totalPages: 1,
          },
          isLoading: false,
          isError: false,
        }),
        useCreateMachineAdjustment: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
        useUpdateMachineAdjustment: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
        useDeleteMachineAdjustment: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      }));

      vi.mock('@/features/maintenance/hooks/use-machines', () => ({
        useMachineOptions: () => ({
          data: [{ id: 'm-1', machine_code: 'MC-CRUSH-01', name: 'Máy nghiền búa sơ cấp MB-01', status: 'operational' }],
        }),
      }));

      render(<AdjustmentsTab canManage={true} />);

      expect(screen.getByText('Nhật Ký Điều Chỉnh & Cải Tiến Thiết Bị')).toBeInTheDocument();
      expect(screen.getByText('Gia cố khung đỡ và thay thế bạc đạn SKF')).toBeInTheDocument();

      // Admin should see Sửa and Xóa buttons
      const editButton = screen.getByTitle('Sửa cải tiến thiết bị');
      const deleteButton = screen.getByTitle('Xóa cải tiến thiết bị');
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();

      // Click Edit button and verify edit dialog opens
      await userEvent.click(editButton);
      expect(screen.getByText('Chỉnh Sửa Cải Tiến & Điều Chỉnh Thiết Bị')).toBeInTheDocument();
      expect(screen.getByText('Lưu thay đổi')).toBeInTheDocument();

      // Close edit dialog
      const closeBtn = screen.getByRole('button', { name: /đóng/i });
      await userEvent.click(closeBtn);

      // Click Delete button and verify delete dialog opens
      await userEvent.click(deleteButton);
      expect(screen.getByText('Xóa Nhật Ký Cải Tiến Thiết Bị')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /xác nhận xóa/i })).toBeInTheDocument();
    });
  });
});
