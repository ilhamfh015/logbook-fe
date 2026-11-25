import { test, expect } from '@playwright/test';

test.describe('Alur Atasan / Supervisor', () => {
  test('akses halaman tim tanpa autentikasi mengarahkan ke login', async ({ page }) => {
    await page.goto('/atasan/tim');
    await expect(page).toHaveURL(/\/login/);
  });
});
