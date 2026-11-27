import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4173';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}if(i===49)throw Error('preview não respondeu');await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();
 const unexpected=[];page.on('request',r=>{if(!r.url().startsWith(origin+'/'))unexpected.push(new URL(r.url()).origin);});
 await page.goto(origin);
 await page.getByRole('heading',{name:'RFB Chat — laboratório não publicado'}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const cache=await page.evaluate(async()=>{const keys=await caches.keys();return Promise.all(keys.map(async key=>({key,urls:(await (await caches.open(key)).keys()).map(r=>new URL(r.url).pathname)})));});
 assert.equal(cache.length,1);assert.deepEqual(cache[0].urls,['/offline.html']);
 await context.setOffline(true);await page.goto(origin);
 await page.getByRole('heading',{name:'Sem conexão'}).waitFor();
 assert.equal(unexpected.length,0,'Nenhuma conexão externa');
 console.log('RFB_PUBLIC_SHELL '+JSON.stringify({blocked:true,offlineFallback:true,cachePaths:cache[0].urls,externalRequests:unexpected.length}));
 await context.close();
}finally{await browser?.close();server.kill();}
