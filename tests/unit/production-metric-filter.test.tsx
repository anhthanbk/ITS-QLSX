import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { ProductionMetricFilterBar } from '@/features/production/components/production-metric-filter-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ProductionLine } from '@/features/production/types';

// Mock hook to return known planned years
vi.mock('@/features/production/hooks/use-production-plans', () => ({
  useProductionPlannedYears: () => ({
    data: [2022, 2023, 2024, 2025, 2026],
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithQuery = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const mockLines: ProductionLine[] = [
  {
    id: 'line-1',
    code: 'HPS1',
    name: 'Tuyến rửa 1',
    department_id: null,
    designed_capacity_tph: 150,
    standard_shift_hours: 8,
    shifts_per_day: 3,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

describe('ProductionMetricFilterBar', () => {
  it('renders only the planned years when availableYears are provided', () => {
    const onYearsChange = vi.fn();

    const { container } = renderWithQuery(
      <ProductionMetricFilterBar
        lineId="all"
        onLineIdChange={vi.fn()}
        selectedYears={[2024]}
        onYearsChange={onYearsChange}
        availableYears={[2022, 2023, 2024]}
        lines={mockLines}
        onReset={vi.fn()}
      />,
    );

    // Filter bar should have relative z-30 class to isolate stacking context
    const filterBar = container.firstChild as HTMLElement;
    expect(filterBar.className).toContain('relative');
    expect(filterBar.className).toContain('z-30');

    // Click year dropdown button (the trigger button with title)
    const yearButton = screen.getByTitle('Chọn năm hoặc chọn nhiều năm / tất cả');
    fireEvent.click(yearButton);

    // Popover header should be visible
    const popoverTitle = screen.getByText('Chọn năm kế hoạch');
    expect(popoverTitle).toBeInTheDocument();
    const popover = popoverTitle.parentElement?.parentElement as HTMLElement;
    expect(popover).toBeInTheDocument();

    // Should ONLY show years that have plans inside popover
    expect(within(popover).getByText(/2022/)).toBeInTheDocument();
    expect(within(popover).getByText(/2023/)).toBeInTheDocument();
    expect(within(popover).getByText(/2024/)).toBeInTheDocument();

    // Should NOT show years that do not have plans
    expect(within(popover).queryByText(/2027/)).not.toBeInTheDocument();
    expect(within(popover).queryByText(/2028/)).not.toBeInTheDocument();
    expect(within(popover).queryByText(/2029/)).not.toBeInTheDocument();
    expect(within(popover).queryByText(/2030/)).not.toBeInTheDocument();
  });

  it('uses fetched planned years when availableYears prop is not explicitly passed', () => {
    renderWithQuery(
      <ProductionMetricFilterBar
        lineId="all"
        onLineIdChange={vi.fn()}
        selectedYears={[2026]}
        onYearsChange={vi.fn()}
        lines={mockLines}
        onReset={vi.fn()}
      />,
    );

    const yearButton = screen.getByTitle('Chọn năm hoặc chọn nhiều năm / tất cả');
    fireEvent.click(yearButton);

    const popoverTitle = screen.getByText('Chọn năm kế hoạch');
    const popover = popoverTitle.parentElement?.parentElement as HTMLElement;

    // Popover should render fetched planned years: 2022, 2023, 2024, 2025, 2026
    expect(within(popover).getByText(/2022/)).toBeInTheDocument();
    expect(within(popover).getByText(/2025/)).toBeInTheDocument();
    expect(within(popover).getByText(/2026/)).toBeInTheDocument();
    expect(within(popover).queryByText(/2030/)).not.toBeInTheDocument();
  });

  it('closes popovers when Escape is pressed', () => {
    renderWithQuery(
      <ProductionMetricFilterBar
        lineId="all"
        onLineIdChange={vi.fn()}
        selectedYears={[2024]}
        onYearsChange={vi.fn()}
        lines={mockLines}
        onReset={vi.fn()}
      />,
    );

    const yearButton = screen.getByTitle('Chọn năm hoặc chọn nhiều năm / tất cả');
    fireEvent.click(yearButton);
    expect(screen.getByText('Chọn năm kế hoạch')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Chọn năm kế hoạch')).not.toBeInTheDocument();
  });
});
