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

async function setupMockAuthenticatedSession(page: Page) {
  // Mock Supabase Auth REST & RPC calls
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
      body: JSON.stringify([
        'production.plan.view',
        'production.plan.create',
        'production.plan.approve',
        'production.shift.view',
        'production.shift.write',
        'production.norms.view',
        'production.batch.view',
        'warehouse.view',
        'warehouse.stock.view',
        'warehouse.transaction.create',
        'maintenance.machine.view',
        'maintenance.schedule.view',
      ]),
    });
  });

  // Inject session into localStorage before initial script evaluation
  await page.addInitScript((user) => {
    const session = {
      access_token: 'mock-jwt-token-for-e2e',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user,
    };
    window.localStorage.setItem('sb-vymongseqpgevbxktujj-auth-token', JSON.stringify(session));
  }, mockUser);
}

test.describe('App Shell — Desktop Layout & Functionality (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await setupMockAuthenticatedSession(page);
  });

  test('renders full desktop shell with sidebar, header, breadcrumbs and page container', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Verify Desktop Sidebar is visible
    const desktopSidebar = page.locator('#desktop-sidebar');
    await expect(desktopSidebar).toBeVisible();
    await expect(desktopSidebar.locator('text=ITS-QLSX')).toBeVisible();

    // 2. Verify Header elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.locator('#theme-toggle-btn')).toBeVisible();
    await expect(page.locator('#notifications-btn')).toBeVisible();
    await expect(page.locator('#user-profile-menu-button')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn Admin').first()).toBeVisible();

    // 3. Verify Breadcrumbs root
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Trang chủ');

    // 4. Verify Page Container
    const h1 = page.locator('h1').first();
    await expect(h1).toHaveText('Tổng quan hệ thống');
  });

  test('navigates via sidebar and updates dynamic breadcrumbs and page container', async ({
    page,
  }) => {
    await page.goto('/');

    // Click "Sản xuất" menu to expand, then click "Kế hoạch sản xuất"
    const productionGroupBtn = page.locator('#desktop-sidebar button:has-text("Sản xuất")');
    await productionGroupBtn.click();

    const planLink = page.locator('#desktop-sidebar a[href="/production/plans"]');
    await expect(planLink).toBeVisible();
    await planLink.click();

    // Verify URL
    await expect(page).toHaveURL(/\/production\/plans/);

    // Verify dynamic Breadcrumbs
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Sản xuất');
    await expect(breadcrumb).toContainText('Kế hoạch sản xuất');

    // Verify Page Container on destination page
    await expect(page.locator('h1').first()).toHaveText('Kế hoạch sản xuất');
    await expect(
      page.locator('text=Module Kế hoạch sản xuất sẽ được triển khai chi tiết ở Phase 5.'),
    ).toBeVisible();
  });

  test('toggles sidebar collapse state and persists', async ({ page }) => {
    await page.goto('/');

    const desktopSidebar = page.locator('#desktop-sidebar');
    await expect(desktopSidebar).toHaveClass(/w-64/);

    // Toggle collapse
    const toggleBtn = page.locator('#desktop-sidebar-toggle');
    await toggleBtn.click();

    // Should now be collapsed (w-18)
    await expect(desktopSidebar).toHaveClass(/w-18/);

    // Verify state persisted in localStorage
    const storedState = await page.evaluate(() =>
      window.localStorage.getItem('its_sidebar_collapsed'),
    );
    expect(storedState).toBe('true');

    // Toggle back
    await toggleBtn.click();
    await expect(desktopSidebar).toHaveClass(/w-64/);
  });

  test('toggles theme and applies dark mode class to html', async ({ page }) => {
    await page.goto('/');

    const themeToggleBtn = page.locator('#theme-toggle-btn');
    await themeToggleBtn.click();

    // Select "Tối" (dark)
    const darkOption = page.locator('button[role="menuitem"]:has-text("Tối")');
    await expect(darkOption).toBeVisible();
    await darkOption.click();

    // Verify html tag has class "dark"
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(isDark).toBe(true);

    // Verify localStorage
    const savedTheme = await page.evaluate(() => window.localStorage.getItem('its_theme'));
    expect(savedTheme).toBe('dark');
  });

  test('triggers and renders toast notification', async ({ page }) => {
    await page.goto('/');

    const notifBtn = page.locator('#notifications-btn');
    await notifBtn.click();

    // Toast viewport should display status notification
    const toastStatus = page.locator('#toast-viewport [role="status"]');
    await expect(toastStatus).toBeVisible();
    await expect(toastStatus).toContainText('Hệ thống hoạt động bình thường');
  });

  test('opens profile menu and logs out', async ({ page }) => {
    await page.goto('/');

    const profileBtn = page.locator('#user-profile-menu-button');
    await profileBtn.click();

    const logoutMenuItem = page.locator('button[role="menuitem"]:has-text("Đăng xuất")');
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.click();

    // Redirected to /login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('App Shell — Mobile Drawer & Responsive Layout (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await setupMockAuthenticatedSession(page);
  });

  test('hides desktop sidebar and provides functional mobile drawer', async ({ page }) => {
    await page.goto('/');

    // 1. Desktop sidebar should not be visible in mobile view
    const desktopSidebar = page.locator('#desktop-sidebar');
    await expect(desktopSidebar).toBeHidden();

    // 2. Mobile hamburger button should be visible in header
    const hamburgerBtn = page.locator('#mobile-sidebar-toggle');
    await expect(hamburgerBtn).toBeVisible();

    // 3. Mobile sidebar drawer should initially be translated off-canvas
    const mobileSidebar = page.locator('#mobile-sidebar');
    await expect(mobileSidebar).toHaveClass(/-translate-x-full/);

    // 4. Click hamburger to open drawer
    await hamburgerBtn.click();
    await expect(mobileSidebar).toHaveClass(/translate-x-0/);

    // 5. Drawer should display brand and nav items
    await expect(mobileSidebar.locator('text=ITS-QLSX')).toBeVisible();

    // 6. Close drawer via close button
    const closeBtn = mobileSidebar.locator('button[aria-label="Đóng thanh điều hướng"]');
    await closeBtn.click();
    await expect(mobileSidebar).toHaveClass(/-translate-x-full/);
  });

  test('clicking link in mobile drawer navigates and closes drawer automatically', async ({
    page,
  }) => {
    await page.goto('/');

    const hamburgerBtn = page.locator('#mobile-sidebar-toggle');
    await hamburgerBtn.click();

    const mobileSidebar = page.locator('#mobile-sidebar');
    await expect(mobileSidebar).toHaveClass(/translate-x-0/);

    // Open "Kho & Vật tư" and click "Tồn kho & vật tư"
    const warehouseGroupBtn = mobileSidebar.locator('button:has-text("Kho & Vật tư")');
    await warehouseGroupBtn.click();

    const stockLink = mobileSidebar.locator('a[href="/warehouse/stock"]');
    await expect(stockLink).toBeVisible();
    await stockLink.click();

    // Verify navigated to /warehouse/stock
    await expect(page).toHaveURL(/\/warehouse\/stock/);

    // Drawer should have automatically closed
    await expect(mobileSidebar).toHaveClass(/-translate-x-full/);

    // Page title should be "Tồn kho & vật tư"
    await expect(page.locator('h1').first()).toHaveText('Tồn kho & vật tư');
  });
});
