import React, {lazy,Suspense} from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
const root=document.getElementById('root');
if(!root)throw new Error('Elemento root ausente');
// Build público não deve sequer inicializar Firebase ou incluir o laboratório.
if(import.meta.env.DEV){
 const App=lazy(()=>import('./App'));
 createRoot(root).render(<React.StrictMode><Suspense fallback={<main className="loading" role="status">Carregando laboratório…</main>}><App/></Suspense></React.StrictMode>);
}else{
 createRoot(root).render(<main className="production-stop"><h1>RFB Chat — laboratório não publicado</h1><p>Este build não se conecta a serviços reais. Consulte o README para iniciar os emuladores locais.</p></main>);
 if('serviceWorker' in navigator)window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{/* Instalação opcional; sem envio de telemetria. */});});
}
