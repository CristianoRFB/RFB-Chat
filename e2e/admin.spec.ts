import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
async function register(page:Page,name:string,email:string){
 await page.goto('/');
 await page.getByRole('button',{name:'Criar uma conta no emulador'}).click();
 await page.getByRole('textbox',{name:'Nome de exibição'}).fill(name);
 await page.getByRole('textbox',{name:'E-mail de teste'}).fill(email);
 await page.getByLabel('Senha').fill('senha-local-2026');
 await page.getByRole('button',{name:'Criar conta local'}).click();
 await expect(page.locator('#own-uid')).toBeVisible();
 return page.locator('#own-uid').inputValue();
}
test('admin local delega e revoga moderação, restringe conta e analisa solicitação',async({browser})=>{
 test.setTimeout(120000);
 const a=await browser.newContext(),b=await browser.newContext();
 try{
  const admin=await a.newPage(),member=await b.newPage(),suffix=String(Date.now()),email='admin-'+suffix+'@example.test';
  const uidA=await register(admin,'Admin QA',email);
  const uidB=await register(member,'Membro QA','member-'+suffix+'@example.test');
  await expect(member.getByText('Administração de contas',{exact:true})).toHaveCount(0);
  await promisify(execFile)(process.execPath,['scripts/set-local-admin.mjs',uidA,'grant','--confirm-local']);
  await admin.getByRole('button',{name:'Sair',exact:true}).click();
  await admin.getByRole('textbox',{name:'E-mail de teste'}).fill(email);
  await admin.getByLabel('Senha').fill('senha-local-2026');
  await admin.getByRole('button',{name:'Entrar no laboratório'}).click();
  await admin.getByText('Administração de contas',{exact:true}).click();
  await expect(admin.locator('#admin-account option').filter({hasText:'Membro QA'})).toHaveAttribute('value',uidB);
  await admin.getByLabel('Conta',{exact:true}).selectOption({value:uidB},{timeout:15000});
  await expect(admin.getByLabel('Cargo',{exact:true})).toBeVisible();
  await mkdir('visual-evidence',{recursive:true});
  await admin.setViewportSize({width:1440,height:900});
  await admin.getByLabel('Cargo',{exact:true}).scrollIntoViewIfNeeded();
  await admin.screenshot({path:'visual-evidence/07-admin-desktop.png',animations:'disabled',caret:'hide'});
  await admin.setViewportSize({width:390,height:844});
  await admin.getByLabel('Cargo',{exact:true}).scrollIntoViewIfNeeded();
  expect(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await admin.screenshot({path:'visual-evidence/08-admin-mobile.png',animations:'disabled',caret:'hide'});
  await admin.setViewportSize({width:1440,height:900});
  async function change(role:string,status:string,reason:string){
   await admin.getByLabel('Cargo',{exact:true}).selectOption(role);
   await admin.getByLabel('Situação',{exact:true}).selectOption(status);
   await admin.getByLabel('Justificativa',{exact:true}).fill(reason);
   admin.once('dialog',dialog=>void dialog.accept());
   await admin.getByRole('button',{name:'Aplicar alteração de acesso'}).click();
   await expect(admin.getByText('Alteração registrada e auditada.',{exact:true})).toBeVisible();
  }
  await change('moderator','active','Delegação sintética de moderação');
  await expect(member.getByText(/Moderação ·/)).toBeVisible();
  await expect(member.getByText('Administração de contas',{exact:true})).toHaveCount(0);
  await change('member','suspended','Suspensão sintética para QA');
  await expect(member.getByRole('alert').filter({hasText:'Conta suspensa: acesso de leitura'})).toBeVisible();
  await expect(member.getByText(/Moderação ·/)).toHaveCount(0);
  await change('member','banned','Banimento sintético para QA');
  await expect(member.getByRole('heading',{name:'Conta banida da mensageria'})).toBeVisible();
  await member.getByText('Meus dados e solicitações',{exact:true}).click();
  await member.getByLabel('Tipo de solicitação').selectOption('appeal');
  await member.getByRole('button',{name:'Registrar solicitação'}).click();
  await expect(member.getByText('Contestação de restrição: Recebida',{exact:true})).toBeVisible();
  await admin.getByText('Solicitações de privacidade',{exact:true}).click();
  await admin.getByRole('button',{name:'Iniciar análise'}).click();
  await expect(member.getByText('Contestação de restrição: Em análise',{exact:true})).toBeVisible();
  await change('member','active','Restauração sintética para QA');
  await expect(member.locator('#own-uid')).toBeVisible();
  await expect(admin.getByText('Restauração sintética para QA',{exact:true})).toBeVisible();
 }finally{await a.close();await b.close();}
});
