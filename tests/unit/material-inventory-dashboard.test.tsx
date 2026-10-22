import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaterialInventoryDashboard } from '@/features/warehouse/components/material-inventory-dashboard';
import type { MaterialDashboardData } from '@/features/warehouse/types';

describe('MaterialInventoryDashboard Component', () => {
  const mockData: MaterialDashboardData = {
    kpis: {
      totalMaterials: 45,
      activeMaterials: 42,
      outOfStockCount: 2,
      lowStockCount: 5,
      overstockCount: 1,
      totalInventoryValue: 1250000000,
      monthlyInboundQty: 5000,
      monthlyInboundValue: 350000000,
      monthlyOutboundQty: 4200,
      monthlyOutboundValue: 280000000,
    },
    alerts: [
      {
        id: 'mat-01',
        code: 'HC-FLOC-01',
        name: 'Chất trợ lắng Polymer Anionic (A-101)',
        category: 'Hóa chất công nghiệp',
        unit_of_measure: 'Kg',
        current_stock: 0,
        min_stock_level: 500,
        reorder_point: 800,
        shortage_quantity: 800,
        severity: 'out_of_stock',
      },
      {
        id: 'mat-02',
        code: 'PT-PUMP-05',
        name: 'Cánh bơm bùn cao su chịu mài mòn Warman 4/3',
        category: 'Phụ tùng & Cơ điện',
        unit_of_measure: 'Cái',
        current_stock: 2,
        min_stock_level: 5,
        reorder_point: 6,
        shortage_quantity: 4,
        severity: 'critical_low',
      },
    ],
    categories: [
      {
        category: 'raw_material',
        label: 'Nguyên vật liệu thô',
        materialCount: 8,
        totalQuantity: 25000,
        totalValue: 500000000,
        lowStockCount: 0,
      },
      {
        category: 'chemical',
        label: 'Hóa chất công nghiệp',
        materialCount: 12,
        totalQuantity: 3200,
        totalValue: 320000000,
        lowStockCount: 1,
      },
    ],
    topConsumed: [
      {
        material_id: 'mat-03',
        code: 'NL-DO-01',
        name: 'Dầu Diesel 0.05S vận hành máy sấy',
        unit_of_measure: 'Lít',
        totalQuantity: 12000,
        totalValue: 240000000,
      },
    ],
    recentTransactions: [],
  };

  it('renders KPI metrics correctly', () => {
    render(
      <MaterialInventoryDashboard
        data={mockData}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Trung Tâm Điều Hành Kho Vật Tư')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // total materials
    expect(screen.getByText('Hết hàng (0 tồn)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // out of stock count
    expect(screen.getByText('Dưới mức tối thiểu')).toBeInTheDocument();
  });

  it('renders critical stock alerts table and triggers PR request navigation', async () => {
    const user = userEvent.setup();
    const onNavigateToRequests = vi.fn();

    render(
      <MaterialInventoryDashboard
        data={mockData}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onNavigateToRequests={onNavigateToRequests}
      />
    );

    expect(screen.getByText('Cảnh Báo Thiếu Hụt & Điểm Đặt Hàng Lại')).toBeInTheDocument();
    expect(screen.getByText('HC-FLOC-01')).toBeInTheDocument();
    expect(screen.getByText('HẾT HÀNG')).toBeInTheDocument();
    expect(screen.getByText('DƯỚI MIN')).toBeInTheDocument();

    const prBtn = screen.getByRole('button', { name: /Lập đề xuất mua \(PR\)/i });
    await user.click(prBtn);
    expect(onNavigateToRequests).toHaveBeenCalledTimes(1);
  });

  it('renders error state and handles retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <MaterialInventoryDashboard
        isLoading={false}
        isError={true}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Không thể tải dữ liệu Dashboard Vật tư')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    await user.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
