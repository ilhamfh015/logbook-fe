import { test, expect } from '@playwright/test';

test.describe('Autentikasi & Validasi Sesi', () => {
  test('membuka halaman utama tanpa login mengarahkan ke /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible();
  });

  test('validasi pesan error saat kredensial kosong', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByText('Email wajib diisi.')).toBeVisible();
  });

  test('login sukses dengan email dan password valid', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('rina.talent@contoh.id');
    await page.getByLabel('Kata sandi').fill('Logbook@2026');
    await page.getByRole('button', { name: 'Masuk' }).click();
    
    await expect(page).toHaveURL(/\/(?!login)/, { timeout: 15_000 });
  });
});
