import { test, expect, type Page } from '@playwright/test';

async function createTestAccount(page: Page, name: string, email: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar uma conta no emulador' }).click();
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill(name);
  await page.getByRole('textbox', { name: 'E-mail de teste' }).fill(email);
  await page.getByLabel('Senha').fill('senha-laboratorio-2026');
  await page.getByRole('button', { name: 'Criar conta local' }).click();
  await expect(page.locator('#own-uid')).toBeVisible();
  return page.locator('#own-uid').inputValue();
}

test('duas contas trocam mensagens reais e recuperam histórico após reload', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  try {
    const first = await firstContext.newPage();
    const second = await secondContext.newPage();
    const id = String(Date.now());
    const firstUid = await createTestAccount(first, 'Pessoa Alfa', 'alfa-' + id + '@example.test');
    const secondUid = await createTestAccount(second, 'Pessoa Beta', 'beta-' + id + '@example.test');
    expect(firstUid).not.toEqual(secondUid);

    await first.locator('#target-uid').fill(secondUid);
    await first.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(first.getByRole('heading', { name: 'Pessoa Beta' })).toBeVisible();

    const messageA = 'Mensagem alfa ' + id;
    await first.locator('#message-text').fill(messageA);
    await first.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(second.getByText(messageA)).toBeVisible();

    await second.reload();
    await expect(second.getByText(messageA)).toBeVisible();
    const messageB = 'Resposta beta ' + id;
    await second.locator('#message-text').fill(messageB);
    await second.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(first.getByText(messageB)).toBeVisible();

    await first.getByRole('button', { name: 'Sair' }).click();
    await expect(first.getByRole('heading', { name: 'Entrar no RFB Chat' })).toBeVisible();
    await expect(first.getByText(messageB)).toHaveCount(0);
  } finally {
    await firstContext.close();
    await secondContext.close();
  }
});

test('layout mobile mantém fluxo básico acessível', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await createTestAccount(page, 'Pessoa Móvel', 'movel-' + Date.now() + '@example.test');
    await expect(page.getByRole('heading', { name: 'Conversas', exact: true })).toBeVisible();
    await expect(page.locator('#target-uid')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  } finally {
    await context.close();
  }
});
