import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockHistoryModal } from '@/features/warehouse/components/stock-history-modal';
import type { InventoryTransaction } from '@/features/warehouse/types';

const { mockTx } = vi.hoisted(() => {
  const item: InventoryTransaction = {
    id: 'tx-1',
    transaction_number: 'XK-SX-20261008-09-ICEV',
    warehouse_id: 'wh-1',
    warehouse_name: 'Bồn dầu HPS',
    item_type: 'material',
    item_id: 'item-diesel',
    transaction_type: 'production_issue',
    quantity: -11489,
    unit_cost: 0,
    reference_doc_type: 'production_shift',
    reference_doc_id: 'shift-1',
    production_period_code: 'KY-20260901-20260930-HPS2, KY-20260901-20260930-HPS1',
    notes: '[Nghiệm thu SX] Xuất vật tư tiêu hao',
    created_by: 'user-1',
    created_by_name: 'Lê Anh Thân',
    created_at: '2026-10-08T06:57:33Z',
    unit_of_measure: 'Lít',
  };
  return { mockTx: item };
});

vi.mock('@/features/warehouse/hooks/use-inventory-transactions', () => ({
  useInventoryTransactions: () => ({
    data: {
      data: [mockTx],
      totalCount: 1,
      page: 1,
      pageSize: 15,
      totalPages: 1,
      totalInbound: 0,
      totalOutbound: 11489,
    },
    isLoading: false,
    isError: false,
  }),
}));

describe('StockHistoryModal Component Tests', () => {
  it('renders with production period code column and without transaction number or doc type columns', () => {
    render(
      <StockHistoryModal
        item={{
          itemId: 'item-diesel',
          itemCode: 'DO',
          itemName: 'Dầu Diesel',
          unitOfMeasure: 'Lít',
          warehouseId: 'wh-1',
          warehouseName: 'Bồn dầu HPS',
        }}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Verify Title
    expect(screen.getByText(/Lịch sử nhập \/ xuất kho: Dầu Diesel/i)).toBeInTheDocument();

    // Verify Column "Mã đợt / kỳ sản xuất" is present
    expect(screen.getByText('Mã đợt / kỳ sản xuất')).toBeInTheDocument();

    // Verify deleted columns are NOT in the table headers
    expect(screen.queryByText('Mã phiếu')).not.toBeInTheDocument();
    expect(screen.queryByText('Chứng từ / Ca SX')).not.toBeInTheDocument();

    // Verify production period codes are rendered as badges
    expect(screen.getByText('KY-20260901-20260930-HPS2')).toBeInTheDocument();
    expect(screen.getByText('KY-20260901-20260930-HPS1')).toBeInTheDocument();

    // Verify quantities and user
    expect(screen.getByText('-11.489 Lít')).toBeInTheDocument();
    expect(screen.getByText('Lê Anh Thân')).toBeInTheDocument();
  });

  it('renders null when isOpen is false', () => {
    const { container } = render(
      <StockHistoryModal
        item={{
          itemId: 'item-diesel',
          itemCode: 'DO',
          itemName: 'Dầu Diesel',
        }}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
