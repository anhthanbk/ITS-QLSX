import { test, expect } from '@playwright/test';

test.describe('Application Bootstrap E2E', () => {
  test('loads home page, displays status badge, and supports user interaction', async ({ page }) => {
    await page.goto('/');

    // Verify title and main container
    await expect(page).toHaveTitle(/ITS QLSX/i);
    const appRoot = page.locator('#app-root');
    await expect(appRoot).toBeVisible();

    // Verify bootstrap status badge
    const badge = page.locator('#status-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/Bootstrap Ready/i);

    // Verify button interaction
    const testButton = page.locator('#interactive-test-button');
    await expect(testButton).toBeVisible();
    await expect(testButton).toHaveText('Interactive State Check (0)');

    await testButton.click();
    await expect(testButton).toHaveText('Interactive State Check (1)');
  });
});
