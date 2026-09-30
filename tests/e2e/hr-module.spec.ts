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

const mockDeptProdId = 'd1111111-1111-1111-1111-111111111111';
const mockDeptQcId = 'd2222222-2222-2222-2222-222222222222';
const mockPosQdId = 'c1111111-1111-1111-1111-111111111111';
const mockPosKcsId = 'c2222222-2222-2222-2222-222222222222';

const mockDepartments = [
  {
    id: mockDeptProdId,
    code: 'SX',
    name: 'Phòng Sản Xuất',
    status: 'active',
    manager_employee_id: null,
    parent_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    manager: null,
  },
  {
    id: mockDeptQcId,
    code: 'KCS',
    name: 'Phòng Quản Lý Chất Lượng',
    status: 'active',
    manager_employee_id: null,
    parent_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    manager: null,
  },
];

const mockPositions = [
  {
    id: mockPosQdId,
    code: 'QD_SX',
    title: 'Quản Đốc Phân Xưởng',
    department_id: mockDeptProdId,
    level: 4,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    department: { id: mockDeptProdId, name: 'Phòng Sản Xuất', code: 'SX' },
  },
  {
    id: mockPosKcsId,
    code: 'NV_KCS',
    title: 'Nhân Viên Kiểm Phẩm',
    department_id: mockDeptQcId,
    level: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    department: { id: mockDeptQcId, name: 'Phòng Quản Lý Chất Lượng', code: 'KCS' },
  },
];

const mockEmployees = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    employee_code: 'EMP-001',
    first_name: 'An',
    last_name: 'Nguyễn Văn',
    email: 'an.nguyen@its-qlsx.vn',
    phone: '0901234567',
    department_id: mockDeptProdId,
    position_id: mockPosQdId,
    direct_manager_id: null,
    hire_date: '2026-01-10',
    status: 'active',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
    departments: { id: mockDeptProdId, name: 'Phòng Sản Xuất', code: 'SX' },
    positions: { id: mockPosQdId, title: 'Quản Đốc Phân Xưởng', code: 'QD_SX', level: 4 },
    direct_manager: null,
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    employee_code: 'EMP-002',
    first_name: 'Mai',
    last_name: 'Trần Thị',
    email: 'mai.tran@its-qlsx.vn',
    phone: '0912345678',
    department_id: mockDeptQcId,
    position_id: mockPosKcsId,
    direct_manager_id: null,
    hire_date: '2026-02-01',
    status: 'on_leave',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    departments: { id: mockDeptQcId, name: 'Phòng Quản Lý Chất Lượng', code: 'KCS' },
    positions: { id: mockPosKcsId, title: 'Nhân Viên Kiểm Phẩm', code: 'NV_KCS', level: 2 },
    direct_manager: null,
  },
];

async function setupMockHrSession(page: Page) {
  // Mock Auth REST & RPC
  await page.route('**/auth/v1/user', async (route) => {
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
      body: JSON.stringify({
        id: mockUserId,
        full_name: 'Nguyễn Văn Admin',
        employee_id: 'EMP-001',
        status: 'active',
      }),
    });
  });

  await page.route('**/rest/v1/user_roles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          role_id: 'admin-role-id',
          roles: { id: 'admin-role-id', code: 'admin', name: 'Quản trị viên' },
        },
      ]),
    });
  });

  await page.route('**/rest/v1/rpc/get_user_permissions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(['hr.employee.read', 'hr.employee.manage', 'hr.department.manage', 'master_data.manage']),
    });
  });

  // Mock HR Departments
  await page.route('**/rest/v1/departments*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDepartments),
      });
    } else if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-dept-id',
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockDepartments[0],
          ...payload,
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });
    } else {
      await route.continue();
    }
  });

  // Mock HR Positions
  await page.route('**/rest/v1/positions*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPositions),
      });
    } else if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-pos-id',
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockPositions[0],
          ...payload,
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });
    } else {
      await route.continue();
    }
  });

  // Mock HR Employees
  await page.route('**/rest/v1/employees*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: {
          'content-range': '0-1/2',
        },
        contentType: 'application/json',
        body: JSON.stringify(mockEmployees),
      });
    } else if (method === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-emp-id',
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (method === 'PATCH' || method === 'PUT') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockEmployees[0],
          ...payload,
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (method === 'DELETE') {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });
    } else {
      await route.continue();
    }
  });

  // Inject session into localStorage
  await page.addInitScript((user) => {
    const session = {
      access_token: 'mock-jwt-token-hr',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user,
    };
    window.localStorage.setItem('sb-vymongseqpgevbxktujj-auth-token', JSON.stringify(session));
  }, mockUser);
}

