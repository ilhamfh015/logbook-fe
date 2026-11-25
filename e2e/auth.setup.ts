import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('autentikasi talent API dan simpan state', async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/api/auth/login`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    data: { email: 'rina.talent@contoh.id', password: 'Logbook@2026' },
  });
  
  if (!response.ok()) {
    console.error('Login failed status:', response.status());
    console.error('Response text:', await response.text());
  }
  expect(response.ok()).toBeTruthy();
  
  await request.storageState({ path: authFile });
});
