import { test, expect, type Page } from '@playwright/test';

test.beforeAll(async () => {
  await expect.poll(async () => {
    const ports = [8080, 9099];
    const values = await Promise.all(ports.map(async port => {
      try { await fetch('http://127.0.0.1:' + port + '/', { signal: AbortSignal.timeout(1000) }); return true; }
      catch { return false; }
    }));
    return values.every(Boolean);
  }, { timeout: 30_000 }).toBe(true);
});

async function register(page: Page, who: string, email: string): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar uma conta no emulador' }).click();
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill(who);
  await page.getByRole('textbox', { name: 'E-mail de teste' }).fill(email);
  await page.getByLabel('Senha').fill('senha-segura-local-2026');
  await page.getByRole('button', { name: 'Criar conta local' }).click();
  await expect(page.locator('#own-uid')).toBeVisible();
  return page.locator('#own-uid').inputValue();
}

test('responder, editar, reagir, buscar, bloquear e denunciar com duas contas', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  try {
    const alice = await a.newPage();
    const bob = await b.newPage();
    const suffix = String(Date.now());
    await register(alice, 'Pessoa Alfa', 'alfa-extras-' + suffix + '@example.test');
    const uidB = await register(bob, 'Pessoa Beta', 'beta-extras-' + suffix + '@example.test');
    await alice.locator('#target-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(alice.getByRole('heading', { name: 'Pessoa Beta' })).toBeVisible();

    await alice.locator('#message-text').fill('Olá único ' + suffix);
    await alice.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(bob.getByText('Olá único ' + suffix, { exact: true })).toBeVisible();
    await bob.locator('.message.incoming').getByRole('button', { name: 'Reagir com 👍' }).click();
    await expect(alice.locator('.message.outgoing').getByRole('button', { name: 'Reagir com 👍' })).toContainText('1');

    await alice.locator('.message.outgoing').getByRole('button', { name: 'Editar' }).click();
    await alice.locator('#edit-text').fill('Olá corrigido ' + suffix);
    await alice.getByRole('button', { name: 'Salvar edição' }).click();
    await expect(bob.getByText('Olá corrigido ' + suffix, { exact: true })).toBeVisible();

    await bob.locator('.message.incoming').getByRole('button', { name: 'Responder' }).click();
    await bob.locator('#message-text').fill('Resposta editada ' + suffix);
    await bob.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(alice.getByText('Resposta editada ' + suffix, { exact: true })).toBeVisible();

    await alice.locator('#search-conversations').fill('Pessoa inexistente');
    await expect(alice.locator('.conversation-list .conversation')).toHaveCount(0);
    await alice.locator('#search-conversations').fill('Pessoa Beta');
    await expect(alice.locator('.conversation-list .conversation')).toHaveCount(1);

    await alice.getByText('Perfil e privacidade', { exact: true }).click();
    await alice.locator('#block-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Bloquear', exact: true }).click();
    await expect(alice.getByText('Usuário bloqueado.')).toBeVisible();
    await bob.locator('#message-text').fill('Mensagem impedida ' + suffix);
    await bob.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(bob.getByRole('alert')).toContainText('Acesso negado');

    await alice.getByText('Denunciar comportamento', { exact: true }).click();
    await alice.getByPlaceholder('Descreva a ocorrência…').fill('Teste de denúncia sobre a mensagem acima');
    await alice.getByRole('button', { name: 'Enviar denúncia' }).click();
    await expect(alice.getByText('Denúncia registrada para revisão por moderador autorizado.')).toBeVisible();
  } finally { await a.close(); await b.close(); }
});

test('arquivo TXT pequeno gera link temporário acessível só a um membro', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  try {
    const alice = await a.newPage();
    const bob = await b.newPage();
    const unique = String(Date.now());
    await register(alice, 'Pessoa Arquivo A', 'file-a-' + unique + '@example.test');
    const uidB = await register(bob, 'Pessoa Arquivo B', 'file-b-' + unique + '@example.test');
    await alice.locator('#target-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(alice.getByRole('heading', { name: 'Pessoa Arquivo B' })).toBeVisible();
    await alice.getByText('Arquivos privados e links temporários', { exact: true }).click();
    await alice.locator('#private-file').setInputFiles({
      name: 'relatorio.txt', mimeType: 'text/plain',
      buffer: Buffer.from('Texto de teste sem dados pessoais')
    });
    await alice.getByRole('button', { name: 'Criar link privado' }).click();
    const url = await alice.locator('#generated-file-link').inputValue();
    expect(url).toContain('file=');
    await bob.goto(url);
    await bob.getByText('Arquivos privados e links temporários', { exact: true }).click();
    await expect(bob.getByRole('link', { name: 'Baixar arquivo privado' })).toBeVisible();
  } finally { await a.close(); await b.close(); }
});
