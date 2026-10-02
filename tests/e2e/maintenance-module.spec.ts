import { test, expect, type Page } from '@playwright/test';

const mockUserId = '11111111-1111-1111-1111-111111111111';
const mockUser = {
  id: mockUserId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@its-qlsx.vn',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  user_metadata: {
    full_name: 'Nguyễn Văn Admin',
  },
  app_metadata: {
    provider: 'email',
  },
};

const mockProfile = {
  id: mockUserId,
  full_name: 'Nguyễn Văn Admin',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
};

const mockProductionLines = [
  { id: 'l1111111-1111-1111-1111-111111111111', name: 'Dây chuyền tuyển từ 01', code: 'LINE-01' },
  { id: 'l2222222-2222-2222-2222-222222222222', name: 'Dây chuyền nghiền sàng 02', code: 'LINE-02' },
];

const mockDepartments = [
  { id: 'd1111111-1111-1111-1111-111111111111', name: 'Phòng Bảo Trì Cơ Điện', code: 'BT' },
  { id: 'd2222222-2222-2222-2222-222222222222', name: 'Phòng Sản Xuất', code: 'SX' },
];

const mockTechnicians = [
  {
    id: 't1111111-1111-1111-1111-111111111111',
    employee_code: 'TECH-001',
    first_name: 'Cường',
    last_name: 'Vũ Đức',
  },
  {
    id: 't2222222-2222-2222-2222-222222222222',
    employee_code: 'TECH-002',
    first_name: 'Hùng',
    last_name: 'Đặng Quốc',
  },
];

const mockMachines = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    machine_code: 'MC-CRUSH-01',
    name: 'Máy nghiền búa sơ cấp MB-01',
    line_id: 'l1111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    model: 'MB-800',
    serial_number: 'SN-CRUSH-889',
    line_location: 'Trạm nghiền sơ cấp',
    rated_capacity_per_hour: 60,
    power_rating_kw: 110,
    installation_date: '2024-03-15',
    status: 'operational',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
    production_lines: mockProductionLines[0],
    departments: mockDepartments[0],
  },
  {
    id: 'm2222222-2222-2222-2222-222222222222',
    machine_code: 'MC-MAG-02',
    name: 'Máy tuyển từ tang quay từ trường cao',
    line_id: 'l1111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    model: 'CTN-1224',
    serial_number: 'SN-MAG-102',
    line_location: 'Trạm tách từ thô',
    rated_capacity_per_hour: 50,
    power_rating_kw: 30,
    installation_date: '2024-05-10',
    status: 'operational',
    created_at: '2024-05-10T00:00:00Z',
    updated_at: '2024-05-10T00:00:00Z',
    production_lines: mockProductionLines[0],
    departments: mockDepartments[0],
  },
  {
    id: 'm3333333-3333-3333-3333-333333333333',
    machine_code: 'MC-CONV-03',
    name: 'Băng tải cấp liệu BC-03',
    line_id: 'l2222222-2222-2222-2222-222222222222',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    model: 'BC-B800',
    serial_number: 'SN-CONV-442',
    line_location: 'Khu vực cấp liệu phễu rung',
    rated_capacity_per_hour: 80,
    power_rating_kw: 15,
    installation_date: '2024-04-10',
    status: 'breakdown',
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
    production_lines: mockProductionLines[1],
    departments: mockDepartments[0],
  },
];

const mockPlans = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    plan_code: 'PM-CRUSH-30D',
    machine_id: 'm1111111-1111-1111-1111-111111111111',
    title: 'Bảo dưỡng định kỳ 30 ngày máy nghiền búa',
    frequency_days: 30,
    last_performed_date: '2026-03-01',
    next_due_date: '2026-03-31',
    standard_duration_hours: 3.5,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    machines: {
      id: 'm1111111-1111-1111-1111-111111111111',
      machine_code: 'MC-CRUSH-01',
      name: 'Máy nghiền búa sơ cấp MB-01',
      status: 'operational',
    },
  },
];

