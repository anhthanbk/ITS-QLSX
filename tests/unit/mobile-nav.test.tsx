import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  MobileNav,
  STORAGE_KEY_MOBILE_PINNED_IDS,
  DEFAULT_PINNED_DEPT_IDS,
} from '@/components/layout/mobile-nav';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      roles: [{ id: 'admin', name: 'Quản trị viên' }],
    },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

describe('MobileNav Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders exactly 5 buttons on the bottom navigation bar by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNav />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Thanh điều hướng di động' });
    expect(nav).toBeInTheDocument();

    // The nav bar should contain 5 items: 4 default pinned + 1 Thêm button
    expect(screen.getByText('Điều hành')).toBeInTheDocument();
    expect(screen.getByText('Sản xuất')).toBeInTheDocument();
    expect(screen.getByText('Kho vận')).toBeInTheDocument();
    expect(screen.getByText('Bảo trì')).toBeInTheDocument();
    expect(screen.getByText('Thêm')).toBeInTheDocument();

    // The other departments (e.g. Kinh doanh, Nhân sự, Hệ thống) should NOT be on the bar initially
    expect(screen.queryByText('Kinh doanh')).not.toBeInTheDocument();
    expect(screen.queryByText('Nhân sự')).not.toBeInTheDocument();
    expect(screen.queryByText('Hệ thống')).not.toBeInTheDocument();
  });

  it('opens bottom drawer showing all departments when clicking Thêm button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNav />
      </MemoryRouter>,
    );

    const moreBtn = screen.getByRole('button', { name: 'Thêm' });
    fireEvent.click(moreBtn);

    // Sheet header should be visible
    expect(screen.getByText('Tất cả phòng ban')).toBeInTheDocument();
    expect(screen.getByText('Tùy chỉnh')).toBeInTheDocument();

    // Now extended departments are visible inside the sheet
    expect(screen.getByText('Kinh doanh')).toBeInTheDocument();
    expect(screen.getByText('Nhân sự')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống')).toBeInTheDocument();
  });

  it('navigates to department and closes drawer when clicking a department in the drawer', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNav />
      </MemoryRouter>,
    );

    const moreBtn = screen.getByRole('button', { name: 'Thêm' });
    fireEvent.click(moreBtn);

    const salesBtn = screen.getByRole('button', { name: /Kinh doanh/i });
    fireEvent.click(salesBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/sales');
    // Drawer closes
    expect(screen.queryByText('Tất cả phòng ban')).not.toBeInTheDocument();
  });

  it('allows customizing which 4 buttons are pinned and persists to localStorage', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNav />
      </MemoryRouter>,
    );

    // Open More drawer
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));

    // Click Tùy chỉnh button
    fireEvent.click(screen.getByRole('button', { name: /Tùy chỉnh/i }));

    expect(screen.getByText(/Tùy chỉnh 4 nút chính/i)).toBeInTheDocument();

    // Click "Kinh doanh" to add it to pinned
    const salesOption = screen.getByRole('button', { name: /Kinh doanh/i });
    fireEvent.click(salesOption);

    // Click "Lưu & Áp dụng"
    fireEvent.click(screen.getByRole('button', { name: /Lưu & Áp dụng/i }));

    // LocalStorage should now contain the customized IDs
    const stored = localStorage.getItem(STORAGE_KEY_MOBILE_PINNED_IDS);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toContain('sales');
    expect(parsed.length).toBe(4);

    // "Kinh doanh" should now be directly on the bottom bar!
    expect(screen.getByText('Kinh doanh')).toBeInTheDocument();
  });

  it('allows resetting customized buttons back to default', () => {
    localStorage.setItem(
      STORAGE_KEY_MOBILE_PINNED_IDS,
      JSON.stringify(['sales', 'hr', 'system', 'production']),
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNav />
      </MemoryRouter>,
    );

    // Should render customized items from localStorage
    expect(screen.getByText('Kinh doanh')).toBeInTheDocument();

    // Open More drawer
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));

    // Click Tùy chỉnh
    fireEvent.click(screen.getByRole('button', { name: /Tùy chỉnh/i }));

    // Click Mặc định (Reset)
    fireEvent.click(screen.getByRole('button', { name: /Mặc định/i }));

    // Click Lưu & Áp dụng
    fireEvent.click(screen.getByRole('button', { name: /Lưu & Áp dụng/i }));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_MOBILE_PINNED_IDS)!);
    expect(stored).toEqual(DEFAULT_PINNED_DEPT_IDS);
  });
});
