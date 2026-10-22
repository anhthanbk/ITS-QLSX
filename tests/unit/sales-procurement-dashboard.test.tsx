import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesProcurementDashboard } from '@/features/sales/components/sales-procurement-dashboard';
import type { SalesProcurementDashboardData } from '@/features/sales/types';

describe('SalesProcurementDashboard Component', () => {
  const mockDashboardData: SalesProcurementDashboardData = {
    kpis: {
      totalSalesRevenue: 1500000000,
      totalPurchaseCost: 600000000,
      grossCommercialMargin: 900000000,
      commercialMarginRate: 60.0,
      salesOrdersCount: 20,
      confirmedSalesOrdersCount: 15,
      salesDeliveryRate: 85,
      purchaseOrdersCount: 12,
      receivedPurchaseOrdersCount: 10,
      purchaseFulfillmentRate: 83,
      pendingSOActionCount: 5,
      pendingPOReceiveCount: 2,
      pendingPRReviewCount: 3,
      activeCustomersCount: 18,
      activeSuppliersCount: 10,
    },
    alerts: [
      {
        id: 'so-urgent-1',
        type: 'so_urgent_delivery',
        title: 'Đơn bán SO-2026-001 sắp đến hạn giao',
        description: 'Hẹn giao 20/10/2026 cho Công ty Bê Tông Viglacera. Xe: 29C-888.88.',
        severity: 'warning',
        targetId: 'so-1',
        targetCode: 'SO-2026-001',
        date: '2026-10-20',
        amount: 350000000,
        partnerName: 'Công ty Bê Tông Viglacera',
      },
      {
        id: 'po-overdue-1',
        type: 'po_overdue_delivery',
        title: 'Đơn mua PO-2026-005 trễ hạn giao hàng',
        description: 'Nhà cung ứng Mỏ Đá Phủ Lý trễ hạn giao cát thô.',
        severity: 'critical',
        targetId: 'po-1',
        targetCode: 'PO-2026-005',
        date: '2026-10-15',
        amount: 180000000,
        partnerName: 'Mỏ Đá Phủ Lý',
      },
    ],
    funnelStages: [
      {
        stage: 'draft',
        label: 'Bản thảo / Báo giá',
        count: 2,
        amount: 120000000,
        color: 'bg-slate-500',
      },
      {
        stage: 'confirmed',
        label: 'Đã ký hợp đồng',
        count: 8,
        amount: 800000000,
        color: 'bg-blue-500',
      },
      {
        stage: 'delivered',
        label: 'Đã giao thành công',
        count: 10,
        amount: 580000000,
        color: 'bg-emerald-500',
      },
    ],
    topCustomers: [
      {
        id: 'cust-1',
        code: 'KH-001',
        name: 'Tập đoàn Xây dựng Hòa Bình',
        totalAmount: 650000000,
        orderCount: 6,
        type: 'customer',
        percentage: 43.3,
      },
      {
        id: 'cust-2',
        code: 'KH-002',
        name: 'Công ty Cổ phần Fecon',
        totalAmount: 420000000,
        orderCount: 4,
        type: 'customer',
        percentage: 28.0,
      },
    ],
    topSuppliers: [
      {
        id: 'sup-1',
        code: 'NCC-001',
        name: 'Công ty Khai thác Mỏ Hà Nam',
        totalAmount: 350000000,
        orderCount: 5,
        type: 'supplier',
        percentage: 58.3,
      },
    ],
    carriers: [
      {
        carrierName: 'Nhà xe Vận tải Hoàng Long',
        activeOrdersCount: 4,
        recentVehiclePlate: '29C-999.88',
        recentDeliveryDate: '2026-10-19',
      },
    ],
  };

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <SalesProcurementDashboard
        isLoading={true}
        onNavigateTab={vi.fn()}
        canManageSales={true}
        canManagePurchase={true}
      />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders executive banner and KPI cards correctly', () => {
    render(
      <SalesProcurementDashboard
        data={mockDashboardData}
        isLoading={false}
        onNavigateTab={vi.fn()}
        canManageSales={true}
        canManagePurchase={true}
      />
    );

    expect(screen.getByText('Executive Command Center')).toBeInTheDocument();
    expect(screen.getByText('Tổng Quan Điều Hành Kinh Doanh & Chuỗi Cung Ứng')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu bán SO')).toBeInTheDocument();
    expect(screen.getByText('Chi mua hàng PO')).toBeInTheDocument();
    expect(screen.getByText('Cân đối Bán - Mua')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ giao hàng SO')).toBeInTheDocument();
    expect(screen.getByText('+60.0%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders alerts and allows tab navigation on action click', async () => {
    const user = userEvent.setup();
    const onNavigateTab = vi.fn();

    render(
      <SalesProcurementDashboard
        data={mockDashboardData}
        isLoading={false}
        onNavigateTab={onNavigateTab}
        canManageSales={true}
        canManagePurchase={true}
      />
    );

    expect(screen.getByText('Trung Tâm Hành Động & Cảnh Báo Điều Hành')).toBeInTheDocument();
    expect(screen.getByText('Đơn bán SO-2026-001 sắp đến hạn giao')).toBeInTheDocument();
    expect(screen.getByText('Đơn mua PO-2026-005 trễ hạn giao hàng')).toBeInTheDocument();

    const openSOBtn = screen.getByRole('button', { name: /Mở đơn bán/i });
    await user.click(openSOBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('orders');

    const checkPOBtn = screen.getByRole('button', { name: /Kiểm tra PO/i });
    await user.click(checkPOBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('procurement-orders');
  });

  it('renders sales funnel stages and top partners', () => {
    render(
      <SalesProcurementDashboard
        data={mockDashboardData}
        isLoading={false}
        onNavigateTab={vi.fn()}
        canManageSales={true}
        canManagePurchase={true}
      />
    );

    expect(screen.getByText('Phễu Tiến Độ Bán Hàng (SO)')).toBeInTheDocument();
    expect(screen.getByText('Bản thảo / Báo giá')).toBeInTheDocument();
    expect(screen.getByText('Đã ký hợp đồng')).toBeInTheDocument();
    expect(screen.getByText('Đã giao thành công')).toBeInTheDocument();

    expect(screen.getByText('Top 5 Khách Hàng Tiêu Biểu (B2B)')).toBeInTheDocument();
    expect(screen.getByText('Tập đoàn Xây dựng Hòa Bình')).toBeInTheDocument();
    expect(screen.getByText('Công ty Cổ phần Fecon')).toBeInTheDocument();

    expect(screen.getByText('Top 5 Nhà Cung Ứng Trọng Yếu')).toBeInTheDocument();
    expect(screen.getByText('Công ty Khai thác Mỏ Hà Nam')).toBeInTheDocument();

    expect(screen.getByText('Mạng Lưới Đơn Vị Vận Tải & Nhà Xe Tiêu Biểu')).toBeInTheDocument();
    expect(screen.getByText('Nhà xe Vận tải Hoàng Long')).toBeInTheDocument();
  });

  it('triggers onOpenCreateSO and onOpenCreatePO when clicked', async () => {
    const user = userEvent.setup();
    const onOpenCreateSO = vi.fn();
    const onOpenCreatePO = vi.fn();

    render(
      <SalesProcurementDashboard
        data={mockDashboardData}
        isLoading={false}
        onNavigateTab={vi.fn()}
        onOpenCreateSO={onOpenCreateSO}
        onOpenCreatePO={onOpenCreatePO}
        canManageSales={true}
        canManagePurchase={true}
      />
    );

    const createSOBtn = screen.getByRole('button', { name: /Tạo đơn bán \(SO\)/i });
    await user.click(createSOBtn);
    expect(onOpenCreateSO).toHaveBeenCalledTimes(1);

    const createPOBtn = screen.getByRole('button', { name: /Lập đơn mua \(PO\)/i });
    await user.click(createPOBtn);
    expect(onOpenCreatePO).toHaveBeenCalledTimes(1);
  });
});
