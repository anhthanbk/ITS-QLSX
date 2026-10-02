import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseTable } from '@/features/warehouse/components/warehouse-table';
import { WarehouseMetricCards } from '@/features/warehouse/components/warehouse-metric-cards';
import { WarehouseFilterBar } from '@/features/warehouse/components/warehouse-filter-bar';
import { MaterialCatalogTable, MaterialCategoryBadge } from '@/features/warehouse/components/material-catalog-table';
import { MaterialFormDialog } from '@/features/warehouse/components/material-form-dialog';
import { ProductCatalogTable } from '@/features/warehouse/components/product-catalog-table';
import { ProductFormDialog } from '@/features/warehouse/components/product-form-dialog';
import { ProductDeleteDialog } from '@/features/warehouse/components/product-delete-dialog';
import { TransactionFormDialog } from '@/features/warehouse/components/transaction-form-dialog';
import { TransactionTable } from '@/features/warehouse/components/transaction-table';
import { TransactionDeleteDialog } from '@/features/warehouse/components/transaction-delete-dialog';
import {
  WarehouseStatusBadge,
  WarehouseTypeBadge,
  TransactionTypeBadge,
  ItemTypeBadge,
  ProductTypeBadge,
  ProductStatusBadge,
} from '@/features/warehouse/components/warehouse-badges';
import type {
  Warehouse,
  PaginatedResult,
  InventoryTransaction,
  InventoryStockBalance,
  ProductCatalogItem,
} from '@/features/warehouse/types';
import { StockBalanceTable } from '@/features/warehouse/components/stock-balance-table';