test.describe('HR Module — Full Feature Journey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockHrSession(page);
  });

  test('renders HR dashboard with metric cards and employee table', async ({ page }) => {
    await page.goto('/hr');

    // Verify Title and Breadcrumbs
    await expect(page.locator('h1').first()).toHaveText('Quản Lý Nhân Sự & Tổ Chức');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Nhân sự & Tổ chức');

    // Verify Metric cards
    await expect(page.locator('text=Tổng nhân sự')).toBeVisible();
    await expect(page.locator('text=Đang làm việc').first()).toBeVisible();

    // Verify Employee table rows
    await expect(page.locator('text=EMP-001')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn An')).toBeVisible();
    await expect(page.locator('#employee-data-table').locator('text=Phòng Sản Xuất')).toBeVisible();
    await expect(page.locator('#employee-data-table').locator('text=Quản Đốc Phân Xưởng')).toBeVisible();

    await expect(page.locator('text=EMP-002')).toBeVisible();
    await expect(page.locator('text=Trần Thị Mai')).toBeVisible();
  });

  test('switches tabs between Employees, Departments, and Positions', async ({ page }) => {
    await page.goto('/hr');

    // Switch to "Cơ Cấu Phòng Ban" tab
    const deptTabBtn = page.locator('#tab-departments');
    await deptTabBtn.click();
    await expect(page.locator('h3:has-text("Danh Sách Cơ Cấu Phòng Ban")')).toBeVisible();
    await expect(page.locator('h4:has-text("Phòng Sản Xuất")')).toBeVisible();
    await expect(page.locator('h4:has-text("Phòng Quản Lý Chất Lượng")')).toBeVisible();

    // Switch to "Chức Danh & Vị Trí" tab
    const posTabBtn = page.locator('#tab-positions');
    await posTabBtn.click();
    await expect(page.locator('h3:has-text("Danh Mục Chức Danh & Vị Trí")')).toBeVisible();
    await expect(page.locator('text=QD_SX')).toBeVisible();
    await expect(page.locator('text=NV_KCS')).toBeVisible();

    // Switch back to "Nhân Sự & Nhân Viên"
    const empTabBtn = page.locator('#tab-employees');
    await empTabBtn.click();
    await expect(page.locator('#employee-data-table')).toBeVisible();
  });

  test('opens and views employee detail modal', async ({ page }) => {
    await page.goto('/hr');

    // Click "Xem chi tiết" on first employee
    const viewBtn = page.locator('button[title="Xem chi tiết"]').first();
    await viewBtn.click();

    // Verify detail modal content
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#employee-detail-title')).toHaveText('Nguyễn Văn An');
    await expect(modal.locator('text=Mã NV: EMP-001')).toBeVisible();
    await expect(modal.locator('text=0901234567')).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('button:has-text("Đóng")');
    await closeBtn.click();
    await expect(modal).toBeHidden();
  });

  test('opens create employee dialog and validates required fields', async ({ page }) => {
    await page.goto('/hr');

    const addBtn = page.locator('#add-employee-button');
    await addBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#employee-dialog-title')).toHaveText('Thêm Mới Nhân Viên');

    // Fill form
    await page.fill('#employee_code', 'EMP-003');
    await page.fill('#last_name', 'Lê');
    await page.fill('#first_name', 'Hùng');
    await page.fill('#email', 'hung.le@its-qlsx.vn');
    await page.fill('#phone', '0933333333');
    await page.selectOption('#department_id', mockDeptProdId);
    await page.selectOption('#position_id', mockPosQdId);

    // Submit
    const submitBtn = page.locator('#submit-employee-form-btn');
    await submitBtn.click();

    // Verify dialog closes
    await expect(dialog).toBeHidden();
  });

  test('allows admin to edit and delete department and position', async ({ page }) => {
    await page.goto('/hr');

    // Switch to Departments tab
    await page.locator('#tab-departments').click();
    await expect(page.locator('h3:has-text("Danh Sách Cơ Cấu Phòng Ban")')).toBeVisible();

    // Verify edit and delete buttons are visible
    const editDeptBtn = page.locator('button[title="Chỉnh sửa phòng ban"]').first();
    await expect(editDeptBtn).toBeVisible();
    await editDeptBtn.click();

    // Edit dialog opens
    const deptDialog = page.locator('div[role="dialog"]');
    await expect(deptDialog).toBeVisible();
    await expect(deptDialog.locator('h3')).toHaveText('Chỉnh Sửa Phòng Ban');

    // Update department name
    await page.fill('#dept-name', 'Phòng Sản Xuất & Chế Biến');
    await page.locator('button[type="submit"]:has-text("Lưu thay đổi")').click();
    await expect(deptDialog).toBeHidden();

    // Test Delete department confirmation modal
    const deleteDeptBtn = page.locator('button[title="Xóa phòng ban"]').first();
    await deleteDeptBtn.click();
    const deleteDeptModal = page.locator('div[role="dialog"]');
    await expect(deleteDeptModal).toBeVisible();
    await expect(deleteDeptModal.locator('h3')).toHaveText('Xác Nhận Xóa Phòng Ban');
    await deleteDeptModal.locator('button:has-text("Hủy")').click();
    await expect(deleteDeptModal).toBeHidden();

    // Switch to Positions tab
    await page.locator('#tab-positions').click();
    await expect(page.locator('h3:has-text("Danh Mục Chức Danh & Vị Trí")')).toBeVisible();

    // Verify edit and delete buttons in table
    const editPosBtn = page.locator('button[title="Chỉnh sửa chức danh"]').first();
    await expect(editPosBtn).toBeVisible();
    await editPosBtn.click();

    // Edit dialog opens
    const posDialog = page.locator('div[role="dialog"]');
    await expect(posDialog).toBeVisible();
    await expect(posDialog.locator('h3')).toHaveText('Chỉnh Sửa Chức Danh');
    await page.locator('button[type="button"]:has-text("Hủy")').click();
    await expect(posDialog).toBeHidden();
  });
});
