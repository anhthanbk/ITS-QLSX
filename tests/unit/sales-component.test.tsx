import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBadge } from '@/features/sales/components/sales-status-badge';
import { SalesMetricCards } from '@/features/sales/components/sales-metric-cards';
import { SalesOrderTable } from '@/features/sales/components/sales-order-table';
import { PurchaseOrderTable } from '@/features/sales/components/purchase-order-table';
import { CustomerTable } from '@/features/sales/components/customer-table';
import { SupplierTable } from '@/features/sales/components/supplier-table';
import { CustomerDeleteDialog } from '@/features/sales/components/customer-delete-dialog';
import { SupplierDeleteDialog } from '@/features/sales/components/supplier-delete-dialog';
import { SalesOrderDeleteDialog } from '@/features/sales/components/sales-order-delete-dialog';
import { PurchaseOrderDeleteDialog } from '@/features/sales/components/purchase-order-delete-dialog';
import { ProcurementRequestPanel } from '@/features/sales/components/procurement-request-panel';
import { PurchaseOrderFormDialog } from '@/features/sales/components/purchase-order-form-dialog';
import { PurchaseOrderReceiveDialog } from '@/features/sales/components/purchase-order-receive-dialog';
import type {
  SalesOrder,
  PurchaseOrder,
  Customer,
  Supplier,
  SalesMetrics,
  MaterialOption,
  ProcurementRequest,
} from '@/features/sales/types';

vi.mock('@/features/warehouse/hooks/use-warehouses', () => ({
  useWarehouses: () => ({
    data: {
      items: [
        { id: 'wh-1', code: 'KHO-VT', name: 'Kho Vật tư Tổng hợp' },
        { id: 'wh-2', code: 'KHO-NL', name: 'Kho Nhiên liệu' },
      ],
      total: 2,
    },
    isLoading: false,
  }),
}));

