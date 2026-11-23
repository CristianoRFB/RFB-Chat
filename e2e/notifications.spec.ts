import { test, expect, type Page } from '@playwright/test';

async function account(page: Page, name: string, email: string): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar uma conta no emulador' }).click();
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill(name);
  await page.getByRole('textbox', { name: 'E-mail de teste' }).fill(email);
  await page.getByLabel('Senha').fill('senha-de-teste-2026');
  await page.getByRole('button', { name: 'Criar conta local' }).click();
  await expect(page.locator('#own-uid')).toBeVisible();
  return page.locator('#own-uid').inputValue();
}

test('notificações, alternância de conversa e privacidade da confirmação de leitura', async ({ browser }) => {
  test.setTimeout(90_000);
  const a = await browser.newContext(), b = await browser.newContext(), c = await browser.newContext();
  try {
    const alice = await a.newPage(), bob = await b.newPage(), charlie = await c.newPage();
    const suffix = String(Date.now());
    const uidA = await account(alice, 'Notificação Alfa', 'n-a-' + suffix + '@example.test');
    const uidB = await account(bob, 'Notificação Beta', 'n-b-' + suffix + '@example.test');
    await account(charlie, 'Notificação Gama', 'n-c-' + suffix + '@example.test');

    await alice.locator('#target-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(bob.getByRole('heading', { name: 'Notificação Alfa' })).toBeVisible();

    await charlie.locator('#target-uid').fill(uidB);
    await charlie.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(bob.locator('.conversation-list .conversation').filter({ hasText: 'Notificação Gama' })).toBeVisible();
    await bob.locator('.conversation-list .conversation').filter({ hasText: 'Notificação Gama' }).click();

    await bob.getByText('Notificações de mensagens', { exact: true }).click();
    await alice.locator('#message-text').fill('Aviso novo ' + suffix);
    await alice.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(bob.getByRole('button', { name: /1 não lidas/ })).toBeVisible();
    await bob.getByRole('button', { name: /1 não lidas/ }).click();
    await expect(bob.getByText('Aviso novo ' + suffix, { exact: true })).toBeVisible();
    await expect(bob.locator('.unread-line').filter({ hasText: '0 não lidas' }).first()).toBeVisible();
    await expect(alice.locator('.message.outgoing .message-meta')).toContainText('Lida');

    await bob.getByText('Perfil e privacidade', { exact: true }).click();
    await bob.getByLabel('Notificações dentro do aplicativo').uncheck();
    await expect(bob.getByText('Notificações desativadas nas preferências.')).toBeVisible();
    await bob.getByLabel('Notificações dentro do aplicativo').check();
    await bob.getByLabel('Enviar confirmação de leitura').uncheck();

    await alice.locator('#message-text').fill('Somente entregue ' + suffix);
    await alice.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(bob.getByText('Somente entregue ' + suffix, { exact: true })).toBeVisible();
    await expect(alice.locator('.message.outgoing').filter({ hasText: 'Somente entregue ' + suffix }).locator('.message-meta'))
      .toContainText('Entregue');
  } finally {
    await a.close(); await b.close(); await c.close();
  }
});
