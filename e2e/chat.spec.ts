import { test, expect, type Page } from '@playwright/test';

test.beforeAll(async () => {
  // O webServer espera o Firestore (8080), mas o Auth (9099) pode iniciar depois.
  // Verificação concreta de disponibilidade HTTP antes da criação das contas.
  await expect.poll(async () => {
    const endpoints = ['http://127.0.0.1:8080/', 'http://127.0.0.1:9099/'];
    const available = await Promise.all(endpoints.map(async url => {
      try { await fetch(url, { signal: AbortSignal.timeout(1000) }); return true; }
      catch { return false; }
    }));
    return available.every(Boolean);
  }, { timeout: 30_000, intervals: [500, 1000, 2000] }).toBe(true);
});

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
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator('#target-uid')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, 'Layout sem rolagem horizontal em ' + width + 'px').toBe(false);
    }
  } finally {
    await context.close();
  }
});

test('grupo só adiciona segundo membro depois do aceite do convite', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  try {
    const first = await a.newPage();
    const second = await b.newPage();
    const id = String(Date.now());
    await createTestAccount(first, 'Gestor Grupo', 'gestor-' + id + '@example.test');
    const uidB = await createTestAccount(second, 'Membro Grupo', 'membro-' + id + '@example.test');
    await first.getByText('Criar grupo', { exact: true }).first().click();
    await first.locator('#group-create-title').fill('Grupo de Testes');
    await first.getByRole('button', { name: 'Criar grupo' }).click();
    await expect(first.getByRole('heading', { name: 'Grupo de Testes' })).toBeVisible();
    const code = await first.locator('#group-code').inputValue();
    await first.locator('#invite-uid').fill(uidB);
    await first.getByRole('button', { name: 'Enviar convite' }).click();
    await expect(first.getByText('Convite enviado.')).toBeVisible();
    await second.getByText('Aceitar convite', { exact: true }).click();
    await second.locator('#join-group-code').fill(code);
    await second.getByRole('button', { name: 'Entrar no grupo' }).click();
    await expect(second.getByRole('heading', { name: 'Grupo de Testes' })).toBeVisible();
    await expect(first.locator('.conversation-list .conversation').filter({ hasText: 'Grupo de Testes' }).getByText('2 participantes')).toBeVisible();
    await first.getByText('Canais do grupo').click();
    await second.getByText('Canais do grupo').click();
    await first.locator('#channel-name').fill('Avisos');
    await first.locator('#channel-description').fill('Informações da equipe');
    await first.getByRole('button', { name: 'Criar canal' }).click();
    await expect(second.getByRole('button', { name: '# Avisos' })).toBeVisible();
    await second.locator('#channel-message-text').fill('Canal recebido ' + id);
    await second.getByRole('button', { name: 'Enviar ao canal' }).click();
    await expect(first.getByText('Canal recebido ' + id)).toBeVisible();
    await first.locator('#role-uid').selectOption(uidB);
    await first.getByRole('button', { name: 'Alternar administrador' }).click();
    await expect(first.getByText('2 participantes, 2 administradores')).toBeVisible();
  } finally { await a.close(); await b.close(); }
});
