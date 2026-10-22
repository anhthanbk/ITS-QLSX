import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductionQRCodeSvg } from '@/features/production/components/production-qr-code-svg';
import { ProductionAreaChecklistModal } from '@/features/production/components/production-area-checklist-modal';
import { ProductionQuickIncidentDialog } from '@/features/production/components/production-quick-incident-dialog';
import { ProductionPatrolHistoryTable } from '@/features/production/components/production-patrol-history-table';
import { ProductionPatrolAreaDialog } from '@/features/production/components/production-patrol-area-dialog';
import { MachineDetailModal } from '@/features/maintenance/components/machine-detail-modal';
import type { Machine } from '@/features/maintenance/types';
import type { PatrolArea, PatrolLog, AvailableMachineItem } from '@/features/production/types';

vi.mock('@/features/auth/hooks/use-permissions', () => ({
  usePermissions: () => ({
    isAdmin: true,
    hasRole: () => true,
    hasPermission: () => true,
    hasAnyPermission: () => true,
  }),
}));

vi.mock('@/components/feedback/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockArea: PatrolArea = {
  id: 'area-1',
  area_code: 'KV-01-CAPLIEU',
  name: 'Trạm cấp liệu thô & Nghiền sơ cấp',
  line_id: 'line-1',
  line_name: 'Dây chuyền Tuyển rửa 01',
  qr_code: 'ITS-AREA-KV01',
  description: 'Phễu cấp liệu và búa nghiền',
  order_index: 1,
  is_active: true,
  machines: [
    {
      id: 'pam-1',
      machine_id: 'm-1',
      machine_code: 'MC-CRUSH-01',
      machine_name: 'Máy nghiền búa sơ cấp',
      sort_order: 1,
      inspection_notes: 'Kiểm tra nhiệt độ gối bi < 75°C',
    },
  ],
};

const mockLogs: PatrolLog[] = [
  {
    id: 'log-1',
    area_id: 'area-1',
    area_code: 'KV-01-CAPLIEU',
    area_name: 'Trạm cấp liệu thô',
    shift_id: null,
    scanned_at: '2026-10-17T08:30:00.000Z',
    inspector_name: 'Nguyễn Văn An',
    has_issue: false,
    checked_machines_count: 1,
    notes: 'Vận hành ổn định',
    created_at: '2026-10-17T08:30:00.000Z',
    incidents: [],
  },
  {
    id: 'log-2',
    area_id: 'area-1',
    area_code: 'KV-01-CAPLIEU',
    area_name: 'Trạm cấp liệu thô',
    shift_id: null,
    scanned_at: '2026-10-17T09:15:00.000Z',
    inspector_name: 'Trần Văn Bình',
    has_issue: true,
    checked_machines_count: 1,
    notes: 'Phát hiện sự cố',
    created_at: '2026-10-17T09:15:00.000Z',
    incidents: [
      {
        id: 'inc-1',
        incident_code: 'SC-202610-1001',
        patrol_log_id: 'log-2',
        area_id: 'area-1',
        machine_id: 'm-1',
        machine_code: 'MC-CRUSH-01',
        machine_name: 'Máy nghiền búa sơ cấp',
        shift_id: null,
        reported_at: '2026-10-17T09:15:00.000Z',
        reporter_name: 'Trần Văn Bình',
        condition_type: 'Rung ồn bất thường',
        description: 'Vòng bi kêu rít nhẹ khi nạp quặng lớn',
        resolution_type: 'maintenance_scheduled',
        maintenance_work_order_id: 'wo-1',
        incident_image_url: 'https://example.com/incident-photo-1.jpg',
        resolution_image_url: 'https://example.com/resolution-photo-1.jpg',
        status: 'reported',
        created_at: '2026-10-17T09:15:00.000Z',
        updated_at: '2026-10-17T09:15:00.000Z',
      },
    ],
  },
];

