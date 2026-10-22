import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

describe('Breadcrumbs Component', () => {
  it('renders root breadcrumb on home path /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });

  it('renders hierarchical crumbs with translated titles for nested route', () => {
    render(
      <MemoryRouter initialEntries={['/production/plans']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sản xuất')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch sản xuất')).toBeInTheDocument();
    // Verify last crumb has aria-current="page"
    const lastCrumb = screen.getByText('Kế hoạch sản xuất');
    expect(lastCrumb).toHaveAttribute('aria-current', 'page');
  });

  it('renders custom crumbs if provided', () => {
    const custom = [
      { label: 'Sản xuất', path: '/production' },
      { label: 'Kế hoạch', path: '/production/plans' },
      { label: 'Chi tiết KH-2026-001' },
    ];

    render(
      <MemoryRouter initialEntries={['/production/plans/123']}>
        <Breadcrumbs customCrumbs={custom} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Chi tiết KH-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Chi tiết KH-2026-001')).toHaveAttribute('aria-current', 'page');
  });

  it('opens department dropdown menu when department button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/production/shifts']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    const deptBtn = screen.getByRole('button', { name: /sản xuất/i });
    expect(screen.queryByText('Chuyển Đổi Phòng Ban')).not.toBeInTheDocument();

    fireEvent.click(deptBtn);
    expect(screen.getByText('Chuyển Đổi Phòng Ban')).toBeInTheDocument();
    expect(screen.getByText('Kho vận')).toBeInTheDocument();
    expect(screen.getByText('Bảo trì')).toBeInTheDocument();
  });

  it('opens view operations dropdown menu when view button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/production/shifts']}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    const viewBtn = screen.getByRole('button', { name: /nhập liệu/i });
    expect(screen.queryByText('Thao Tác & Chức Năng')).not.toBeInTheDocument();

    fireEvent.click(viewBtn);
    expect(screen.getByText('Thao Tác & Chức Năng')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Tuần kiểm')).toBeInTheDocument();
    expect(screen.getByText('Downtime')).toBeInTheDocument();
  });
});
