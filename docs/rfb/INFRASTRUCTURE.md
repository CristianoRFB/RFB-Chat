# EVOLVE 05 — operação e infraestrutura R$0
Data de revisão: 26/11/2026. Nenhum projeto real criado, nenhum Worker publicado e nenhum faturamento habilitado. Arquitetura atual: React/Vite, Firebase Auth e Firestore Emulator, memória de sessão e P2P local. Build público deliberadamente bloqueado; não é staging funcional.

## Limites de operação
Firestore Standard Spark: 50 mil leituras, 20 mil gravações, 20 mil exclusões/dia, 1 GiB de armazenamento e 10 GiB/mês egress conforme região/cota gratuita aplicável. Conferir console real antes do release. Alertas operacionais propostos em 50/75/90%: leituras 25k/37,5k/45k; gravações/exclusões 10k/15k/18k. Não são bloqueios automáticos nem uso medido. Se atingir 75%, reduzir janelas, limitar upload/presença e investigar listeners; a 90%, suspender expansão e novas inscrições até revisão; não ativar Blaze. Consultar Firebase Usage diariamente quando em homologação. Listener lógico não equivale a leitura faturável (SDK dedup, alterações, reconexões, índices, regras). 
Cloudflare Workers Static Assets: requisições estáticas gratuitas, dentro de limites de arquivos/conta. Futuro subdomínio workers.dev, sem custom domain, sem script pago; CLI cf após aprovação. Não criar configuração fictícia de conta ou token. FCM sem custo de envio segundo Firebase, mas exige projeto real, VAPID, SW, opt-in e emissor confiável; #3 mantém bloqueio. Backup gerenciado Firestore requer Blaze, portanto não habilitar. 
Fontes oficiais: https://firebase.google.com/docs/firestore/quotas ; https://firebase.google.com/docs/firestore/pricing ; https://firebase.google.com/docs/projects/billing/firebase-pricing-plans ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://firebase.google.com/docs/cloud-messaging/web/get-started ; https://firebase.google.com/docs/firestore/manage-data/export-import ; https://firebase.google.com/docs/emulator-suite/install_and_configure .

## Cache e PWA
Cache Firestore em memória, sem persistência de conversas após fechar aba. Cache local de nomes por Workspace, não compartilhado entre sessões ou contas; renomeações aparecem após nova sessão. Fallback público offline cacheia apenas offline.html; não intercepta query string, API, cross-origin, arquivos privados ou tokens. Manifesto e SW não comprovam instalabilidade em todos dispositivos; build não habilita FCM nem mensagens offline.

## Backup e restauração
Somente dados sintéticos, em máquina local isolada. Nunca commitar export. 
1. Em ambiente vazio: `npm ci`, `npm run emulators -- --export-on-exit .local-backup/rfb-chat`.
2. Encerrar com Ctrl+C; manter cópia fora do repositório, com acesso restrito.
3. Restaurar em emulador parado: `npm run emulators -- --import .local-backup/rfb-chat`. Não apontar a produção.
4. Teste dedicado scripts/emulator-backup-check.mjs executa export/import temporários em CI, verifica login e documento sintético, remove cópia no final.
5. Rollback: preservar SHA anterior aprovado e manifesto de assets, reverter commits da fatia na branch; antes de alterar Rules ou dados reais, estabelecer migração reversível, snapshot autorizado e procedimento de restauração. Backup local não é DR de produção; RPO/RTO não medidos.
 
## Observabilidade e release
CI de build, Rules, E2E, audit, visual e benchmark com artifacts de retenção curta. Logs técnicos e traces sem dados de cliente (contas @example.test); não publicar traces brutos. Para staging aprovado, coletar contadores agregados, latência p50/p95, taxa de erro por código sanitizado, cotas e status da publicação; não enviar corpo/UID/token/link de mensagens para analytics. Sem Sentry, serviço pago ou telemetria remota. Procedimento: se erros de auth/Rules/rede aumentarem, reproduzir em emulador, confirmar SHA, desativar release e reverter assets; não enfraquecer autorização. Monitoramento operacional da produção NOT_RUN.
Gate EVOLVE 07: projeto Firebase Spark autorizado, configuração pública separada do emulador, Rules negativas e revisão independente, origem HTTPS, staging com contas descartáveis, proteção antiabuso e retenção #4/#5, FCM #3, dependências #6, rollback validado e aprovação explícita de merge/deploy. Não abrir produção apenas para cumprir roadmap.
