import { test, expect } from '@playwright/test';

test('recupera perfil ausente após conta de autenticação criada no emulador', async ({ page, request }) => {
  const id = String(Date.now());
  const email = 'recovery-' + id + '@example.test';
  const password = 'testes-locais-2026';
  const response = await request.post(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key-for-emulator-only',
    { data: { email, password, returnSecureToken: true } }
  );
  expect(response.ok()).toBe(true);

  await page.goto('/');
  await page.getByRole('textbox', { name: 'E-mail de teste' }).fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar no laboratório' }).click();

  await expect(page.getByRole('heading', { name: 'Concluir perfil local' })).toBeVisible();
  await page.locator('#repair-profile-name').fill('Conta Recuperada');
  await page.getByRole('button', { name: 'Recriar perfil local' }).click();
  await expect(page.locator('#own-uid')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Conversas', exact: true })).toBeVisible();
});
