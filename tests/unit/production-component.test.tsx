import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionMetricCards } from '@/features/production/components/production-metric-cards';
import { ProductionPlanFilterBar } from '@/features/production/components/production-plan-filter-bar';
import { ProductionPlanTable } from '@/features/production/components/production-plan-table';
import { ProductionPlanFormDialog } from '@/features/production/components/production-plan-form-dialog';
import { ProductionShiftTable } from '@/features/production/components/production-shift-table';
import { ProductionShiftFormDialog } from '@/features/production/components/production-shift-form-dialog';
import { ProductionNormTable } from '@/features/production/components/production-norm-table';
import { ProductionOrderTable } from '@/features/production/components/production-order-table';
import type {
  ProductionMonthlyPlan,
  ProductionShift,
  TechnoEconomicNorm,
  ProductionOrder,
  ProductionLine,
} from '@/features/production/types';

describe('Production UI Components Tests', () => {
  const mockLines: ProductionLine[] = [
    {
      id: 'line-1',
      code: 'LINE-01',
      name: 'Dây chuyền Tuyển Rửa Thô',
      department_id: null,
      designed_capacity_tph: 120,
      standard_shift_hours: 8,
      shifts_per_day: 3,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockPlan: ProductionMonthlyPlan = {
    id: 'plan-1',
    plan_code: 'KH-2026-10-LINE01',
    line_id: 'line-1',
    line_name: 'Dây chuyền Tuyển Rửa Thô',
    line_code: 'LINE-01',
    year: 2026,
    month: 10,
    planned_capacity_tph: 110,
    planned_recovery_rate_pct: 82.5,
    total_calendar_hours: 744,
    planned_breakdown_hours: 24,
    planned_maintenance_hours: 48,
    planned_shutdown_hours: 16,
    planned_operating_hours: 656,
    target_quality_rate_pct: 98.5,
    planned_input_material_tons: 72000,
    planned_output_product_tons: 59400,
    planned_byproduct_tons: 8500,
    status: 'draft',
    approved_by: null,
    approved_at: null,
    notes: 'Kế hoạch tháng 10',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('ProductionMetricCards', () => {
    it('renders KPI metrics correctly', () => {
      render(
        <ProductionMetricCards
          isLoading={false}
          metrics={{
            totalMonthlyPlans: 3,
            activeLines: 3,
            monthlyPlannedOutputTons: 59400,
            actualMonthlyOutputTons: 12500,
            avgCapacityTph: 105.5,
            avgRecoveryRatePct: 83.2,
            totalDowntimeHours: 12.5,
            activeOrdersCount: 4,
          }}
        />,
      );

      expect(screen.getByText('Dây chuyền hoạt động')).toBeInTheDocument();
      expect(screen.getByText('59,400 Tấn')).toBeInTheDocument();
      expect(screen.getByText('12,500 Tấn')).toBeInTheDocument();
    });
  });

  describe('ProductionPlanFilterBar', () => {
    it('calls onSearchChange and onReset properly', () => {
      const handleSearch = vi.fn();
      const handleReset = vi.fn();
      const handleCreate = vi.fn();

      render(
        <ProductionPlanFilterBar
          search=""
          onSearchChange={handleSearch}
          status="all"
          onStatusChange={vi.fn()}
          lineId="all"
          onLineIdChange={vi.fn()}
          year="all"
          onYearChange={vi.fn()}
          month="all"
          onMonthChange={vi.fn()}
          lines={mockLines}
          onReset={handleReset}
          onCreate={handleCreate}
          canManage={true}
        />,
      );

      const input = screen.getByPlaceholderText('Tìm theo mã kế hoạch...');
      fireEvent.change(input, { target: { value: 'KH-2026' } });
      expect(handleSearch).toHaveBeenCalledWith('KH-2026');

      const resetButton = screen.getByText('Đặt lại');
      fireEvent.click(resetButton);
      expect(handleReset).toHaveBeenCalled();

      const createButton = screen.getByText('Lập kế hoạch tháng');
      fireEvent.click(createButton);
      expect(handleCreate).toHaveBeenCalled();
    });
  });

  describe('ProductionPlanTable', () => {
    it('renders plan items and handles action clicks', () => {
      const handleView = vi.fn();
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleApprove = vi.fn();

      render(
        <ProductionPlanTable
          data={[mockPlan]}
          isLoading={false}
          totalCount={1}
          page={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          canManage={true}
          canApprove={true}
        />,
      );

      expect(screen.getByText('KH-2026-10-LINE01')).toBeInTheDocument();
      expect(screen.getByText('59,400')).toBeInTheDocument();

      const viewBtn = screen.getByTitle('Xem chi tiết');
      fireEvent.click(viewBtn);
      expect(handleView).toHaveBeenCalledWith(mockPlan);

      const approveBtn = screen.getByTitle('Phê duyệt kế hoạch');
      fireEvent.click(approveBtn);
      expect(handleApprove).toHaveBeenCalledWith(mockPlan);
    });
  });

  describe('ProductionPlanFormDialog', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ProductionPlanFormDialog
          isOpen={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          lines={mockLines}
        />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders form inputs when isOpen is true', () => {
      render(
        <ProductionPlanFormDialog
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          lines={mockLines}
        />,
      );
      expect(screen.getByText('Lập kế hoạch sản xuất tháng')).toBeInTheDocument();
      expect(screen.getByText('Mã kế hoạch *')).toBeInTheDocument();
    });
  });

  describe('ProductionShiftFormDialog', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ProductionShiftFormDialog
          isOpen={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          lines={mockLines}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ProductionShiftTable', () => {
    const mockShift: ProductionShift = {
      id: 'shift-1',
      shift_code: 'CA-20261001-LINE01-S1',
      line_id: 'line-1',
      line_name: 'Dây chuyền Tuyển Rửa Thô',
      line_code: 'LINE-01',
      shift_date: '2026-10-01',
      shift_number: 1,
      standard_shift_hours: 8,
      total_downtime_hours: 0.5,
      running_hours: 7.5,
      raw_material_input_tons: 900,
      product_output_tons: 745,
      byproduct_output_tons: 110,
      actual_capacity_tph: 99.33,
      actual_recovery_rate_pct: 82.78,
      operator_employee_id: null,
      operator_name: 'Nguyễn Văn Vận Hành',
      status: 'completed',
      verified_by: null,
      notes: 'Chạy tốt',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('renders shift record with running hours and output tons', () => {
      render(
        <ProductionShiftTable
          data={[mockShift]}
          isLoading={false}
          totalCount={1}
          page={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onView={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
          canVerify={true}
        />,
      );

      expect(screen.getByText('CA-20261001-LINE01-S1')).toBeInTheDocument();
      expect(screen.getByText('745')).toBeInTheDocument();
      expect(screen.getByText('Đã chốt ca')).toBeInTheDocument();
    });
  });

  describe('ProductionNormTable', () => {
    const mockNorm: TechnoEconomicNorm = {
      id: 'norm-1',
      norm_code: 'DM-DIEN-01',
      line_id: 'line-1',
      line_name: 'Dây chuyền Tuyển Rửa Thô',
      product_id: null,
      resource_type: 'electricity',
      resource_name: 'Điện năng tuyển rửa',
      unit_of_measure: 'kWh/Tấn',
      norm_rate: 18.5,
      effective_from: '2026-01-01',
      effective_to: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('renders norm item with resource badge', () => {
      render(
        <ProductionNormTable
          data={[mockNorm]}
          isLoading={false}
          totalCount={1}
          page={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      expect(screen.getByText('DM-DIEN-01')).toBeInTheDocument();
      expect(screen.getByText('Điện năng tuyển rửa')).toBeInTheDocument();
      expect(screen.getByText('18.5 kWh/Tấn')).toBeInTheDocument();
    });
  });

  describe('ProductionOrderTable', () => {
    const mockOrder: ProductionOrder = {
      id: 'order-1',
      order_number: 'LSX-202610-001',
      production_plan_id: null,
      line_id: 'line-1',
      line_name: 'Dây chuyền Tuyển Rửa Thô',
      product_id: 'prod-1',
      product_name: 'Cát thạch anh ít sắt dưới 80ppm',
      product_sku: 'S80',
      bom_id: null,
      target_quantity: 5000,
      completed_quantity: 2500,
      scrap_quantity: 50,
      planned_start_date: '2026-10-01T06:00:00Z',
      planned_end_date: '2026-10-08T22:00:00Z',
      actual_start_date: null,
      actual_end_date: null,
      status: 'in_progress',
      priority: 'high',
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('renders production order and displays progress percent (50%)', () => {
      render(
        <ProductionOrderTable
          data={[mockOrder]}
          isLoading={false}
          totalCount={1}
          page={1}
          pageSize={10}
          onPageChange={vi.fn()}
          onView={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          canManage={true}
        />,
      );

      expect(screen.getByText('LSX-202610-001')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Cao')).toBeInTheDocument();
      expect(screen.getByText('Đang gia công')).toBeInTheDocument();
    });
  });
});
