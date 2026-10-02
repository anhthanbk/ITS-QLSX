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

const mockProfile = {
  id: mockUserId,
  full_name: 'Nguyễn Văn Admin',
  phone: '0901234567',
  date_of_birth: '1990-01-01',
  id_card_number: '001090001234',
  employee_id: 'EMP-001',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  departments: { id: mockDeptProdId, name: 'Phòng Sản Xuất', code: 'SX' },
  positions: { id: mockPosQdId, title: 'Quản Đốc Phân Xưởng', code: 'QD_SX' },
};

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
    profiles: {
      id: 'mock-profile-user-1',
      status: 'active',
      full_name: 'Nguyễn Văn An',
      avatar_url: null,
      date_of_birth: '1990-01-01',
      id_card_number: '001090001234',
      user_roles: [
        {
          role_id: 'role-operator',
          roles: { id: 'role-operator', code: 'operator', name: 'Nhân viên vận hành' },
        },
      ],
    },
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
    profiles: null,
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
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockProfile,
          ...payload,
          updated_at: new Date().toISOString(),
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfile),
      });
    }
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

  // Mock System Roles for Account Provisioning
  await page.route('**/rest/v1/roles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'role-admin', code: 'admin', name: 'Quản trị hệ thống' },
        { id: 'role-plant-manager', code: 'plant_manager', name: 'Giám đốc nhà máy' },
        { id: 'role-shift-leader', code: 'shift_leader', name: 'Trưởng ca sản xuất' },
        { id: 'role-operator', code: 'operator', name: 'Nhân viên vận hành' },
        { id: 'role-qc', code: 'qc_inspector', name: 'KCS / Kiểm soát chất lượng' },
        { id: 'role-wh', code: 'warehouse_keeper', name: 'Thủ kho' },
      ]),
    });
  });

  // Mock Pending Registrations RPCs
  await page.route('**/rest/v1/rpc/get_pending_registrations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'cand-profile-1',
          full_name: 'Lê Văn Ứng Viên',
          avatar_url: null,
          email: 'ungvien@its-qlsx.vn',
          phone: '0988776655',
          date_of_birth: '1998-08-18',
          id_card_number: '001298007788',
          department_id: mockDeptProdId,
          position_id: mockPosQdId,
          temp_employee_code: 'SX-QD-001',
          status: 'pending',
          rejection_reason: null,
          created_at: '2026-09-30T00:00:00Z',
          department_name: 'Phòng Sản Xuất',
          department_code: 'SX',
          position_title: 'Quản Đốc Phân Xưởng',
          position_code: 'QD_SX',
        },
        {
          id: 'cand-profile-2',
          full_name: 'Trần Thị Tuyết',
          avatar_url: null,
          email: 'tuchoi@its-qlsx.vn',
          phone: '0911223344',
          date_of_birth: '1995-05-20',
          id_card_number: '001095009988',
          department_id: mockDeptQcId,
          position_id: mockPosKcsId,
          temp_employee_code: 'KCS-NV-002',
          status: 'rejected',
          rejection_reason: 'Số CCCD không đúng định dạng',
          created_at: '2026-09-29T10:00:00Z',
          department_name: 'Phòng Quản Lý Chất Lượng',
          department_code: 'KCS',
          position_title: 'Nhân Viên Kiểm Phẩm',
          position_code: 'NV_KCS',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/rpc/admin_approve_registration*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, employee_id: 'new-emp-id', employee_code: 'SX-QD-001' }),
    });
  });

  await page.route('**/rest/v1/rpc/admin_reject_registration*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/rest/v1/rpc/admin_delete_employee_and_account*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, mode: 'deleted' }),
    });
  });

  await page.route('**/rest/v1/rpc/admin_delete_registration_profile*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/rest/v1/rpc/resubmit_rejected_registration*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, status: 'pending', temp_employee_code: 'SX-TC-005' }),
    });
  });


  await page.route('**/rest/v1/rpc/admin_update_employee_with_profile*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, employee_id: 'e1111111-1111-1111-1111-111111111111' }),
    });
  });

  await page.route('**/rest/v1/rpc/admin_reset_user_password*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(true),
    });
  });

  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
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

  test('disallows direct employee creation by admin and ensures add employee button is removed', async ({ page }) => {
    await page.goto('/hr');

    // Verify add employee button does not exist
    const addBtn = page.locator('#add-employee-button');
    await expect(addBtn).toHaveCount(0);
  });

  test('allows admin to edit employee with full profile details and password reset option', async ({ page }) => {
    await page.goto('/hr');

    // Click edit on first employee
    const editBtn = page.locator('button[title="Chỉnh sửa"]').first();
    await editBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#employee-dialog-title')).toHaveText('Chỉnh Sửa Hồ Sơ Nhân Viên');

    // Verify profile fields are present
    await expect(dialog.locator('#employee_code')).toHaveValue('EMP-001');
    await expect(dialog.locator('#date_of_birth')).toBeVisible();
    await expect(dialog.locator('#id_card_number')).toBeVisible();

    // Verify admin password reset section
    await expect(dialog.locator('text=Quản lý mật khẩu đăng nhập (Dành cho Admin)')).toBeVisible();
    await expect(dialog.locator('#new_password')).toBeVisible();

    // Update phone & DOB
    await page.fill('#phone', '0909999888');
    await page.fill('#date_of_birth', '1992-05-20');
    await page.fill('#id_card_number', '001200000123');

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

  test('displays pending registrations tab and allows admin to review and approve candidate registration', async ({ page }) => {
    await page.goto('/hr');

    // Click "Chờ Xét Duyệt" tab
    const pendingTabBtn = page.locator('#tab-pending');
    await expect(pendingTabBtn).toBeVisible();
    await pendingTabBtn.click();

    // Verify candidate row with temporary code
    await expect(page.locator('#pending-registrations-table')).toBeVisible();
    await expect(page.locator('text=SX-QD-001')).toBeVisible();
    await expect(page.locator('text=Lê Văn Ứng Viên')).toBeVisible();

    // Click "Xem & Duyệt"
    const reviewBtn = page.locator('button:has-text("Xem & Duyệt")').first();
    await reviewBtn.click();

    // Review dialog opens
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#approve-modal-title')).toHaveText('Xét duyệt hồ sơ đăng ký tài khoản');
    await expect(modal.locator('text=ungvien@its-qlsx.vn')).toBeVisible();
    await expect(modal.locator('#modal_employee_code')).toHaveValue('SX-QD-001');

    // Submit approval
    const approveBtn = modal.locator('button:has-text("Phê duyệt & Tạo nhân viên")');
    await approveBtn.click();

    // Modal closes
    await expect(modal).toBeHidden();
  });

  test('allows logged in user to view and edit personal profile and change password', async ({ page }) => {
    await page.goto('/profile');

    // Profile page elements
    await expect(page.locator('h1')).toHaveText('Hồ Sơ & Tài Khoản Cá Nhân');
    await expect(page.locator('#profile-display-name')).toHaveText('Nguyễn Văn Admin');
    await expect(page.locator('#full_name')).toHaveValue('Nguyễn Văn Admin');
    await expect(page.locator('#phone')).toHaveValue('0901234567');

    // Edit personal details
    await page.fill('#full_name', 'Nguyễn Văn Admin (Đã Sửa)');
    await page.fill('#phone', '0988776655');
    await page.fill('#date_of_birth', '1990-10-15');
    await page.fill('#id_card_number', '001090123456');

    // Save profile
    const saveBtn = page.locator('#save-profile-btn');
    await saveBtn.click();

    // Verify personal security section
    await expect(page.locator('text=Bảo Mật & Mật Khẩu Cá Nhân')).toBeVisible();
    await page.fill('#new_password_input', 'NewPass123456!');
    await page.fill('#confirm_password_input', 'NewPass123456!');

    const updatePwdBtn = page.locator('#update-password-btn');
    await updatePwdBtn.click();
  });

  test('displays smart role suggestion, role scope card, and admin security alert in approval modal', async ({ page }) => {
    await page.goto('/hr');
    await page.locator('#tab-pending').click();

    // Click "Xem & Duyệt" on candidate with QD_SX position
    const reviewBtn = page.locator('button:has-text("Xem & Duyệt")').first();
    await reviewBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Smart auto-suggest should select plant_manager for QD_SX position
    const roleSelect = modal.locator('#modal_role_code');
    await expect(roleSelect).toHaveValue('plant_manager');

    // Role Scope Card should be rendered
    await expect(modal.locator('text=Phạm vi quyền hạn vai trò:')).toBeVisible();
    await expect(modal.locator('text=Duyệt kế hoạch sản xuất, giám sát OEE dây chuyền')).toBeVisible();

    // Changing to admin role triggers security alert
    await roleSelect.selectOption('admin');
    await expect(modal.locator('text=Cảnh báo bảo mật quyền Admin')).toBeVisible();

    // Close modal
    await modal.locator('button[aria-label="Đóng"]').click();
    await expect(modal).toBeHidden();
  });

  test('confirms permanent account deletion in delete employee dialog', async ({ page }) => {
    await page.goto('/hr');

    // Click Delete on first employee in table
    const deleteBtn = page.locator('button[title="Xóa nhân viên"]').first();
    await deleteBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Xác nhận xóa nhân viên & Hủy tài khoản')).toBeVisible();
    await expect(dialog.locator('text=Tài khoản đăng nhập hệ thống của nhân viên này sẽ bị xóa hoàn toàn khỏi Supabase Auth')).toBeVisible();

    // Cancel deletion
    await dialog.locator('button:has-text("Hủy")').click();
    await expect(dialog).toBeHidden();
  });

  test('displays status badges and delete registration dialog in pending tab', async ({ page }) => {
    await page.goto('/hr');
    await page.locator('#tab-pending').click();

    // Verify status badges
    await expect(page.getByText('Chờ duyệt', { exact: true })).toBeVisible();
    await expect(page.getByText('Bị từ chối', { exact: true })).toBeVisible();
    await expect(page.locator('text=Số CCCD không đúng định dạng')).toBeVisible();

    // Click trash button on rejected candidate
    const trashBtn = page.locator('[data-testid="btn-delete-reg-KCS-NV-002"]');
    await expect(trashBtn).toBeVisible();
    await trashBtn.click();

    // Verify deletion dialog
    const deleteDialog = page.locator('div[role="dialog"]');
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog.locator('text=Xóa vĩnh viễn hồ sơ đăng ký')).toBeVisible();
    await expect(deleteDialog.locator('text=Tài khoản đăng nhập sẽ bị xóa hoàn toàn khỏi hệ thống Supabase Auth')).toBeVisible();

    // Cancel deletion
    await deleteDialog.locator('button:has-text("Hủy")').click();
    await expect(deleteDialog).toBeHidden();
  });

  test('displays rejection details and reapply form on pending approval page', async ({ page }) => {
    // Setup rejected profile mock
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockProfile,
          status: 'rejected',
          rejection_reason: 'Ảnh chân dung không rõ mặt và CCCD bị mờ',
        }),
      });
    });

    await page.goto('/pending-approval');

    // Verify rejected screen
    await expect(page.locator('text=Hồ Sơ Bị Từ Chối Phê Duyệt')).toBeVisible();
    await expect(page.locator('text=Ảnh chân dung không rõ mặt và CCCD bị mờ')).toBeVisible();

    // Click "Chỉnh sửa hồ sơ & Gửi lại xét duyệt"
    const reapplyBtn = page.locator('[data-testid="btn-reapply"]');
    await expect(reapplyBtn).toBeVisible();
    await reapplyBtn.click();

    // Verify edit form fields
    await expect(page.locator('text=Chỉnh sửa & Cập nhật hồ sơ')).toBeVisible();
    await expect(page.locator('#resubmit-fullname')).toHaveValue('Nguyễn Văn Admin');
    await expect(page.locator('#resubmit-dept')).toBeVisible();
    await expect(page.locator('#resubmit-pos')).toBeVisible();

    // Submit reapply
    const submitBtn = page.locator('button:has-text("Gửi lại xét duyệt")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
  });
});