describe('Production Patrol & QR Incident Components', () => {
  it('renders ProductionQRCodeSvg with SVG element and correct dimensions', () => {
    const { container } = render(<ProductionQRCodeSvg value="ITS-AREA-KV01" size={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('renders ProductionAreaChecklistModal with machine checklist and confirms normal inspection', async () => {
    const onConfirmNormal = vi.fn().mockResolvedValue(undefined);
    const onOpenReportIncident = vi.fn();

    render(
      <ProductionAreaChecklistModal
        isOpen={true}
        onClose={vi.fn()}
        area={mockArea}
        inspectorName="Nguyễn Văn An"
        onInspectorNameChange={vi.fn()}
        onConfirmNormal={onConfirmNormal}
        onOpenReportIncident={onOpenReportIncident}
        isConfirming={false}
      />,
    );

    expect(screen.getByText('Trạm cấp liệu thô & Nghiền sơ cấp')).toBeInTheDocument();
    expect(screen.getByText('MC-CRUSH-01')).toBeInTheDocument();
    expect(screen.getByText(/Kiểm tra nhiệt độ gối bi/i)).toBeInTheDocument();

    // Click confirm normal button
    const confirmBtn = screen.getByText(/Xác nhận tất cả thiết bị bình thường/i);
    fireEvent.click(confirmBtn);

    expect(onConfirmNormal).toHaveBeenCalledWith(
      expect.objectContaining({
        area_id: 'area-1',
        inspector_name: 'Nguyễn Văn An',
        checked_machines_count: 1,
      }),
    );
  });

  it('renders ProductionQuickIncidentDialog with 3 resolution options and submits report', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProductionQuickIncidentDialog
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          isSubmitting={false}
          area={mockArea}
          allAreas={[mockArea]}
          preselectedMachine={mockArea.machines?.[0]}
          defaultReporterName="Trần Văn Bình"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Báo cáo sự cố thiết bị nhanh')).toBeInTheDocument();
    expect(screen.getByText('Đã xử lý tại chỗ')).toBeInTheDocument();
    expect(screen.getByText('Xử lý tạm thời')).toBeInTheDocument();
    expect(screen.getByText('Lập kế hoạch bảo dưỡng')).toBeInTheDocument();

    // Verify presence of photo upload cards
    expect(screen.getByText(/Chụp \/ Chọn ảnh sự cố/i)).toBeInTheDocument();
    expect(screen.getByText(/Chụp \/ Chọn ảnh sau xử lý/i)).toBeInTheDocument();

    // Select maintenance scheduled
    const maintenanceBtn = screen.getByText('Lập kế hoạch bảo dưỡng');
    fireEvent.click(maintenanceBtn);

    // Type description
    const descInput = screen.getByPlaceholderText(/Mô tả cụ thể vị trí/i);
    fireEvent.change(descInput, { target: { value: 'Rung lắc mạnh ổ đỡ búa nghiền' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Gửi báo cáo sự cố/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        area_id: 'area-1',
        machine_id: 'm-1',
        description: 'Rung lắc mạnh ổ đỡ búa nghiền',
        resolution_type: 'maintenance_scheduled',
      }),
    );
  });

  it('renders ProductionPatrolHistoryTable with summary KPIs and log rows', () => {
    render(
      <ProductionPatrolHistoryTable
        logs={mockLogs}
        areas={[mockArea]}
        totalCount={2}
        currentPage={1}
        totalPages={1}
        filters={{ page: 1, pageSize: 15 }}
        onFilterChange={vi.fn()}
        isLoading={false}
        onOpenScanner={vi.fn()}
        onOpenQuickIncident={vi.fn()}
        onOpenPrintQr={vi.fn()}
        onOpenCreateArea={vi.fn()}
      />,
    );

    expect(screen.getByText('Tổng lượt tuần kiểm')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ bình thường')).toBeInTheDocument();
    expect(screen.getByText('Bình thường')).toBeInTheDocument();
    expect(screen.getAllByText('Phát hiện sự cố').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đưa vào bảo dưỡng/i).length).toBeGreaterThan(0);

    // Verify presence of incident and resolution photo buttons
    const incidentPhotoBtn = screen.getByText('Ảnh sự cố');
    expect(incidentPhotoBtn).toBeInTheDocument();
    const resolutionPhotoBtn = screen.getByText('Sau khắc phục');
    expect(resolutionPhotoBtn).toBeInTheDocument();

    // Click incident photo button to verify Lightbox opens
    fireEvent.click(incidentPhotoBtn);
    expect(screen.getByText(/Ảnh sự cố \[MC-CRUSH-01\] SC-202610-1001/i)).toBeInTheDocument();
  });

  it('renders ProductionPatrolAreaDialog for creating a new patrol area with QR preview', () => {
    const mockAvailableMachines: AvailableMachineItem[] = [
      { id: 'm-1', machine_code: 'T01', name: 'Máy tuyển rửa xoắn T01', line_id: 'line-1', status: 'running' },
      { id: 'm-2', machine_code: 'T03', name: 'Máy tuyển từ T03', line_id: 'line-1', status: 'running' },
    ];

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductionPatrolAreaDialog
        isOpen={true}
        onClose={vi.fn()}
        lines={[
          {
            id: 'line-1',
            name: 'Dây chuyền 01',
            code: 'DC-01',
            department_id: null,
            designed_capacity_tph: 50,
            standard_shift_hours: 8,
            shifts_per_day: 3,
            status: 'active',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ]}
        availableMachines={mockAvailableMachines}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText('Tạo mới Khu vực tuần kiểm & Mã QR')).toBeInTheDocument();
    expect(screen.getByText(/Nội dung mã QR/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Mã khu vực/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tên khu vực tuần kiểm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Thiết bị phụ trách/i)).toBeInTheDocument();

    // Check adding a machine to area by clicking machine item
    const machineItem = screen.getByText('Máy tuyển rửa xoắn T01');
    fireEvent.click(machineItem);

    // Verify machine is added to list and inspection note section appears
    expect(screen.getByText(/Nội dung tuần kiểm chi tiết từng máy/i)).toBeInTheDocument();
    expect(screen.getByText(/Thiết bị phụ trách \(1\)/i)).toBeInTheDocument();
  });

  it('renders MachineDetailModal with dual-view for patrol incidents and work orders in history tab', () => {
    const mockMachine: Machine = {
      id: 'm-1',
      machine_code: 'MC-CRUSH-01',
      name: 'Máy nghiền búa sơ cấp',
      line_id: 'line-1',
      department_id: null,
      model: 'MB-500',
      serial_number: 'SN-001',
      line_location: 'Khu vực 1',
      rated_capacity_per_hour: 50,
      power_rating_kw: 75,
      installation_date: '2025-01-01',
      status: 'operational',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MachineDetailModal
          machine={mockMachine}
          isOpen={true}
          onClose={vi.fn()}
          onEdit={vi.fn()}
          canManage={true}
          initialTab="orders"
        />
      </QueryClientProvider>,
    );

    // Verify subtab header label
    expect(screen.getByText(/Lịch sử sửa chữa & Sự cố/i)).toBeInTheDocument();

    // Verify segmented buttons
    expect(screen.getByText(/Sự cố tuần kiểm hiện trường/i)).toBeInTheDocument();
    expect(screen.getByText(/Phiếu sửa chữa Cơ điện/i)).toBeInTheDocument();

    // Click work orders view
    const workOrdersTab = screen.getByText(/Phiếu sửa chữa Cơ điện/i);
    fireEvent.click(workOrdersTab);

    expect(screen.getByText(/Chưa có phiếu sửa chữa nào/i)).toBeInTheDocument();
  });
});