const mockOrders = [
  {
    id: 'w1111111-1111-1111-1111-111111111111',
    work_order_number: 'WO-2026-001',
    machine_id: 'm3333333-3333-3333-3333-333333333333',
    maintenance_plan_id: null,
    type: 'corrective_breakdown',
    priority: 'critical',
    assigned_technician_id: 't1111111-1111-1111-1111-111111111111',
    reported_issue: 'Rách băng tải bọc cao su khu vực trạm chuyển hướng',
    root_cause: 'Dị vật sắt kẹt vào tấm gạt',
    resolution_summary: 'Dán ép lưu hóa nguội đoạn băng rách và căn chỉnh lại tấm gạt',
    downtime_minutes: 90,
    labor_hours: 4,
    spare_parts_cost: 1200000,
    status: 'in_progress',
    scheduled_date: '2026-03-29',
    completed_at: null,
    created_at: '2026-03-29T00:00:00Z',
    updated_at: '2026-03-29T00:00:00Z',
    machines: {
      id: 'm3333333-3333-3333-3333-333333333333',
      machine_code: 'MC-CONV-03',
      name: 'Băng tải cấp liệu BC-03',
      line_location: 'Khu vực cấp liệu phễu rung',
    },
    assigned_technician: mockTechnicians[0],
    maintenance_plans: null,
  },
];

async function setupMockMaintenanceSession(page: Page) {
  // Auth mock
  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockProfile]),
    });
  });

  await page.route('**/rest/v1/user_roles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          role_id: 'role-admin',
          roles: { id: 'role-admin', code: 'admin', name: 'Quản trị viên' },
        },
      ]),
    });
  });

  await page.route('**/rest/v1/roles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'role-admin', code: 'admin', name: 'Quản trị viên' },
      ]),
    });
  });

  await page.route('**/rest/v1/rpc/get_user_permissions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { permission_code: 'maintenance.manage', role_code: 'admin' },
        { permission_code: 'maintenance.machine.view', role_code: 'admin' },
        { permission_code: 'maintenance.machine.manage', role_code: 'admin' },
        { permission_code: 'maintenance.schedule.view', role_code: 'admin' },
        { permission_code: 'maintenance.schedule.manage', role_code: 'admin' },
        { permission_code: 'maintenance.order.manage', role_code: 'admin' },
      ]),
    });
  });

  // Maintenance Endpoints
  await page.route('**/rest/v1/machines*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      const url = route.request().url();
      if (url.includes('select=id') && url.includes('count=exact')) {
        // Head count
        await route.fulfill({
          status: 200,
          headers: {
            'content-range': '0-2/3',
          },
          body: JSON.stringify([]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-2/3',
        },
        contentType: 'application/json',
        body: JSON.stringify(mockMachines),
      });
      return;
    }

    if (method === 'POST') {
      const postData = route.request().postDataJSON();
      const newMachine = {
        id: 'm-new-999',
        ...postData[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        production_lines: mockProductionLines[0],
        departments: mockDepartments[0],
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newMachine),
      });
      return;
    }

    if (method === 'PATCH') {
      const patchData = route.request().postDataJSON();
      const updated = {
        ...mockMachines[0],
        ...patchData,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/rest/v1/maintenance_plans*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-0/1',
        },
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/rest/v1/maintenance_work_orders*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-0/1',
        },
        contentType: 'application/json',
        body: JSON.stringify(mockOrders),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/rest/v1/production_lines*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProductionLines),
    });
  });

  await page.route('**/rest/v1/departments*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDepartments),
    });
  });

  await page.route('**/rest/v1/employees*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTechnicians),
    });
  });

  // Inject session into localStorage
  await page.addInitScript((user) => {
    const mockSession = {
      access_token: 'fake-jwt-token-admin',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'fake-refresh-token',
      user,
    };
    window.localStorage.setItem('sb-vymongseqpgevbxktujj-auth-token', JSON.stringify(mockSession));
    window.localStorage.setItem('its_auth_token', JSON.stringify(mockSession));
  }, mockUser);
}

