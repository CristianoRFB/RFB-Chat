import {test,expect,type Page} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
test.skip(!process.env.RFB_PERF_VARIANT,'Benchmark somente em worktree instrumentado');
async function account(page:Page,name:string,email:string){
 await page.goto('/');
 await page.getByRole('button',{name:'Criar uma conta no emulador'}).click();
 await page.getByRole('textbox',{name:'Nome de exibição'}).fill(name);
 await page.getByRole('textbox',{name:'E-mail de teste'}).fill(email);
 await page.getByLabel('Senha').fill('somente-benchmark-sintetico');
 await page.getByRole('button',{name:'Criar conta local'}).click();
 await expect(page.locator('#own-uid')).toBeVisible();
 return page.locator('#own-uid').inputValue();
}
async function stats(p:Page){return p.evaluate(()=>{const w=window as unknown as {__rfbPerf?:Record<string,{active:number;started:number}>};return JSON.parse(JSON.stringify(w.__rfbPerf??{}));});}
test('benchmark pareado de assinaturas reais e entrega local',async({browser})=>{
 test.setTimeout(120000);
 const contexts=await Promise.all(Array.from({length:4},()=>browser.newContext()));
 try{
  const pages=await Promise.all(contexts.map(c=>c.newPage())),suffix=Date.now(),main=pages[0];
  const uid=await account(main,'Benchmark titular','perf-main-'+suffix+'@example.test');
  for(let i=1;i<4;i++){
   await account(pages[i],'Benchmark '+i,'perf-'+i+'-'+suffix+'@example.test');
   await pages[i].locator('#target-uid').fill(uid);
   await pages[i].getByRole('button',{name:'Criar conversa'}).click();
  }
  await expect(main.locator('.conversation-list .conversation')).toHaveCount(3);
  await expect(main.locator('#message-text')).toBeVisible();
  await main.locator('.conversation-list .conversation').filter({hasText:'Benchmark 1'}).click();
  await expect(main.getByRole('heading',{name:'Benchmark 1'})).toBeVisible();
  await expect.poll(async()=>Object.keys(await stats(main)).length).toBeGreaterThan(0);
  // Mesma janela de estabilização em ambos ambientes; contadores são listeners lógicos,
  // não leituras faturadas, e incluem chamadas reais ao SDK.
  await main.waitForTimeout(1200);
  const closed=await stats(main);
  await main.getByText('Notificações de mensagens',{exact:true}).click();
  await expect(main.locator('.unread-line')).toHaveCount(3);
  await main.getByText('Arquivos privados e links temporários',{exact:true}).click();
  await main.waitForTimeout(1200);
  const opened=await stats(main);
  await main.getByText('Notificações de mensagens',{exact:true}).click();
  await main.getByText('Arquivos privados e links temporários',{exact:true}).click();
  await main.waitForTimeout(1200);
  const reclosed=await stats(main);
  // Garantir que ambas as sessões estão de fato na mesma DM após alternar os painéis.
  await pages[1].locator('.conversation-list .conversation').filter({hasText:'Benchmark titular'}).click();
  await expect(pages[1].getByRole('heading',{name:'Benchmark titular'})).toBeVisible();
  await main.locator('.conversation-list .conversation').filter({hasText:'Benchmark 1'}).click();
  await expect(main.getByRole('heading',{name:'Benchmark 1'})).toBeVisible();
  console.log('RFB_PERF_SUBSCRIPTIONS '+JSON.stringify({variant:process.env.RFB_PERF_VARIANT,closed,opened,reclosed}));
  const deliveryMs:number[]=[],domMs:number[]=[],driverOverheadMs:number[]=[];
  const samples=Number(process.env.RFB_PERF_SAMPLES??5);
  if(!Number.isInteger(samples)||samples<5||samples>30)throw new Error('invalid bounded sample count');
  for(let i=-3;i<samples;i++){
   const msg='Mensagem de benchmark '+i+' '+suffix;
   await pages[1].locator('#message-text').fill(msg);
   // Install observer before sending. Browser-clock epoch values permit comparison
   // across same-runner browser contexts, not arbitrary remote machines.
   await main.evaluate(text=>{
    const w=window as Window & {__rfbArrival?:number;__rfbObserver?:MutationObserver};
    w.__rfbObserver?.disconnect();delete w.__rfbArrival;
    const observe=()=>{if(Array.from(document.querySelectorAll('.message.incoming')).some(el=>el.textContent?.includes(text))){
      w.__rfbArrival=performance.timeOrigin+performance.now();w.__rfbObserver?.disconnect();
    }};
    w.__rfbObserver=new MutationObserver(observe);w.__rfbObserver.observe(document.body,{subtree:true,childList:true,characterData:true});observe();
   },msg);
   await pages[1].getByRole('button',{name:'Enviar',exact:true}).evaluate(el=>{
    const w=window as Window & {__rfbSent?:number};delete w.__rfbSent;
    el.addEventListener('click',()=>{w.__rfbSent=performance.timeOrigin+performance.now();},{capture:true,once:true});
   });
   const start=performance.now();
   await pages[1].getByRole('button',{name:'Enviar',exact:true}).click();
   await expect(main.locator('.message.incoming').filter({hasText:msg})).toBeVisible();
   await expect(pages[1].locator('#message-text')).toHaveValue('');
   const driver=performance.now()-start;
   const sent=await pages[1].evaluate(()=>(window as Window & {__rfbSent?:number}).__rfbSent);
   const arrival=await main.evaluate(()=>(window as Window & {__rfbArrival?:number}).__rfbArrival);
   if(sent===undefined||arrival===undefined||arrival<sent)throw new Error('browser timestamp missing or nonmonotonic');
   if(i>=0){deliveryMs.push(Math.round(driver));domMs.push(Math.round(arrival-sent));driverOverheadMs.push(Math.round(driver-(arrival-sent)));}
  }
  const variant=process.env.RFB_PERF_VARIANT!;
  if(variant==='after'){
   expect(closed['src/chat-extras.ts'].active).toBe(2);
   expect(closed['src/attachments.ts']?.active??0).toBe(0);
   expect(opened['src/chat-extras.ts'].active).toBe(8);
   expect(opened['src/attachments.ts'].active).toBe(1);
   expect(reclosed['src/chat-extras.ts'].active).toBe(2);
   expect(reclosed['src/attachments.ts'].active).toBe(0);
  }
  const result={variant,repetition:process.env.RFB_PERF_REPETITION??'1',conversations:3,warmupExcluded:3,closed,opened,reclosed,deliveryMs,domMs,driverOverheadMs};
  mkdirSync('perf-results',{recursive:true});writeFileSync('perf-results/browser.json',JSON.stringify(result,null,2));
  console.log('RFB_PERF_BROWSER '+JSON.stringify(result));
 }finally{await Promise.all(contexts.map(c=>c.close()));}
});
