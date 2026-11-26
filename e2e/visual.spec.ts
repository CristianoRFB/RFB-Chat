import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const dir='visual-evidence';
async function capture(page:Page,name:string){
 await mkdir(dir,{recursive:true});
 await page.screenshot({path:dir+'/'+name+'.png',animations:'disabled',caret:'hide'});
}
async function register(page:Page,name:string,email:string){
 await page.goto('/');
 await page.getByRole('button',{name:'Criar uma conta no emulador'}).click();
 await page.getByRole('textbox',{name:'Nome de exibição'}).fill(name);
 await page.getByRole('textbox',{name:'E-mail de teste'}).fill(email);
 await page.getByLabel('Senha').fill('somente-dados-sinteticos-2026');
 await page.getByRole('button',{name:'Criar conta local'}).click();
 await expect(page.locator('#own-uid')).toBeVisible();
 return page.locator('#own-uid').inputValue();
}
async function send(page:Page,text:string){
 await page.locator('#message-text').fill(text);
 await page.getByRole('button',{name:'Enviar',exact:true}).click();
 await expect(page.locator('.message.outgoing').filter({hasText:text})).toBeVisible();
}
test('EVOLVE 04: evidência visual real, temas, filtros, teclado e responsividade',async({browser})=>{
 test.setTimeout(90000);
 const a=await browser.newContext({viewport:{width:1440,height:900}}),b=await browser.newContext({viewport:{width:1440,height:900}});
 try{
  const alice=await a.newPage(),bob=await b.newPage(),suffix=String(Date.now());
  await alice.goto('/');await expect(alice.getByRole('heading',{name:'Entrar no RFB Chat'})).toBeVisible();
  await capture(alice,'01-login-dark-1440');
  await register(alice,'Marina Costa','visual-marina-'+suffix+'@example.test');
  const uidB=await register(bob,'Rafael Lima','visual-rafael-'+suffix+'@example.test');
  await alice.locator('#target-uid').fill(uidB);await alice.getByRole('button',{name:'Criar conversa'}).click();
  await expect(alice.getByRole('heading',{name:'Rafael Lima'})).toBeVisible();
  await expect(bob.getByRole('heading',{name:'Marina Costa'})).toBeVisible();
  await send(alice,'Rafael, revisei o fluxo de cadastro. Podemos validar a versão às 15h?');
  await expect(bob.getByText('Rafael, revisei o fluxo de cadastro. Podemos validar a versão às 15h?',{exact:true})).toBeVisible();
  await send(bob,'Combinado. Vou conferir os casos de erro e o layout no celular.');
  await expect(alice.getByText('Combinado. Vou conferir os casos de erro e o layout no celular.',{exact:true})).toBeVisible();
  await send(alice,'Ótimo. Depois registramos as evidências e os ajustes no relatório.');
  await expect(bob.locator('.message.incoming')).toHaveCount(2);
  await alice.getByRole('button',{name:'Grupos',exact:true}).click();
  await expect(alice.getByText('Nenhuma conversa corresponde ao filtro.')).toBeVisible();
  await alice.getByRole('button',{name:'Pessoas',exact:true}).click();
  await expect(alice.locator('.conversation-list .conversation')).toHaveCount(1);
  await alice.getByRole('button',{name:'Todas',exact:true}).click();
  await alice.locator('#search-conversations').fill('rafael');
  await expect(alice.locator('.conversation-list .conversation')).toHaveCount(1);
  await alice.locator('#search-conversations').fill('');
  await alice.locator('#search-message-body').fill('celular');
  await expect(alice.locator('.messages .message')).toHaveCount(1);
  await alice.locator('#search-message-body').fill('');
  await expect(alice.locator('.messages .message')).toHaveCount(3);
  await alice.locator('.chat-sidebar').evaluate(el=>el.scrollTop=0);
  await alice.locator('.chat-panel').evaluate(el=>el.scrollTop=0);
  await expect(alice.locator('.messages .message').last()).toBeInViewport({ratio:0.8});
  await capture(alice,'02-chat-dark-1440');
  await alice.getByRole('button',{name:'Ativar tema claro'}).click();
  await expect(alice.locator('html')).toHaveAttribute('data-theme','light');
  await capture(alice,'03-chat-light-1440');
  await alice.reload();await expect(alice.locator('html')).toHaveAttribute('data-theme','light');
  await expect(alice.locator('.messages .message')).toHaveCount(3);
  for(const width of [320,360,390,430,768,1024,1440]){
   await alice.setViewportSize({width,height:900});
   expect(await alice.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'sem overflow horizontal '+width).toBe(true);
   const ratios=await alice.evaluate(()=>{
    const css=getComputedStyle(document.documentElement);
    const lum=(h:string)=>{let hex=h.trim().slice(1);if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');if(!/^[a-f0-9]{6}$/i.test(hex))throw new Error('Cor inválida: '+h);const v=hex.match(/.{2}/g)!.map(n=>parseInt(n,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
    return [['--ink','--panel'],['--muted','--panel'],['--primary-ink','--primary'],['--accent','--panel'],['--ink','--bubble-in'],['--ink','--bubble-out'],['--muted','--bubble-in'],['--muted','--bubble-out']].map(([x,y])=>{const a=lum(css.getPropertyValue(x)),b=lum(css.getPropertyValue(y));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
   });
   for(const ratio of ratios)expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
  await alice.setViewportSize({width:390,height:844});
  await alice.evaluate(()=>window.scrollTo(0,0));await capture(alice,'04-list-light-390');
  await alice.getByRole('link',{name:'Abrir conversa selecionada'}).click();
  await expect(alice.getByRole('heading',{name:'Rafael Lima'})).toBeVisible();
  await capture(alice,'05-chat-light-390');
  await alice.getByRole('link',{name:'Voltar à lista de conversas'}).click();
  await alice.setViewportSize({width:768,height:1024});
  await alice.evaluate(()=>window.scrollTo(0,0));await capture(alice,'06-tablet-light-768');
  await alice.setViewportSize({width:1440,height:900});await alice.getByRole('button',{name:'Ativar tema escuro'}).click();
  await alice.locator('#search-conversations').focus();await alice.keyboard.press('Tab');
  await expect(alice.getByRole('button',{name:'Todas',exact:true})).toBeFocused();
  await alice.keyboard.press('Tab');await expect(alice.getByRole('button',{name:'Pessoas',exact:true})).toBeFocused();
  await alice.keyboard.press('Enter');await expect(alice.getByRole('button',{name:'Pessoas',exact:true})).toHaveAttribute('aria-pressed','true');
 }finally{await a.close();await b.close();}
});
