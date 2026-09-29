import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Protection E2E Flow', () => {
  test('redirects unauthenticated user from / to /login', async ({ page }) => {
    await page.goto('/');

    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2')).toHaveText('Đăng Nhập Hệ Thống');

    // Verify login form inputs are present
    const emailInput = page.locator('#login-email-input');
    const passwordInput = page.locator('#login-password-input');
    const submitBtn = page.locator('#login-submit-button');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('toggles between sign in and sign up modes', async ({ page }) => {
    await page.goto('/login');

    const toggleBtn = page.locator('button:has-text("Chưa có tài khoản? Đăng ký người dùng mới")');
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();
    await expect(page.locator('h2')).toHaveText('Đăng Ký Tài Khoản Mới');

    const nameInput = page.locator('#signup-name-input');
    await expect(nameInput).toBeVisible();

    // Toggle back to login
    const backToLoginBtn = page.locator('button:has-text("Đã có tài khoản? Quay lại đăng nhập")');
    await backToLoginBtn.click();
    await expect(page.locator('h2')).toHaveText('Đăng Nhập Hệ Thống');
  });

  test('displays validation error alert on invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email-input', 'nonexistent@its-qlsx.vn');
    await page.fill('#login-password-input', 'WrongPassword123');
    await page.click('#login-submit-button');

    const errorAlert = page.locator('#login-error-alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('accessing protected /forbidden route directly displays 403 screen', async ({ page }) => {
    await page.goto('/forbidden');

    const container = page.locator('#forbidden-container');
    await expect(container).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Bạn không có quyền truy cập khu vực này');
  });
});
