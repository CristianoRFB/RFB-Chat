import { test, expect, type Page } from '@playwright/test';

test.beforeAll(async () => {
  await expect.poll(async () => {
    const checks = await Promise.all([8080, 9099].map(async port => {
      try { await fetch('http://127.0.0.1:' + port, { signal: AbortSignal.timeout(1200) }); return true; }
      catch { return false; }
    }));
    return checks.every(Boolean);
  }, { timeout: 30000 }).toBe(true);
});

async function register(page: Page, email: string, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar uma conta no emulador' }).click();
  await page.getByRole('textbox', { name: 'Nome de exibição' }).fill(name);
  await page.getByRole('textbox', { name: 'E-mail de teste' }).fill(email);
  await page.getByLabel('Senha').fill('senha-local-2026');
  await page.getByRole('button', { name: 'Criar conta local' }).click();
  await expect(page.locator('#own-uid')).toBeVisible();
  return page.locator('#own-uid').inputValue();
}

test('convite e encerramento de chamada P2P de voz local sem dados pessoais', async ({ browser }) => {
  const a = await browser.newContext({ permissions: ['microphone'] });
  const b = await browser.newContext({ permissions: ['microphone'] });
  try {
    const alice = await a.newPage(), bob = await b.newPage(), suffix = String(Date.now());
    await register(alice, 'caller-' + suffix + '@example.test', 'Ligação Alfa');
    const uidB = await register(bob, 'callee-' + suffix + '@example.test', 'Ligação Beta');
    await alice.locator('#target-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(bob.getByRole('heading', { name: 'Ligação Alfa' })).toBeVisible();
    await alice.getByText('Chamada de voz local (experimental)').click();
    await bob.getByText('Chamada de voz local (experimental)').click();
    await alice.locator('.call-consent input').check();
    await bob.locator('.call-consent input').check();
    await alice.getByRole('button', { name: 'Iniciar chamada local' }).click();
    await expect(bob.getByRole('button', { name: 'Aceitar chamada' })).toBeVisible();
    await bob.getByRole('button', { name: 'Aceitar chamada' }).click();
    await expect(alice.getByText('Chamada aceita', { exact: true })).toBeVisible();
    await alice.getByRole('button', { name: 'Encerrar chamada' }).click();
    await expect(bob.getByRole('button', { name: 'Iniciar chamada local' })).toBeVisible();
  } finally { await a.close(); await b.close(); }
});

test('áudio de curta duração com consentimento fica disponível para outro membro', async ({ browser }) => {
  const a = await browser.newContext({ permissions: ['microphone'] });
  const b = await browser.newContext({ permissions: ['microphone'] });
  try {
    const alice = await a.newPage(), bob = await b.newPage(), suffix = String(Date.now());
    await register(alice, 'voice-a-' + suffix + '@example.test', 'Áudio Alfa');
    const uidB = await register(bob, 'voice-b-' + suffix + '@example.test', 'Áudio Beta');
    await alice.locator('#target-uid').fill(uidB);
    await alice.getByRole('button', { name: 'Criar conversa' }).click();
    await expect(bob.getByRole('heading', { name: 'Áudio Alfa' })).toBeVisible();
    await alice.getByLabel('Autorizo a gravação da minha voz nesta conversa de teste').check();
    await alice.getByRole('button', { name: 'Gravar mensagem de voz' }).click();
    await expect(alice.getByText('Microfone ativo.')).toBeVisible();
    await alice.waitForTimeout(1500);
    await alice.getByRole('button', { name: 'Parar e enviar áudio' }).click();
    await expect(alice.getByText('Áudio salvo no emulador.')).toBeVisible();
    await expect(bob.getByLabel('Mensagem de voz')).toBeVisible();
  } finally { await a.close(); await b.close(); }
});
