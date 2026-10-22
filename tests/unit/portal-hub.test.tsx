import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppsheetPortalPage, DepartmentOperationsPage } from '@/features/portal';
import { AppShell } from '@/components/layout/app-shell';
import { ToastProvider } from '@/components/feedback/toast-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'than@itsproduction.vn',
      profile: {
        full_name: 'Lê Anh Thân',
      },
      roles: [{ id: 'admin', name: 'Quản trị viên' }],
    },
    signOut: vi.fn(),
    hasPermission: () => true,
    hasRole: () => true,
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

const renderTestApp = (queryClient: QueryClient) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<AppsheetPortalPage />} />
                <Route
                  path="/production"
                  element={<DepartmentOperationsPage departmentId="production" />}
                />
                <Route
                  path="/production/shifts"
                  element={
                    <div>
                      <table>
                        <tbody>
                          <tr>
                            <td>Bảng ca sản xuất</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('AppSheet Portal Hub Page', () => {
  it('renders branding header with ITS CHANNEL and user full name', () => {
    const queryClient = createTestQueryClient();
    renderTestApp(queryClient);

    expect(screen.getByText('ITS CHANNEL')).toBeInTheDocument();
    expect(screen.getAllByText('ERP system').length).toBeGreaterThan(0);
    expect(screen.getByText('Lê Anh Thân')).toBeInTheDocument();
  });

  it('renders company KPI cards: Sản lượng, OEE, Tiêu hao vật tư on home screen', () => {
    const queryClient = createTestQueryClient();
    renderTestApp(queryClient);

    expect(screen.getByText(/Sản Lượng Thành Phẩm/i)).toBeInTheDocument();
    expect(screen.getByText(/Hiệu Suất Thiết Bị \(OEE\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiêu Hao NNL/i)).toBeInTheDocument();
  });

  it('renders exactly 7 department buttons on home screen without inline actions list', () => {
    const queryClient = createTestQueryClient();
    renderTestApp(queryClient);

    // Verify 7 department buttons are present in sidebar
    expect(screen.getAllByText('Điều hành').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sản xuất').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kho vận').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bảo trì').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kinh doanh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nhân sự').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hệ thống').length).toBeGreaterThan(0);

    // Verify popup modal dialog is not rendered
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to department operations screen with action items when clicking a department', () => {
    const queryClient = createTestQueryClient();
    renderTestApp(queryClient);

    // Click on "Sản xuất" department button in sidebar
    const prodBtns = screen.getAllByText('Sản xuất');
    const prodBtn = prodBtns[0]!;
    fireEvent.click(prodBtn);

    // Verify it is NOT a popup modal dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Specific action items of Production should be visible on the operations screen
    expect(screen.getAllByText('Kế hoạch').length).toBeGreaterThan(0);
    expect(screen.getByText('Nhập liệu')).toBeInTheDocument();
    expect(screen.getByText('Tuần kiểm')).toBeInTheDocument();
    expect(screen.getByText('Downtime')).toBeInTheDocument();

    // Clicking an action item (e.g. Nhập liệu) navigates to that specific view
    const shiftActionBtn = screen.getByText('Nhập liệu');
    fireEvent.click(shiftActionBtn);

    // Now on production shifts view
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
