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
    await expect.poll(async()=>Number((await alice.getByTestId('rtp-audio').textContent())?.split(':').pop()),{timeout:25000}).toBeGreaterThan(0);
    await expect.poll(async()=>Number((await bob.getByTestId('rtp-audio').textContent())?.split(':').pop()),{timeout:25000}).toBeGreaterThan(0);
    await alice.getByRole('button',{name:'Silenciar microfone'}).click();
    await expect(alice.getByRole('button',{name:'Ativar microfone'})).toBeVisible();
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
    await alice.getByRole('button', { name: 'Parar e revisar áudio' }).click();
    await expect(alice.getByLabel('Prévia do áudio gravado')).toBeVisible();
    await expect(bob.getByLabel('Mensagem de voz')).toHaveCount(0);
    await alice.getByRole('button',{name:'Enviar áudio revisado'}).click();
    await expect(alice.getByText('Áudio salvo no emulador.')).toBeVisible();
    await expect(bob.getByLabel('Mensagem de voz')).toBeVisible();
    await expect(alice.locator('.message.outgoing').getByRole('button', { name: 'Editar' })).toHaveCount(0);
  } finally { await a.close(); await b.close(); }
});

test('imagem e vídeo sintéticos compartilhados na galeria privada com prévia real',async({browser})=>{
 test.setTimeout(90000);
 const a=await browser.newContext(),b=await browser.newContext();
 try{
  const alice=await a.newPage(),bob=await b.newPage(),suffix=String(Date.now());
  await register(alice,'image-a-'+suffix+'@example.test','Mídia Alfa');
  const uidB=await register(bob,'image-b-'+suffix+'@example.test','Mídia Beta');
  await alice.locator('#target-uid').fill(uidB);await alice.getByRole('button',{name:'Criar conversa'}).click();
  await expect(bob.getByRole('heading',{name:'Mídia Alfa'})).toBeVisible();
  await alice.getByText('Arquivos privados e links temporários',{exact:true}).click();
  await bob.getByText('Arquivos privados e links temporários',{exact:true}).click();
  const png=await alice.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
   const ctx=canvas.getContext('2d')!;ctx.fillStyle='#6d5ef7';ctx.fillRect(0,0,64,64);return canvas.toDataURL('image/png').split(',')[1];
  });
  await alice.locator('#private-file').setInputFiles({name:'imagem.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await alice.getByRole('button',{name:'Criar link privado'}).click();
  await bob.getByRole('button',{name:'Abrir imagem.png'}).click();
  await expect(bob.getByAltText('Prévia de imagem.png')).toBeVisible();
  await expect.poll(()=>bob.getByAltText('Prévia de imagem.png').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBe(64);
  await alice.getByRole('button',{name:'Excluir arquivo e revogar link'}).click();
  await expect(bob.getByAltText('Prévia de imagem.png')).toHaveCount(0);
  const video=await alice.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
   const ctx=canvas.getContext('2d')!;const stream=canvas.captureStream(10);
   const rec=new MediaRecorder(stream,{mimeType:'video/webm'});const chunks:BlobPart[]=[];
   rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const done=new Promise<string>(resolve=>{rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));stream.getTracks().forEach(t=>t.stop());};});
   rec.start();for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#333':'#999';ctx.fillRect(0,0,64,64);await new Promise(r=>setTimeout(r,100));}rec.stop();return done;
  });
  await alice.locator('#private-file').setInputFiles({name:'clipe.webm',mimeType:'video/webm',buffer:Buffer.from(video,'base64')});
  await alice.getByRole('button',{name:'Criar link privado'}).click();
  await bob.getByRole('button',{name:'Abrir clipe.webm'}).click();
  await expect(bob.getByLabel('Prévia de clipe.webm')).toBeVisible();
  await expect.poll(()=>bob.getByLabel('Prévia de clipe.webm').evaluate((el:HTMLVideoElement)=>el.videoWidth)).toBe(64);
 }finally{await a.close();await b.close();}
});