test.describe('Maintenance Module E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockMaintenanceSession(page);
  });

  test('navigates to maintenance and renders machine list with metrics', async ({ page }) => {
    await page.goto('/maintenance');
    await page.waitForURL('**/maintenance/machines');

    // Page title and header
    await expect(page.getByRole('heading', { name: /Bảo Trì & Quản Lý Thiết Bị/i })).toBeVisible();

    // Metric cards
    await expect(page.getByText('Tổng số thiết bị')).toBeVisible();
    await expect(page.getByText('Đang vận hành').first()).toBeVisible();
    await expect(page.getByText('Sự cố / Dừng máy')).toBeVisible();

    // Machine table content
    await expect(page.getByText('MC-CRUSH-01')).toBeVisible();
    await expect(page.getByText('Máy nghiền búa sơ cấp MB-01')).toBeVisible();
    await expect(page.getByText('MC-CONV-03')).toBeVisible();
    await expect(page.getByText('Băng tải cấp liệu BC-03')).toBeVisible();
  });

  test('switches across maintenance tabs seamlessly', async ({ page }) => {
    await page.goto('/maintenance/machines');

    // Click Lịch bảo dưỡng tab
    await page.getByRole('button', { name: /Lịch bảo dưỡng/i }).click();
    await page.waitForURL('**/maintenance/schedules');
    await expect(page.getByText('PM-CRUSH-30D')).toBeVisible();
    await expect(page.getByText('Bảo dưỡng định kỳ 30 ngày máy nghiền búa')).toBeVisible();

    // Click Phiếu sửa chữa tab
    await page.getByRole('button', { name: /Phiếu sửa chữa/i }).click();
    await page.waitForURL('**/maintenance/orders');
    await expect(page.getByText('WO-2026-001')).toBeVisible();
    await expect(page.getByText(/Rách băng tải bọc cao su/i)).toBeVisible();

    // Click Kho phụ tùng tab
    await page.getByRole('button', { name: /Kho phụ tùng/i }).click();
    await page.waitForURL('**/maintenance/spares');
    await expect(page.getByText('Kho Phụ Tùng & Vật Tư Tiêu Hao Thiết Bị')).toBeVisible();
    await expect(page.getByText('Vòng bi SKF 6312 2Z/C3')).toBeVisible();
  });

  test('filters machines by search text and status dropdown', async ({ page }) => {
    await page.goto('/maintenance/machines');

    const searchInput = page.getByPlaceholder(/tìm theo mã tb/i);
    await searchInput.fill('CRUSH');
    await expect(searchInput).toHaveValue('CRUSH');

    // Status filter
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('breakdown');
  });

  test('opens machine detail modal and inspects tabs', async ({ page }) => {
    await page.goto('/maintenance/machines');

    const viewDetailBtn = page.getByTitle('Xem chi tiết').first();
    await viewDetailBtn.click();

    // Modal dialog
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('MC-CRUSH-01')).toBeVisible();
    await expect(modal.getByText('Thông số kỹ thuật')).toBeVisible();

    // Close modal
    await modal.getByRole('button', { name: 'Đóng' }).first().click();
    await expect(modal).not.toBeVisible();
  });

  test('opens add machine modal and performs form validation', async ({ page }) => {
    await page.goto('/maintenance/machines');

    const addBtn = page.getByRole('button', { name: /thêm thiết bị/i });
    await addBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Thêm Thiết Bị Mới')).toBeVisible();

    // Submit empty form to trigger validation
    await dialog.getByRole('button', { name: 'Thêm thiết bị' }).click();
    await expect(dialog.getByText('Mã thiết bị phải có ít nhất 2 ký tự')).toBeVisible();
    await expect(dialog.getByText('Tên thiết bị phải có ít nhất 2 ký tự')).toBeVisible();

    // Close dialog
    await dialog.getByRole('button', { name: 'Hủy' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
