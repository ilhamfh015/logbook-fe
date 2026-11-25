import { test, expect } from '@playwright/test';

test.describe('Alur Admin Master Data', () => {
  test('akses halaman impor CSV admin memerlukan autentikasi', async ({ page }) => {
    await page.goto('/admin/pengguna');
    await expect(page).toHaveURL(/\/login/);
  });
});
