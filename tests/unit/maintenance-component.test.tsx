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
});