vi.mock('@/features/hr/hooks/use-departments', () => ({
  useDepartments: () => ({
    data: [
      { id: 'dept-1', code: 'PX-TK', name: 'Phân xưởng Tuyển khoáng' },
      { id: 'dept-2', code: 'PX-CK', name: 'Phân xưởng Cơ điện' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/components/feedback/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/features/sales/hooks/use-sales-queries', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePurchaseOrderDetail: () => ({
      data: null,
      isLoading: false,
    }),
    useReceivePurchaseOrder: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  };
});

describe('Sales & Purchase Component Tests', () => {
  const mockCustomer: Customer = {
    id: 'cust-1',
    code: 'KH-VIG',
    name: 'Kính Nổi Viglacera',
    tax_id: '0100106204',
    email: 'contact@viglacera.vn',
    phone: '0243556789',
    address: 'KCN Yên Phong',
    credit_limit: 2000000000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSupplier: Supplier = {
    id: 'supp-1',
    code: 'NCC-CR',
    name: 'Khoáng Sản Cam Ranh',
    tax_id: '4200456789',
    email: 'contact@camranh.vn',
    phone: '02583856123',
    address: 'Cam Ranh, Khánh Hòa',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSalesOrder: SalesOrder = {
    id: 'so-1',
    order_code: 'SO-2026-001',
    customer_id: 'cust-1',
    order_date: '2026-10-10',
    promised_delivery_date: '2026-10-25',
    currency: 'VND',
    subtotal_amount: 420000000,
    tax_amount: 42000000,
    total_amount: 462000000,
    status: 'confirmed',
    payment_terms: '30 ngày',
    notes: 'Hợp đồng cát S100',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: {
      id: 'cust-1',
      code: 'KH-VIG',
      name: 'Kính Nổi Viglacera',
      phone: '0243556789',
      email: 'contact@viglacera.vn',
    },
  };

  const mockPurchaseOrder: PurchaseOrder = {
    id: 'po-1',
    po_code: 'PO-2026-001',
    supplier_id: 'supp-1',
    order_date: '2026-10-08',
    expected_delivery_date: '2026-10-18',
    currency: 'VND',
    subtotal_amount: 400000000,
    tax_amount: 40000000,
    total_amount: 440000000,
    status: 'confirmed',
    payment_terms: '15 ngày sau nghiệm thu',
    notes: 'Thu mua cát nguyên khai',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplier: {
      id: 'supp-1',
      code: 'NCC-CR',
      name: 'Khoáng Sản Cam Ranh',
      phone: '02583856123',
      email: 'contact@camranh.vn',
    },
    items: [
      {
        id: 'poi-1',
        purchase_order_id: 'po-1',
        material_id: 'mat-1',
        quantity: 100,
        received_quantity: 20,
        unit_price: 22000,
        line_total: 2200000,
        created_at: new Date().toISOString(),
        material: {
          id: 'mat-1',
          code: 'DO-01',
          name: 'Dầu Diesel 0.05S (DO)',
          unit_of_measure: 'Lít',
        },
      },
    ],
  };

  const mockMetrics: SalesMetrics = {
    totalSalesOrders: 10,
    confirmedSalesOrders: 8,
    totalSalesAmount: 1500000000,
    totalCustomers: 5,
    totalPurchaseOrders: 8,
    confirmedPurchaseOrders: 6,
    totalPurchaseAmount: 950000000,
    totalSuppliers: 4,
  };

  describe('StatusBadge', () => {
    it('renders sales order status correctly', () => {
      const { rerender } = render(<StatusBadge status="confirmed" type="sales" />);
      expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();

      rerender(<StatusBadge status="delivered" type="sales" />);
      expect(screen.getByText('Đã giao hàng')).toBeInTheDocument();
    });

    it('renders purchase order status correctly', () => {
      render(<StatusBadge status="partially_received" type="purchase" />);
      expect(screen.getByText('Nhập một phần')).toBeInTheDocument();
    });

    it('renders partner status correctly', () => {
      const { rerender } = render(<StatusBadge status="active" type="partner" />);
      expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();

      rerender(<StatusBadge status="inactive" type="partner" />);
      expect(screen.getByText('Ngừng giao dịch')).toBeInTheDocument();
    });
  });

  describe('SalesMetricCards', () => {
    it('renders metrics data correctly', () => {
      render(<SalesMetricCards metrics={mockMetrics} isLoading={false} />);
      expect(screen.getByText('Tổng doanh thu bán')).toBeInTheDocument();
      expect(screen.getByText('Khách hàng B2B')).toBeInTheDocument();
      expect(screen.getByText('Tổng chi mua hàng')).toBeInTheDocument();
      expect(screen.getByText('Nhà cung cấp (NCC)')).toBeInTheDocument();
    });

    it('renders pulse skeletons when loading', () => {
      const { container } = render(<SalesMetricCards isLoading={true} />);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('SalesOrderTable', () => {
    it('renders list of sales orders and handles row actions', () => {
      const onViewDetail = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onStatusChange = vi.fn();

      render(
        <SalesOrderTable
          data={{
            items: [mockSalesOrder],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          canManage={true}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />,
      );

      expect(screen.getByText('SO-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Kính Nổi Viglacera')).toBeInTheDocument();

      const viewBtn = screen.getByTitle('Xem chi tiết đơn hàng');
      fireEvent.click(viewBtn);
      expect(onViewDetail).toHaveBeenCalledWith(mockSalesOrder);

      const editBtn = screen.getByTitle('Chỉnh sửa đơn hàng');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockSalesOrder);

      const deleteBtn = screen.getByTitle('Xóa đơn hàng');
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith(mockSalesOrder);
    });

    it('renders empty state when there are no sales orders', () => {
      render(
        <SalesOrderTable
          data={{ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 }}
          isLoading={false}
          isError={false}
          canManage={false}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />,
      );

      expect(screen.getByText('Không có đơn hàng nào')).toBeInTheDocument();
    });
  });

  describe('PurchaseOrderTable', () => {
    it('renders purchase orders and triggers actions', () => {
      const onViewDetail = vi.fn();
      const onEdit = vi.fn();

      render(
        <PurchaseOrderTable
          data={{
            items: [mockPurchaseOrder],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          canManage={true}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />,
      );

      expect(screen.getByText('PO-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Khoáng Sản Cam Ranh')).toBeInTheDocument();

      const viewBtn = screen.getByTitle('Xem chi tiết đơn mua');
      fireEvent.click(viewBtn);
      expect(onViewDetail).toHaveBeenCalledWith(mockPurchaseOrder);
    });

    it('renders receive button for confirmed purchase orders and calls onReceiveGoods', () => {
      const onReceiveGoods = vi.fn();
      render(
        <PurchaseOrderTable
          data={{
            items: [mockPurchaseOrder],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          canManage={true}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onReceiveGoods={onReceiveGoods}
          onStatusChange={vi.fn()}
        />,
      );

      const receiveBtn = screen.getByTitle('Nghiệm thu & Nhập kho hàng về');
      expect(receiveBtn).toBeInTheDocument();
      fireEvent.click(receiveBtn);
      expect(onReceiveGoods).toHaveBeenCalledWith(mockPurchaseOrder);
    });
  });

  describe('CustomerTable and SupplierTable', () => {
    it('renders customer list and interacts with actions', () => {
      const onEdit = vi.fn();
      render(
        <CustomerTable
          data={{
            items: [mockCustomer],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          canManage={true}
          filters={{ page: 1, pageSize: 10 }}
          onFilterChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByText('KH-VIG')).toBeInTheDocument();
      expect(screen.getByText('Kính Nổi Viglacera')).toBeInTheDocument();

      const editBtn = screen.getByTitle('Chỉnh sửa khách hàng');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockCustomer);
    });

    it('renders supplier list and interacts with actions', () => {
      const onEdit = vi.fn();
      render(
        <SupplierTable
          data={{
            items: [mockSupplier],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          canManage={true}
          filters={{ page: 1, pageSize: 10 }}
          onFilterChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByText('NCC-CR')).toBeInTheDocument();
      expect(screen.getByText('Khoáng Sản Cam Ranh')).toBeInTheDocument();

      const editBtn = screen.getByTitle('Chỉnh sửa thông tin NCC');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockSupplier);
    });
  });

  describe('Delete Dialogs', () => {
    it('calls onConfirm when confirming customer deletion', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <CustomerDeleteDialog
          isOpen={true}
          customer={mockCustomer}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText('Xác nhận xóa khách hàng')).toBeInTheDocument();
      const confirmBtn = screen.getByText('Xác nhận xóa');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });
      expect(onConfirm).toHaveBeenCalledWith(mockCustomer.id);
    });

    it('calls onConfirm when confirming supplier deletion', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <SupplierDeleteDialog
          isOpen={true}
          supplier={mockSupplier}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText('Xác nhận xóa nhà cung cấp')).toBeInTheDocument();
      const confirmBtn = screen.getByText('Xác nhận xóa');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });
      expect(onConfirm).toHaveBeenCalledWith(mockSupplier.id);
    });

    it('calls onConfirm when confirming sales order deletion', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <SalesOrderDeleteDialog
          isOpen={true}
          order={mockSalesOrder}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText('Xác nhận xóa đơn hàng')).toBeInTheDocument();
      const confirmBtn = screen.getByText('Xác nhận xóa');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });
      expect(onConfirm).toHaveBeenCalledWith(mockSalesOrder.id);
    });

    it('calls onConfirm when confirming purchase order deletion', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <PurchaseOrderDeleteDialog
          isOpen={true}
          order={mockPurchaseOrder}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByText('Xác nhận xóa đơn mua hàng')).toBeInTheDocument();
      const confirmBtn = screen.getByText('Xác nhận xóa');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });
      expect(onConfirm).toHaveBeenCalledWith(mockPurchaseOrder.id);
    });
  });

  describe('ProcurementRequestPanel', () => {
    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const mockMaterials: MaterialOption[] = [
      {
        id: 'mat-1',
        code: 'DO-01',
        name: 'Dầu Diesel 0.05S (DO)',
        unit_of_measure: 'Lít',
        standard_cost: 22000,
      },
      {
        id: 'mat-2',
        code: 'CNK-01',
        name: 'Cát nguyên khai (CNK)',
        unit_of_measure: 'Tấn',
        standard_cost: 200000,
      },
    ];

    it('renders PR items and allows converting approved PR to PO', () => {
      const onConvertToPO = vi.fn();

      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={onConvertToPO}
          />
        </QueryClientProvider>,
      );

      expect(screen.getByText('PR-2026-0081')).toBeInTheDocument();
      expect(screen.getByText('Dầu Diesel 0.05S (DO)')).toBeInTheDocument();

      // Find "Lập PO" button for approved PR
      const poButton = screen.getByText('Lập PO');
      fireEvent.click(poButton);
      expect(onConvertToPO).toHaveBeenCalled();
    });

    it('opens PR creation dialog with HR department, warehouse materials, and free-text custom material input', () => {
      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={vi.fn()}
          />
        </QueryClientProvider>,
      );

      const createBtn = screen.getByText('Lập phiếu PR');
      fireEvent.click(createBtn);

      expect(screen.getByText('Lập phiếu đề xuất mua sắm vật tư (PR)')).toBeInTheDocument();
      expect(screen.getAllByText('Bộ phận đề xuất').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Vật tư yêu cầu').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Chọn danh mục vật tư hoặc tự nhập/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Hoặc nhập tên vật tư / thiết bị mới cần mua...')).toBeInTheDocument();
    });

    it('submits PR with free-text custom material name', () => {
      const onCreateRequest = vi.fn();
      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={vi.fn()}
            onCreateRequest={onCreateRequest}
          />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByText('Lập phiếu PR'));

      const input = screen.getByPlaceholderText('Hoặc nhập tên vật tư / thiết bị mới cần mua...');
      fireEvent.change(input, { target: { value: 'Băng tải chịu nhiệt B800' } });

      const submitBtn = screen.getByText('Gửi đề xuất PR');
      fireEvent.click(submitBtn);

      expect(onCreateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          material_name: 'Băng tải chịu nhiệt B800',
          material_id: undefined,
        }),
      );
    });

    it('shows edit and delete actions when isAdmin is true, and calls onEditRequest', () => {
      const onEditRequest = vi.fn();
      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            isAdmin={true}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={vi.fn()}
            onEditRequest={onEditRequest}
          />
        </QueryClientProvider>,
      );

      const editButtons = screen.getAllByTitle('Sửa phiếu đề xuất (Admin)');
      const deleteButtons = screen.getAllByTitle('Xóa phiếu đề xuất (Admin)');
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);

      const firstEditBtn = editButtons[0];
      expect(firstEditBtn).toBeDefined();
      if (!firstEditBtn) return;
      fireEvent.click(firstEditBtn);
      expect(screen.getByText(/Chỉnh sửa phiếu đề xuất mua sắm/i)).toBeInTheDocument();

      const saveBtn = screen.getByText('Lưu thay đổi');
      fireEvent.click(saveBtn);
      expect(onEditRequest).toHaveBeenCalled();
    });

    it('opens delete confirmation and calls onDeleteRequest when confirmed', () => {
      const onDeleteRequest = vi.fn();
      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            isAdmin={true}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={vi.fn()}
            onDeleteRequest={onDeleteRequest}
          />
        </QueryClientProvider>,
      );

      const deleteButtons = screen.getAllByTitle('Xóa phiếu đề xuất (Admin)');
      const firstDeleteBtn = deleteButtons[0];
      expect(firstDeleteBtn).toBeDefined();
      if (!firstDeleteBtn) return;
      fireEvent.click(firstDeleteBtn);

      expect(screen.getByText('Xác nhận xóa phiếu đề xuất (PR)')).toBeInTheDocument();
      const confirmDeleteBtn = screen.getByText('Xác nhận xóa');
      fireEvent.click(confirmDeleteBtn);
      expect(onDeleteRequest).toHaveBeenCalledWith('pr-001');
    });

    it('does not show edit and delete buttons when isAdmin is false', () => {
      render(
        <QueryClientProvider client={testQueryClient}>
          <ProcurementRequestPanel
            canManage={true}
            canApprove={true}
            isAdmin={false}
            materials={mockMaterials}
            suppliers={[]}
            onConvertToPO={vi.fn()}
          />
        </QueryClientProvider>,
      );

      expect(screen.queryByTitle('Sửa phiếu đề xuất (Admin)')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Xóa phiếu đề xuất (Admin)')).not.toBeInTheDocument();
    });
  });

  describe('PurchaseOrderFormDialog with PR data', () => {
    const mockMaterials: MaterialOption[] = [
      {
        id: 'mat-1',
        code: 'DO-01',
        name: 'Dầu Diesel 0.05S (DO)',
        unit_of_measure: 'Lít',
        standard_cost: 22000,
      },
    ];

    const mockSourcePR: ProcurementRequest = {
      id: 'pr-test-1',
      pr_code: 'PR-2026-9999',
      department: 'Xưởng Tuyển Khoáng Cam Ranh',
      material_name: 'Dầu Diesel 0.05S (DO)',
      material_id: 'mat-1',
      quantity: 5000,
      unit_of_measure: 'Lít',
      estimated_cost: 110000000,
      required_date: '2026-10-30',
      priority: 'urgent',
      status: 'approved',
      requested_by: 'Nguyễn Văn Hải',
      reason: 'Dự phòng vận hành máy phát',
      created_at: new Date().toISOString(),
    };

    it('renders PR banner with material, cost, quantity, deadline, and priority in PO form', () => {
      render(
        <PurchaseOrderFormDialog
          isOpen={true}
          suppliers={[mockSupplier]}
          materials={mockMaterials}
          sourcePR={mockSourcePR}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      // Verify PR details banner
      expect(screen.getByText(/Phiếu đề xuất PR: PR-2026-9999/i)).toBeInTheDocument();
      expect(screen.getByText('Xưởng Tuyển Khoáng Cam Ranh')).toBeInTheDocument();
      expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
      expect(screen.getByText('5.000 Lít')).toBeInTheDocument();
      expect(screen.getByText('Vật tư yêu cầu')).toBeInTheDocument();
      expect(screen.getByText('Số lượng cần')).toBeInTheDocument();
      expect(screen.getByText('Đơn giá / Dự toán')).toBeInTheDocument();
      expect(screen.getByText('Hạn cần vật tư')).toBeInTheDocument();
    });
  });

  describe('PurchaseOrderReceiveDialog (2 Kịch bản Bàn giao & Nhập kho)', () => {
    it('renders dialog with order details and 2 handover scenarios', () => {
      render(
        <PurchaseOrderReceiveDialog
          isOpen={true}
          order={mockPurchaseOrder}
          onClose={vi.fn()}
        />,
      );

      // Verify title & PO code
      expect(screen.getByText(/Nghiệm thu & Nhập kho theo đơn PO:/i)).toBeInTheDocument();
      expect(screen.getByText('PO-2026-001')).toBeInTheDocument();

      // Verify 2 scenarios are present
      expect(screen.getByText(/Kịch bản 1: Nhập kho dự trữ/i)).toBeInTheDocument();
      expect(screen.getByText(/Kịch bản 2: Bàn giao xuất dùng ngay/i)).toBeInTheDocument();

      // Verify material row details
      expect(screen.getByText('Dầu Diesel 0.05S (DO)')).toBeInTheDocument();
      expect(screen.getAllByText('100').length).toBeGreaterThan(0); // ordered & received after current receipt
      expect(screen.getByText('20')).toBeInTheDocument(); // received so far
      expect(screen.getAllByText('80').length).toBeGreaterThan(0); // remaining in table and summary

      // Verify full warehouse receipt fields
      expect(screen.getByText(/Mã phiếu nhập \(PNK\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Ngày nhập kho/i)).toBeInTheDocument();
      expect(screen.getByText(/Mã đợt \/ Kỳ sản xuất/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng hợp giá trị phiếu nhập kho/i)).toBeInTheDocument();
    });

    it('toggles direct issue fields when scenario 2 is selected', () => {
      render(
        <PurchaseOrderReceiveDialog
          isOpen={true}
          order={mockPurchaseOrder}
          onClose={vi.fn()}
        />,
      );

      // Initially scenario 1 (warehouse) is active
      expect(screen.queryByText(/Bộ phận tiếp nhận bàn giao/i)).not.toBeInTheDocument();

      // Click scenario 2 (direct issue)
      const directIssueRadio = screen.getByText(/Kịch bản 2: Bàn giao xuất dùng ngay/i);
      fireEvent.click(directIssueRadio);

      // Now department and equipment fields should be visible
      expect(screen.getByText(/Bộ phận tiếp nhận bàn giao/i)).toBeInTheDocument();
      expect(screen.getByText(/Vị trí máy móc \/ Thiết bị sử dụng/i)).toBeInTheDocument();
      expect(screen.getByText(/Người nhận bàn giao/i)).toBeInTheDocument();
    });

    it('fills remaining quantity when "Nhận đủ" button is clicked', () => {
      render(
        <PurchaseOrderReceiveDialog
          isOpen={true}
          order={mockPurchaseOrder}
          onClose={vi.fn()}
        />,
      );

      const fillMaxBtn = screen.getByText('Nhận đủ');
      fireEvent.click(fillMaxBtn);

      const [qtyInput] = screen.getAllByRole('spinbutton');
      expect((qtyInput as HTMLInputElement).value).toBe('80');
    });

    it('renders header correctly even when order is passed without items', () => {
      const orderWithoutItems: PurchaseOrder = {
        ...mockPurchaseOrder,
        items: undefined,
      };

      render(
        <PurchaseOrderReceiveDialog
          isOpen={true}
          order={orderWithoutItems}
          onClose={vi.fn()}
        />,
      );

      // Verify PO header is still shown correctly
      expect(screen.getByText(/Nghiệm thu & Nhập kho theo đơn PO:/i)).toBeInTheDocument();
      expect(screen.getByText('PO-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Khoáng Sản Cam Ranh')).toBeInTheDocument();
    });

    it('dynamically increases "Đã nhận" and decreases "Còn lại" as user changes actual received quantity', () => {
      render(
        <PurchaseOrderReceiveDialog
          isOpen={true}
          order={mockPurchaseOrder}
          onClose={vi.fn()}
        />,
      );

      // Initially mockPurchaseOrder: ordered 100, previous received 20, remainingBefore 80.
      // Default currentQty is 80 (nhận đủ):
      // totalReceivedAfter = 20 + 80 = 100
      // remainingAfter = 0 -> "Đủ (0)"
      expect(screen.getByText(/Đủ \(0\)/i)).toBeInTheDocument();

      // Change actual received quantity to 10
      const [qtyInput] = screen.getAllByRole('spinbutton');
      expect(qtyInput).toBeDefined();
      fireEvent.change(qtyInput!, { target: { value: '10' } });

      // After entering 10:
      // totalReceivedAfter = 20 + 10 = 30
      // remainingAfter = 100 - 30 = 70
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText(/Trước:/i)).toBeInTheDocument();

      // Change actual received quantity to 0
      fireEvent.change(qtyInput!, { target: { value: '0' } });
      // totalReceivedAfter = 20 + 0 = 20
      // remainingAfter = 100 - 20 = 80
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getAllByText('80').length).toBeGreaterThan(0);
    });
  });
});