vi.mock('@/features/warehouse/hooks/use-stock-balances', () => ({
  useItemOptions: () => ({
    data: [
      {
        id: 'item-1',
        code: 'NVL-001',
        name: 'Quặng Bauxite Thô Loại 1',
        item_type: 'material',
        category: 'raw_material',
        category_label: 'Nguyên vật liệu chính',
        unit: 'tấn',
        cost: 650000,
      },
      {
        id: 'item-2',
        code: 'HC-001',
        name: 'Xút vảy NaOH 99%',
        item_type: 'material',
        category: 'chemical',
        category_label: 'Hóa chất công nghiệp',
        unit: 'tấn',
        cost: 14500000,
      },
      {
        id: 'item-3',
        code: 'PT-001',
        name: 'Con lăn băng tải B800',
        item_type: 'material',
        category: 'spare_part',
        category_label: 'Phụ tùng & Linh kiện cơ điện',
        unit: 'cái',
        cost: 450000,
      },
      {
        id: 'item-4',
        code: 'TP-001',
        name: 'Alumina Cát Mịn 98.6%',
        item_type: 'product',
        category: 'finished_good',
        category_label: 'Thành phẩm sản xuất',
        unit: 'tấn',
        cost: 8900000,
      },
      {
        id: 'item-5',
        code: 'PP-001',
        name: 'Bùn đỏ lắng bô-xít phơi khô',
        item_type: 'byproduct',
        category: 'by_product',
        category_label: 'Phụ phẩm thu hồi',
        unit: 'tấn',
        cost: 120000,
      },
    ],
  }),
  useItemAggregatedStockBalances: () => ({
    data: [
      {
        item_id: 'item-1',
        item_code: 'NVL-001',
        item_name: 'Quặng Bauxite Thô Loại 1',
        item_type: 'material',
        category: 'raw_material',
        category_label: 'Nguyên vật liệu chính',
        unit_of_measure: 'tấn',
        total_inbound: 1500,
        total_outbound: 300,
        total_current_quantity: 1200,
        total_reserved_quantity: 0,
        total_available_quantity: 1200,
        warehouse_count: 2,
        warehouses: [
          {
            warehouse_id: 'wh-1',
            warehouse_code: 'K-NVL',
            warehouse_name: 'Kho Nguyên Vật Liệu Chính',
            current_quantity: 800,
            reserved_quantity: 0,
            available_quantity: 800,
            total_inbound: 1000,
            total_outbound: 200,
            last_transaction_at: '2026-10-01T08:00:00Z',
          },
          {
            warehouse_id: 'wh-2',
            warehouse_code: 'K-TG',
            warehouse_name: 'Kho Trung Gian Số 2',
            current_quantity: 400,
            reserved_quantity: 0,
            available_quantity: 400,
            total_inbound: 500,
            total_outbound: 100,
            last_transaction_at: '2026-10-01T09:00:00Z',
          },
        ],
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'K-NVL',
    name: 'Kho Nguyên Vật Liệu Chính',
    warehouse_type: 'raw_material',
    location: 'Khu A - Xưởng nghiền',
    manager_employee_id: 'emp-1',
    manager_name: 'Trần Đức Cường',
    status: 'active',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'wh-2',
    code: 'K-TP',
    name: 'Kho Thành Phẩm Alumina',
    warehouse_type: 'finished_goods',
    location: 'Khu B - Cảng xuất',
    manager_employee_id: null,
    manager_name: null,
    status: 'inactive',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
];

const mockPaginatedData: PaginatedResult<Warehouse> = {
  data: mockWarehouses,
  totalCount: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe('Warehouse Components', () => {
  describe('WarehouseBadges', () => {
    it('renders status badges correctly', () => {
      const { rerender } = render(<WarehouseStatusBadge status="active" />);
      expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();

      rerender(<WarehouseStatusBadge status="inactive" />);
      expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
    });

    it('renders warehouse type badges correctly', () => {
      const { rerender } = render(<WarehouseTypeBadge type="raw_material" />);
      expect(screen.getByText('Kho nguyên liệu')).toBeInTheDocument();

      rerender(<WarehouseTypeBadge type="finished_goods" />);
      expect(screen.getByText('Kho thành phẩm')).toBeInTheDocument();

      rerender(<WarehouseTypeBadge type="spare_parts" />);
      expect(screen.getByText('Kho phụ tùng')).toBeInTheDocument();
    });

    it('renders transaction and item type badges', () => {
      render(
        <div>
          <TransactionTypeBadge type="inbound_receipt" />
          <TransactionTypeBadge type="production_issue" />
          <ItemTypeBadge type="material" />
        </div>
      );
      expect(screen.getByText('Nhập mua hàng')).toBeInTheDocument();
      expect(screen.getByText('Xuất sản xuất')).toBeInTheDocument();
      expect(screen.getByText('Nguyên vật liệu')).toBeInTheDocument();
    });

    it('renders granular commodity classification badges correctly', () => {
      const { rerender } = render(<ItemTypeBadge type="material" category="raw_material" />);
      expect(screen.getByText('Nguyên vật liệu chính')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="material" category="chemical" />);
      expect(screen.getByText('Hóa chất công nghiệp')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="material" category="spare_part" />);
      expect(screen.getByText('Phụ tùng cơ điện')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="material" category="other" />);
      expect(screen.getByText('Vật tư phụ trợ')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="product" category="finished_good" />);
      expect(screen.getByText('Thành phẩm')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="product" category="semi_finished" />);
      expect(screen.getByText('Bán thành phẩm')).toBeInTheDocument();

      rerender(<ItemTypeBadge type="byproduct" category="by_product" />);
      expect(screen.getByText('Phụ phẩm')).toBeInTheDocument();
    });
  });

  describe('WarehouseMetricCards', () => {
    it('renders metric values correctly', () => {
      render(
        <WarehouseMetricCards
          metrics={{
            totalWarehouses: 5,
            activeWarehouses: 4,
            totalStockItems: 12,
            totalTransactionsCount: 150,
          }}
          isLoading={false}
        />
      );

      expect(screen.getByText('Tổng số kho')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Kho hoạt động')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Danh mục mặt hàng tồn')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('shows loading placeholders when loading', () => {
      const { container } = render(<WarehouseMetricCards isLoading={true} />);
      const pulses = container.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });
  });

  describe('WarehouseFilterBar', () => {
    it('calls filter handlers and allows reset', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();
      const onWarehouseTypeChange = vi.fn();
      const onStatusChange = vi.fn();
      const onReset = vi.fn();
      const onOpenCreate = vi.fn();

      render(
        <WarehouseFilterBar
          search="test"
          onSearchChange={onSearchChange}
          warehouseType="raw_material"
          onWarehouseTypeChange={onWarehouseTypeChange}
          status="active"
          onStatusChange={onStatusChange}
          onReset={onReset}
          onOpenCreate={onOpenCreate}
          canManage={true}
        />
      );

      // Search input interaction
      const searchInput = screen.getByPlaceholderText(/Tìm theo mã kho/i);
      expect(searchInput).toHaveValue('test');
      await user.type(searchInput, 'a');
      expect(onSearchChange).toHaveBeenCalled();

      // Reset button click
      const resetBtn = screen.getByRole('button', { name: /Đặt lại/i });
      await user.click(resetBtn);
      expect(onReset).toHaveBeenCalled();

      // Create button click
      const createBtn = screen.getByRole('button', { name: /Thêm kho mới/i });
      await user.click(createBtn);
      expect(onOpenCreate).toHaveBeenCalled();
    });
  });

  describe('WarehouseTable', () => {
    it('renders warehouses in table rows', () => {
      render(
        <WarehouseTable
          data={mockPaginatedData}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />
      );

      expect(screen.getByText('K-NVL')).toBeInTheDocument();
      expect(screen.getByText('Kho Nguyên Vật Liệu Chính')).toBeInTheDocument();
      expect(screen.getByText('K-TP')).toBeInTheDocument();
      expect(screen.getByText('Kho Thành Phẩm Alumina')).toBeInTheDocument();
      expect(screen.getByText('Trần Đức Cường')).toBeInTheDocument();
    });

    it('triggers view, edit and delete callbacks', async () => {
      const user = userEvent.setup();
      const onViewDetail = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <WarehouseTable
          data={mockPaginatedData}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          canManage={true}
        />
      );

      const viewBtns = screen.getAllByTitle('Xem chi tiết');
      await user.click(viewBtns[0]!);
      expect(onViewDetail).toHaveBeenCalledWith(mockWarehouses[0]);

      const editBtns = screen.getAllByTitle('Chỉnh sửa');
      await user.click(editBtns[0]!);
      expect(onEdit).toHaveBeenCalledWith(mockWarehouses[0]);

      const deleteBtns = screen.getAllByTitle('Xóa kho');
      await user.click(deleteBtns[0]!);
      expect(onDelete).toHaveBeenCalledWith(mockWarehouses[0]);
    });

    it('renders empty state when list is empty', () => {
      render(
        <WarehouseTable
          data={{ data: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
          onOpenCreate={vi.fn()}
        />
      );

      expect(screen.getByText('Chưa có kho nào')).toBeInTheDocument();
    });

    it('renders error state with retry button', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <WarehouseTable
          isLoading={false}
          isError={true}
          onRetry={onRetry}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />
      );

      expect(screen.getByText('Không thể tải danh sách kho')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
      await user.click(retryBtn);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('MaterialCatalogTable', () => {
    it('renders category badges correctly', () => {
      const { rerender } = render(<MaterialCategoryBadge category="raw_material" />);
      expect(screen.getByText('Nguyên vật liệu')).toBeInTheDocument();

      rerender(<MaterialCategoryBadge category="chemical" />);
      expect(screen.getByText('Hóa chất xử lý')).toBeInTheDocument();

      rerender(<MaterialCategoryBadge category="spare_part" />);
      expect(screen.getByText('Phụ tùng cơ điện')).toBeInTheDocument();
    });

    it('renders materials with current stock and alert badges', () => {
      const mockMaterials = [
        {
          id: 'mat-1',
          code: 'SP-BEAR-6312',
          name: 'Vòng bi SKF 6312',
          category: 'spare_part',
          unit_of_measure: 'Cái',
          min_stock_level: 4,
          max_stock_level: 20,
          reorder_point: 6,
          standard_cost: 450000,
          status: 'active',
          total_stock: 12,
          created_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 'mat-2',
          code: 'SP-BELT-B128',
          name: 'Dây curoa Bando',
          category: 'spare_part',
          unit_of_measure: 'Sợi',
          min_stock_level: 6,
          max_stock_level: 30,
          reorder_point: 8,
          standard_cost: 180000,
          status: 'active',
          total_stock: 3,
          created_at: '2026-10-01T00:00:00Z',
        },
      ];

      render(
        <MaterialCatalogTable
          data={{
            data: mockMaterials,
            totalCount: 2,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('SP-BEAR-6312')).toBeInTheDocument();
      expect(screen.getByText('Vòng bi SKF 6312')).toBeInTheDocument();
      expect(screen.getByText('An toàn')).toBeInTheDocument();
      expect(screen.getByText('Cần mua gấp')).toBeInTheDocument();
    });

    it('renders create button and action buttons when canManage is true', async () => {
      const user = userEvent.setup();
      const onOpenCreate = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const mockMaterials = [
        {
          id: 'mat-1',
          code: 'SP-BEAR-6312',
          name: 'Vòng bi SKF 6312',
          category: 'spare_part',
          unit_of_measure: 'Cái',
          min_stock_level: 4,
          max_stock_level: 20,
          reorder_point: 6,
          standard_cost: 450000,
          status: 'active',
          total_stock: 12,
          created_at: '2026-10-01T00:00:00Z',
        },
      ];

      render(
        <MaterialCatalogTable
          data={{
            data: mockMaterials,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          selectedCategory="all"
          onCategoryChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          canManage={true}
          onOpenCreate={onOpenCreate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      const createBtn = screen.getByRole('button', { name: /Thêm vật tư mới/i });
      expect(createBtn).toBeInTheDocument();
      await user.click(createBtn);
      expect(onOpenCreate).toHaveBeenCalledTimes(1);

      const editBtn = screen.getByTitle('Chỉnh sửa vật tư');
      await user.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockMaterials[0]);

      const deleteBtn = screen.getByTitle('Xóa vật tư');
      await user.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith(mockMaterials[0]);
    });
  });

  describe('MaterialFormDialog', () => {
    it('renders add dialog with all fields and submits', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <MaterialFormDialog
          isOpen={true}
          onClose={onClose}
          materialToEdit={null}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Thêm vật tư mới vào danh mục')).toBeInTheDocument();
      const codeInput = screen.getByPlaceholderText('VD: NVL-004, SP-BEAR-6312');
      const nameInput = screen.getByPlaceholderText('VD: Quặng Bauxite thô Loại 1 hoặc Vòng bi SKF 6312 2Z/C3');
      const unitInput = screen.getByPlaceholderText('VD: tấn, kg, Cái, Bộ, Sợi, Lít...');

      fireEvent.change(codeInput, { target: { value: 'NVL-999' } });
      fireEvent.change(nameInput, { target: { value: 'Vat tu thu nghiem' } });
      fireEvent.change(unitInput, { target: { value: 'kg' } });

      const submitBtn = screen.getByRole('button', { name: 'Thêm vật tư' });
      fireEvent.submit(submitBtn.closest('form')!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('TransactionFormDialog', () => {
    it('renders with comprehensive commodity classification options and filters items', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <TransactionFormDialog
          isOpen={true}
          onClose={onClose}
          warehouses={mockWarehouses}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // Verify dialog header
      expect(screen.getByText('Lập phiếu giao dịch kho')).toBeInTheDocument();

      // Verify commodity classification selector exists with comprehensive categories
      const categorySelect = screen.getByLabelText(/Phân loại mặt hàng/i);
      expect(categorySelect).toHaveTextContent(/Nguyên vật liệu chính/i);
      expect(categorySelect).toHaveTextContent(/Hóa chất công nghiệp/i);
      expect(categorySelect).toHaveTextContent(/Phụ tùng & Linh kiện cơ điện/i);
      expect(categorySelect).toHaveTextContent(/Vật tư phụ trợ khác/i);
      expect(categorySelect).toHaveTextContent(/Thành phẩm sản xuất/i);
      expect(categorySelect).toHaveTextContent(/Phụ phẩm thu hồi/i);

      // Switch category to Chemical
      await user.selectOptions(categorySelect, 'chemical');
      expect(screen.getByText(/\[Hóa chất công nghiệp\] HC-001 - Xút vảy NaOH 99%/i)).toBeInTheDocument();
      expect(screen.queryByText(/Quặng Bauxite Thô/i)).not.toBeInTheDocument();

      // Switch category to By-product
      await user.selectOptions(categorySelect, 'by_product');
      expect(screen.getByText(/\[Phụ phẩm thu hồi\] PP-001 - Bùn đỏ lắng bô-xít phơi khô/i)).toBeInTheDocument();
      expect(screen.queryByText(/Xút vảy NaOH/i)).not.toBeInTheDocument();

      // Switch to Spare Parts
      await user.selectOptions(categorySelect, 'spare_part');
      expect(screen.getByText(/\[Phụ tùng & Linh kiện cơ điện\] PT-001 - Con lăn băng tải B800/i)).toBeInTheDocument();

      // Submit transaction
      const submitBtn = screen.getByRole('button', { name: /Tạo phiếu giao dịch/i });
      fireEvent.submit(submitBtn.closest('form')!);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            item_type: 'material',
            item_id: 'item-3',
          })
        );
      });
    });

    it('renders in edit mode with prefilled values and submit button', async () => {
      const mockTxToEdit: InventoryTransaction = {
        id: 'tx-edit-1',
        transaction_number: 'TX-20261001-9999',
        warehouse_id: 'wh-1',
        warehouse_code: 'K-NVL',
        warehouse_name: 'Kho Nguyên Vật Liệu Chính',
        item_type: 'material',
        category: 'chemical',
        category_label: 'Hóa chất công nghiệp',
        item_id: 'item-2',
        item_code: 'HC-001',
        item_name: 'Xút vảy NaOH 99%',
        transaction_type: 'inbound_receipt',
        quantity: 50,
        unit_cost: 14500000,
        reference_doc_type: null,
        reference_doc_id: null,
        notes: 'Phiếu nhập xút lô 1',
        created_by: 'user-1',
        created_by_name: 'Admin',
        created_at: '2026-10-01T00:00:00Z',
      };

      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <TransactionFormDialog
          isOpen={true}
          onClose={onClose}
          warehouses={mockWarehouses}
          transactionToEdit={mockTxToEdit}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // Verify title shows transaction number in edit mode
      expect(screen.getByText('Chỉnh sửa phiếu TX-20261001-9999')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeInTheDocument();
    });

    it('renders null and does not show popup when isOpen is false', () => {
      const { container } = render(
        <TransactionFormDialog
          isOpen={false}
          onClose={vi.fn()}
          warehouses={mockWarehouses}
          onSubmit={vi.fn()}
          isSubmitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText(/Lập phiếu giao dịch kho/i)).not.toBeInTheDocument();
    });
  });

  describe('TransactionTable with Admin Actions', () => {
    const mockTxList: InventoryTransaction[] = [
      {
        id: 'tx-1',
        transaction_number: 'TX-20261001-0001',
        warehouse_id: 'wh-1',
        warehouse_code: 'K-NVL',
        warehouse_name: 'Kho Nguyên Vật Liệu Chính',
        item_type: 'material',
        category: 'raw_material',
        category_label: 'Nguyên vật liệu chính',
        item_id: 'item-1',
        item_code: 'NVL-001',
        item_name: 'Quặng Bauxite Thô Loại 1',
        transaction_type: 'inbound_receipt',
        quantity: 100,
        unit_cost: 650000,
        reference_doc_type: null,
        reference_doc_id: null,
        notes: 'Nhập mua đầu kỳ',
        created_by: 'user-1',
        created_by_name: 'Admin',
        created_at: '2026-10-01T08:00:00Z',
        unit_of_measure: 'tấn',
        balance_after_transaction: 100,
      },
    ];

    it('renders edit and delete buttons when canManageTransactions is true', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <TransactionTable
          data={{
            data: mockTxList,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedTxType="all"
          onTxTypeChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          startDate=""
          onStartDateChange={vi.fn()}
          endDate=""
          onEndDateChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onOpenCreateTx={vi.fn()}
          canTransact={true}
          canManageTransactions={true}
          onEditTransaction={onEdit}
          onDeleteTransaction={onDelete}
        />
      );

      expect(screen.getByText('Thao tác')).toBeInTheDocument();
      const editBtn = screen.getByTitle('Chỉnh sửa phiếu giao dịch');
      const deleteBtn = screen.getByTitle('Xóa phiếu giao dịch');
      expect(editBtn).toBeInTheDocument();
      expect(deleteBtn).toBeInTheDocument();

      await user.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockTxList[0]);

      await user.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith(mockTxList[0]);
    });

    it('does not render edit/delete buttons when canManageTransactions is false', () => {
      render(
        <TransactionTable
          data={{
            data: mockTxList,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedTxType="all"
          onTxTypeChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          startDate=""
          onStartDateChange={vi.fn()}
          endDate=""
          onEndDateChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onOpenCreateTx={vi.fn()}
          canTransact={true}
          canManageTransactions={false}
        />
      );

      expect(screen.queryByText('Thao tác')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Chỉnh sửa phiếu giao dịch')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Xóa phiếu giao dịch')).not.toBeInTheDocument();
    });

    it('toggles row expansion to display transaction details when row is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TransactionTable
          data={{
            data: mockTxList,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedTxType="all"
          onTxTypeChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          startDate=""
          onStartDateChange={vi.fn()}
          endDate=""
          onEndDateChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onOpenCreateTx={vi.fn()}
          canTransact={true}
          canManageTransactions={true}
        />
      );

      // Headers
      expect(screen.getByText('Phát sinh')).toBeInTheDocument();
      expect(screen.getByText('Tồn sau phiếu')).toBeInTheDocument();
      expect(screen.getAllByText('100').length).toBeGreaterThan(0);

      // Initially, detailed sections are hidden
      expect(screen.queryByText(/Chi tiết phiếu giao dịch TX-20261001-0001/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Giá trị & Hạch toán/i)).not.toBeInTheDocument();

      // Click on the row
      const txNumber = screen.getByText('TX-20261001-0001');
      await user.click(txNumber);

      // Detail card is now visible
      expect(screen.getByText(/Chi tiết phiếu giao dịch TX-20261001-0001/i)).toBeInTheDocument();
      expect(screen.getByText(/Phát sinh & Tồn tức thời/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn sau phiếu:/i)).toBeInTheDocument();
      expect(screen.getByText(/Giá trị & Hạch toán/i)).toBeInTheDocument();
      expect(screen.getByText(/Nhập mua đầu kỳ/i)).toBeInTheDocument();

      // Click again to collapse
      await user.click(txNumber);
      expect(screen.queryByText(/Chi tiết phiếu giao dịch TX-20261001-0001/i)).not.toBeInTheDocument();
    });
  });

  describe('TransactionDeleteDialog', () => {
    const mockTx: InventoryTransaction = {
      id: 'tx-del-1',
      transaction_number: 'TX-20261001-7777',
      warehouse_id: 'wh-1',
      warehouse_code: 'K-NVL',
      warehouse_name: 'Kho Nguyên Vật Liệu Chính',
      item_type: 'material',
      item_id: 'item-1',
      item_code: 'NVL-001',
      item_name: 'Quặng Bauxite Thô Loại 1',
      transaction_type: 'inbound_receipt',
      quantity: 100,
      unit_cost: 650000,
      reference_doc_type: null,
      reference_doc_id: null,
      notes: null,
      created_by: null,
      created_at: '2026-10-01T00:00:00Z',
    };

    it('renders transaction details and handles confirm and close', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <TransactionDeleteDialog
          isOpen={true}
          transaction={mockTx}
          onClose={onClose}
          onConfirm={onConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByText('Xác nhận xóa phiếu giao dịch kho')).toBeInTheDocument();
      expect(screen.getByText('TX-20261001-7777')).toBeInTheDocument();
      expect(screen.getByText('Kho Nguyên Vật Liệu Chính')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
      await user.click(cancelBtn);
      expect(onClose).toHaveBeenCalled();

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      await user.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('StockBalanceTable', () => {
    const mockStockBalances: InventoryStockBalance[] = [
      {
        id: 'bal-1',
        warehouse_id: 'wh-1',
        warehouse_code: 'K-NVL',
        warehouse_name: 'Kho Nguyên Vật Liệu Chính',
        item_id: 'item-1',
        item_code: 'NVL-001',
        item_name: 'Quặng Bauxite Thô Loại 1',
        item_type: 'material',
        category: 'raw_material',
        category_label: 'Nguyên vật liệu chính',
        current_quantity: 800,
        reserved_quantity: 0,
        available_quantity: 800,
        unit_of_measure: 'tấn',
        last_transaction_at: '2026-10-01T08:00:00Z',
        total_inbound: 1000,
        total_outbound: 200,
      },
    ];

    it('renders stock balance table with Inbound, Outbound, and Current Stock columns', () => {
      render(
        <StockBalanceTable
          data={{
            data: mockStockBalances,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onAdjustStock={vi.fn()}
          canTransact={true}
        />
      );

      // Verify warehouse group header
      expect(screen.getByText('Kho Nguyên Vật Liệu Chính')).toBeInTheDocument();
      expect(screen.getByText('K-NVL')).toBeInTheDocument();
      expect(screen.getByText(/1 mặt hàng/i)).toBeInTheDocument();

      // Verify columns
      expect(screen.getByText(/Tổng Nhập \(\+\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng Xuất \(-\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn thực tế \(=\)/i)).toBeInTheDocument();

      // Verify data row and summary values
      expect(screen.getAllByText('1.000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('200').length).toBeGreaterThan(0);
      expect(screen.getAllByText('800').length).toBeGreaterThan(0);
    });

    it('collapses and expands warehouse groups in by_warehouse mode', async () => {
      const user = userEvent.setup();

      render(
        <StockBalanceTable
          data={{
            data: mockStockBalances,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onAdjustStock={vi.fn()}
          canTransact={true}
        />
      );

      // Initially expanded: item details are visible
      expect(screen.getByText('Quặng Bauxite Thô Loại 1')).toBeInTheDocument();

      // Click "Thu gọn tất cả"
      const collapseAllBtn = screen.getByRole('button', { name: /Thu gọn tất cả/i });
      await user.click(collapseAllBtn);

      // Item details should now be collapsed
      expect(screen.queryByText('Quặng Bauxite Thô Loại 1')).not.toBeInTheDocument();

      // Click warehouse header to expand again
      const warehouseHeader = screen.getByText('Kho Nguyên Vật Liệu Chính');
      await user.click(warehouseHeader);

      // Item details visible again
      expect(screen.getByText('Quặng Bauxite Thô Loại 1')).toBeInTheDocument();
    });

    it('switches view mode to aggregated by item and expands warehouse breakdown', async () => {
      const user = userEvent.setup();

      render(
        <StockBalanceTable
          data={{
            data: mockStockBalances,
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          onRetry={vi.fn()}
          warehouses={mockWarehouses}
          selectedWarehouseId="all"
          onWarehouseChange={vi.fn()}
          selectedItemType="all"
          onItemTypeChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          onAdjustStock={vi.fn()}
          canTransact={true}
        />
      );

      // Click "Tổng hợp theo vật tư" toggle
      const byItemBtn = screen.getByRole('button', { name: /Tổng hợp theo vật tư/i });
      await user.click(byItemBtn);

      // Aggregated headers visible
      expect(screen.getByText(/Tổng Nhập Cty \(\+\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng Xuất Cty \(-\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng Tồn Thực Tế \(=\)/i)).toBeInTheDocument();
      expect(screen.getByText(/2 kho/i)).toBeInTheDocument();

      // Click on row to expand details
      const itemName = screen.getByText('Quặng Bauxite Thô Loại 1');
      await user.click(itemName);

      // Warehouse breakdown visible
      expect(screen.getByText(/Chi tiết phân bổ tồn kho của vật tư/i)).toBeInTheDocument();
      expect(screen.getByText(/Kho Trung Gian Số 2/i)).toBeInTheDocument();
    });
  });

  describe('MaterialCategoryBadge with new categories', () => {
    it('renders packaging, consumable, and fuel_energy badges properly', () => {
      const { rerender } = render(<MaterialCategoryBadge category="packaging" />);
      expect(screen.getByText('Bao bì & Đóng gói')).toBeInTheDocument();

      rerender(<MaterialCategoryBadge category="consumable" />);
      expect(screen.getByText('Tiêu hao / BHLĐ')).toBeInTheDocument();

      rerender(<MaterialCategoryBadge category="fuel_energy" />);
      expect(screen.getByText('Nhiên liệu & Năng lượng')).toBeInTheDocument();
    });
  });

  describe('ProductCatalogTable', () => {
    const mockProducts: ProductCatalogItem[] = [
      {
        id: 'prod-1',
        sku: 'AL-SAND-01',
        name: 'Alumina cát loại 1 (Al2O3 >= 98.6%)',
        product_type: 'finished_good',
        unit_of_measure: 'Tấn',
        base_sales_price: 9500000,
        standard_cycle_time_mins: 120,
        standard_labor_cost: 450000,
        status: 'active',
        total_stock: 450,
        created_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'prod-2',
        sku: 'HYD-WET-01',
        name: 'Nhôm Hydroxit Al(OH)3 ẩm',
        product_type: 'semi_finished',
        unit_of_measure: 'Tấn',
        base_sales_price: 6200000,
        standard_cycle_time_mins: 60,
        standard_labor_cost: 200000,
        status: 'active',
        total_stock: 120,
        created_at: '2026-10-01T00:00:00Z',
      },
    ];

    it('renders products list with SKU, name, type badges, price, and stock', () => {
      render(
        <ProductCatalogTable
          data={{
            data: mockProducts,
            totalCount: 2,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          search=""
          onSearchChange={vi.fn()}
          selectedProductType="all"
          onProductTypeChange={vi.fn()}
          selectedStatus="all"
          onStatusChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          canManage={true}
          onOpenCreate={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('AL-SAND-01')).toBeInTheDocument();
      expect(screen.getByText('Alumina cát loại 1 (Al2O3 >= 98.6%)')).toBeInTheDocument();
      expect(screen.getByText('Thành phẩm sản xuất')).toBeInTheDocument();
      expect(screen.getByText('HYD-WET-01')).toBeInTheDocument();
      expect(screen.getAllByText('Bán thành phẩm').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('450 Tấn')).toBeInTheDocument();
      expect(screen.getByText('9.500.000 ₫')).toBeInTheDocument();
    });

    it('triggers edit and delete actions when buttons are clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <ProductCatalogTable
          data={{
            data: mockProducts,
            totalCount: 2,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }}
          isLoading={false}
          isError={false}
          search=""
          onSearchChange={vi.fn()}
          selectedProductType="all"
          onProductTypeChange={vi.fn()}
          selectedStatus="all"
          onStatusChange={vi.fn()}
          onResetFilters={vi.fn()}
          onPageChange={vi.fn()}
          canManage={true}
          onOpenCreate={vi.fn()}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      const editButtons = screen.getAllByTitle('Chỉnh sửa sản phẩm');
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);
      expect(onEdit).toHaveBeenCalledWith(mockProducts[0]);

      const deleteButtons = screen.getAllByTitle('Xóa sản phẩm');
      expect(deleteButtons.length).toBeGreaterThan(0);
      await user.click(deleteButtons[0]!);
      expect(onDelete).toHaveBeenCalledWith(mockProducts[0]);
    });
  });

  describe('ProductDeleteDialog', () => {
    const mockProduct: ProductCatalogItem = {
      id: 'prod-1',
      sku: 'AL-SAND-01',
      name: 'Alumina cát loại 1',
      product_type: 'finished_good',
      unit_of_measure: 'Tấn',
      base_sales_price: 9500000,
      standard_cycle_time_mins: 120,
      standard_labor_cost: 450000,
      status: 'active',
      total_stock: 0,
      created_at: '2026-10-01T00:00:00Z',
    };

    it('renders product details and triggers confirm', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <ProductDeleteDialog
          isOpen={true}
          product={mockProduct}
          onClose={onClose}
          onConfirm={onConfirm}
          isDeleting={false}
        />
      );

      expect(screen.getByText('Xác nhận xóa sản phẩm')).toBeInTheDocument();
      expect(screen.getByText('AL-SAND-01')).toBeInTheDocument();
      expect(screen.getByText('Alumina cát loại 1')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' });
      await user.click(cancelBtn);
      expect(onClose).toHaveBeenCalled();

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      await user.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('ProductFormDialog', () => {
    it('renders form inputs and handles submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <ProductFormDialog
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Khai báo sản phẩm / thành phẩm mới')).toBeInTheDocument();

      const skuInput = screen.getByPlaceholderText(/AL-SAND-01/i);
      await user.type(skuInput, 'PROD-NEW-01');

      const nameInput = screen.getByPlaceholderText(/Alumina cát/i);
      await user.type(nameInput, 'Sản phẩm mới kiểm thử');

      const submitBtn = screen.getByRole('button', { name: 'Thêm sản phẩm' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Product Badges', () => {
    it('renders ProductTypeBadge and ProductStatusBadge correctly', () => {
      const { rerender } = render(<ProductTypeBadge type="finished_good" />);
      expect(screen.getByText('Thành phẩm sản xuất')).toBeInTheDocument();

      rerender(<ProductTypeBadge type="semi_finished" />);
      expect(screen.getByText('Bán thành phẩm')).toBeInTheDocument();

      rerender(<ProductTypeBadge type="by_product" />);
      expect(screen.getByText('Phụ phẩm thu hồi')).toBeInTheDocument();

      rerender(<ProductStatusBadge status="active" />);
      expect(screen.getByText('Đang sản xuất / KD')).toBeInTheDocument();

      rerender(<ProductStatusBadge status="discontinued" />);
      expect(screen.getByText('Ngừng kinh doanh')).toBeInTheDocument();
    });
  });
});



