import { test, expect } from '@playwright/test';

test.describe('Alur Utama Log Book (Talenta)', () => {
  test('halaman utama menampilkan ringkasan Log Book', async ({ page }) => {
    // Kunjungi halaman utama (akan redirect ke login jika belum auth)
    await page.goto('/');
    
    // Pastikan diarahkan ke halaman utama jika masih login
    if (page.url().includes('/login')) {
      await page.getByLabel('Email').fill('rina.talent@contoh.id');
      await page.getByLabel('Kata sandi').fill('Logbook@2026');
      await page.getByRole('button', { name: 'Masuk' }).click();
      await page.waitForURL('/', { timeout: 10_000 });
    }

    // Cek elemen khusus header "Log Book"
    await expect(page.locator('h2:has-text("Log Book")')).toBeVisible();
  });
});
