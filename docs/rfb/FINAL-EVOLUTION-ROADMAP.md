# Final Evolution Roadmap — RFB Chat V1

Meta: release V1.0.0, zero custo recorrente adicional dentro das cotas, sem merge/deploy sem autorização. Escopo original de 12 AC preservado; extensões competitivas explicitadas.

| EVOLVE | Entrega e gate | Situação |
|---|---|---|
| 01 Complete Messaging | busca, presença, exclusão, encaminhamento, fixação, push, offline, grupos/canais, documentação; duas sessões, persistência, Rules | CI local PASS; push bloqueado #3 |
| 02 Media Engine | áudio, arquivos privados, galeria, compressão, WebRTC, expiração; mídia real e cota | CI local PASS; #4 externo |
| 03 Administration & Security | gestão, denúncias, RBAC, antispam, auditoria, LGPD | CI local PASS após S025; #5/#6 abertas |
| 04 Visual Excellence | benchmark, 58 T-IDs reconciliados, design system arredondado, temas, acessibilidade, logo/assinatura, Anti-AI Slop | CI + visual PASS; WCAG integral pendente |
| 05 Performance & Infrastructure | listeners, cache, PWA, FCM autorizado, monitoramento, cotas, backup/rollback | PERF_INFRA_VISUAL_PASS_FINAL_CI_PENDING; benchmark/infra PASS; gates externos |
| 06 Total QA | unit, Rules, E2E, concorrência, carga, visual, WCAG, OWASP, LGPD, regressão | Pendente |
| 07 Production Release | staging Firebase/Cloudflare, push real, revisão, merge/deploy autorizados, smoke/release | Pendente |
| 08 Project Closure | README, screenshots reais, diagramas, manual, demo, portfólio, triagem e handoff | Pendente |

Encerrar somente com aceites obrigatórios aprovados, nenhuma falha crítica conhecida, produção verificada, documentação completa e custos explicitados. Sem equiparar 91,7% da matriz local à conclusão integral.

## EVOLVE 01 — Complete Messaging (26/11/2026)

Estado: **IMPLEMENTED_PARTIAL / CI_PENDING / PUSH_BLOCKED**. PR #1 Draft; Firebase Emulator; produção não autorizada.

| Slice | SHA do código | Evidência |
|---|---|---|
| S014 — pesquisa e ações | 69f52b1b5c505c798d5d6304fcca35b2dc89a621 | [CI 45760445468](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45760445468): instalação, TypeScript, unitários, build e Rules PASS; E2E em execução na consulta |
| S015 — presença, rede e canais | 6d27b77f15ace44a0747a0518eb193fefd98cb55 | [CI 45760551993](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45760551993): instalação, TypeScript, unitários, build e Rules PASS; E2E ainda não confirmado |
| S016 — hardening, lista de membros e testes | 727782ce3de7c6c31393311b5e38d135b4a46f12 | [CI 45760633858](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45760633858): em execução na consulta; não herda PASS de SHA anterior |

- Busca local sem acentos no texto autorizado, janela inicial 50, expansível em blocos de 50 até 500. Não é indexação integral do banco.
- Exclusão lógica de texto pelo autor substitui corpo por marcador, não permite restauração; reações/respostas novas negadas. Não é garantia de purga de backups/caches nem revogação de cópias encaminhadas; áudio/arquivos permanecem no escopo EVOLVE 02.
- Fixação em DM por membros e em grupos por admin; filtro de fixadas na janela. Encaminhamento de texto como nova mensagem do remetente atual, sem metadados privados de origem.
- Presença voluntária por conversa, desativada inicialmente; atividade aproximada com heartbeat 60s e expiração visual 90s, digitação até 12s. Sem precisão de conexão global, sem TTL físico e sem compartilhamento de conteúdo do rascunho. Leitura/escrita negadas entre DMs bloqueadas.
- Estado de cache/conexão, fila de escrita Firebase em memória enquanto a sessão permanece aberta, confirmação após reconexão. Não habilita cache persistente contendo conversas em dispositivo compartilhado. Recuperação offline após fechar/recarregar não homologada.
- Canais: editar nome/descrição por admin. Grupos: listar participantes e cargos. Notificações internas não contam textos excluídos.
- Push em segundo plano **BLOCKED**: [Issue #3](https://github.com/CristianoRFB/RFB-Chat/issues/3); FCM exige projeto autorizado, service worker, VAPID, permissão e emissor confiável. Agendar no EVOLVE 05/07.
- QA: +1 teste unitário, +5 casos Rules e +2 cenários Playwright adicionados; quantidade aprovada no SHA final depende da execução. Sem QA manual/prints nesta rodada.

Referências oficiais consultadas: https://firebase.google.com/docs/firestore/manage-data/enable-offline ; https://firebase.google.com/docs/firestore/solutions/presence ; https://firebase.google.com/docs/cloud-messaging/web/get-started .
Rollback: reverter os três commits de código na branch de trabalho, em ordem inversa, somente se necessário após diagnóstico; não forçar reset da main. Nenhum custo, merge ou deploy ativado.


## EVOLVE 02 — Media Engine — 26/11/2026

EVOLVE 01: CI do HEAD 1974f77 integralmente verde ([run 45760719067](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45760719067)); nenhuma regressão detectada na suíte; push #3 e persistência offline após fechar permanecem pendentes.

| Slice | SHA | CI |
|---|---|---|
| S017 — anexos e galeria | a9f1afb32b4e1d5c7bb46332b81f0a5df14e1a30 | [45762573543](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762573543) |
| S018 — voz, RTP, purga local | 359f49011311766ea7b320ae7aaddfec14314093 | [45762642054](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762642054) |
| S019 — revogação e regressões | 0b66538174cb725083dd4d25b36a7c71ab8ed306 | [CI final](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762723200): IN_PROGRESS; TypeScript: success; Unit tests: success; Build sem conexões de produção: success; Firestore Rules isoladas (demo-rfb-chat): in_progress; Two users and mobile E2E in isolated emulators: pending |

- Anexos TXT/PDF/PNG/JPEG/WebM/MP4 até 300000 bytes; compressão local de imagens maiores com proporção preservada, entrada máxima 12 MB e 40 MP. Não comprime vídeos grandes nem converte codecs; MP4 depende do suporte do navegador. Prévia de imagem/vídeo ao abrir arquivo. Galeria até 50 metadados, sem baixar bytes em lote; registros antigos sem índice continuam acessíveis por link, não aparecem na galeria.
- Índice e conteúdo gravados/revogados atomicamente para novos uploads; membro autenticado, link ~23h, leitura de bytes negada após expiração, revalidação ao abrir e listener para revogação da prévia. Metadados expirados podem permanecer no banco até purga; não revoga cópias baixadas.
- Áudio WebM até 60 segundos e 200 KB, consentimento, prévia, envio explícito ou direto, cancelamento; sem retenção automática de áudios de conversa. Não há transcrição nem gravação de chamadas.
- Chamadas P2P locais: mute, contador de pacotes RTP inbound; E2E exige recepção em ambas as pontas com microfone sintético. Não comprova áudio humano nem redes externas. Sem STUN/TURN/SFU, não prometer conectividade externa.
- Purga manual `npm run media:purge:local`: somente endpoint fixo loopback 127.0.0.1:8080 e projeto demo-rfb-chat; até 100 anexos expirados por execução; remove bytes e metadados; teste de integração sem dados reais. Não há agendamento em produção.
- Segurança: restrições MIME/volume e ownership, negativos de acesso e índice órfão, revogação, duração. QA manual e auditoria independente ainda pendentes.
- Gate externo [#4](https://github.com/CristianoRFB/RFB-Chat/issues/4): armazenamento escalável privado, política de retenção automatizada e mídia em redes diferentes. Firestore 1 MiB por documento, TTL gerenciado exige billing; R2 tem franquia e excedentes. Não ativar nada sem autorização. Fontes: https://firebase.google.com/docs/firestore/quotas ; https://firebase.google.com/docs/firestore/pricing ; https://developers.cloudflare.com/r2/pricing/ ; https://developer.mozilla.org/en-US/docs/Web/API/RTCInboundRtpStreamStats .
- Nenhum deploy, merge ou custo adicional ativado. Rollback: reverter S019, S018, S017 em ordem inversa na branch de trabalho após diagnóstico; preservar main e considerar compatibilidade dos novos registros antes de reverter regras.

Status: IMPLEMENTED_PARTIAL / IN_PROGRESS / EXTERNAL_GATES_OPEN. Não declarar EVOLVE 02 integralmente encerrado.


### Revalidação e correção S019
- S017 [CI 45762573543](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762573543): PASS integral.
- S018 [CI 45762642054](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762642054): 11 unitários, 27 Rules e 12 Playwright PASS (50). E2E verificou pacotes RTP de áudio nas duas pontas com fonte sintética, além de prévia de voz e galeria de anexos. Não é prova de rede externa.
- S019 [CI 45762723200](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762723200): FAIL na compilação de Rules; substituição textual interpretou `$'` no regex e duplicou sufixo. Sem supressão de teste. Corrigido em 284c09ce38b65092ccd11aa3667b03060decddfe, reconstruindo Rules sobre S018 e substituindo via callback; [nova CI](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762857318) em execução na última consulta. QA de purga/preview/vídeo e revogação final ainda NÃO homologado.
- Próximo: conferir nova CI e corrigir regressões comprovadas; #3/#4 permanecem abertas.


## EVOLVE 03 — Administration & Security (26/11/2026)

**Estado atual:** LOCAL_E2E_PENDING_EXTERNAL_GATES_OPEN. PR #1 Draft, emuladores; nenhum recurso de produção, faturamento, merge ou deploy. EVOLVE 02 revalidado no HEAD 957c93b: [CI 45762924505](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762924505), 11 unitários + 28 Rules + 13 E2E PASS (52 testes). Issues #3 e #4 continuam abertas para gates externos.

| Slice | Entrega | SHA / evidência |
|---|---|---|
| S020 | administração, RBAC delegado, suspensão, banimento, histórico imutável de alterações | [e8dc077](https://github.com/CristianoRFB/RFB-Chat/commit/e8dc077d52b5fd611f5b2d95d1443e061d0ac8a5) / [45911111067](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911111067) |
| S021 | auditoria de denúncias, cooldown, fila de privacidade e exportação limitada | [e32f78f](https://github.com/CristianoRFB/RFB-Chat/commit/e32f78f5940ea2c978abd5a7c8c5883b4ce27018) / [45911184443](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911184443) |
| S022 | conflito de interesse, provisionamento local, E2E administrativo, audit de dependências | [f0a5ab9](https://github.com/CristianoRFB/RFB-Chat/commit/f0a5ab9aa305b1b14505cd18748045f937a6c934) / [45911258964](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911258964) |
| S023 | lockfile resolvido no runner; Firebase Tools 15.37.0, Vitest 5.1.2, overrides tar/grpc-js | [afa75e6](https://github.com/CristianoRFB/RFB-Chat/commit/afa75e67a9c26e860233c488b5929182de537e2e) / [audit candidato](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911379524) / [CI lockfile](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911480690) |
| S024 | correção de cadastro; manter formulário montado até término da gravação de perfil, leitura server-side | [a0d544a](https://github.com/CristianoRFB/RFB-Chat/commit/a0d544a0104ed19c8b3b2a51aea7af8ccc10ed27) / [CI final](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911585835) |

### Funcionalidades e limites
- Admin principal por custom claim confiável; comando local `npm run admin:local -- UID grant --confirm-local` (ou revoke), endpoint fixo do Auth Emulator em loopback. Sem promoção a admin pelo cliente; sair/entrar após alterar claim. Admin ativo pode delegar/revogar moderador via accountControls, sem autoalteração, com justificativa e evento imutável atômico. Até 50 perfis e 50 eventos por consulta; não é diretório global paginado.
- Suspensão: conserva leitura de histórico, impede novas escritas de mensageria; banimento: regras negam acesso às conversas e UI preserva contestação/direitos. Sem expulsão de tokens Auth, sem revogação de cópias/cache anteriores. Chamada ativa deixa UI local ao suspender/banir; testar sessões e sinalização em produção.
- Moderação: estados válidos e registro de operador/horário, histórico não editável, prevenção de decisão sobre denúncia própria ou contra si. Admin/moderador não ganha acesso ao conteúdo das conversas alheias. Denúncia requer gravação atômica com marcador de 30s por conta, validado pelas Rules. Mensagens compostas só de espaços são negadas. Rate limit global de mensagens, convites, upload, cadastro e chamadas continua aberto; não alegar proteção integral.
- Privacidade: exportação JSON de perfil e preferências, acompanhamento de denúncias próprias, solicitação de acesso integral, eliminação e contestação (uma por categoria no laboratório), fila admin e início de análise auditado. Não há exclusão automática nem confirmação fictícia de cumprimento; fluxo operador, identidade, prazos, bases legais, backups, portabilidade, retenção e resposta formal dependem de #5. Preservar acesso à solicitação mesmo quando banido.
- Fontes: https://firebase.google.com/docs/auth/admin/custom-claims ; https://firebase.google.com/docs/emulator-suite/connect_auth ; https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares ; https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm . Não declarar conformidade legal nem revisão independente.

### Auditoria de dependências e regressões
- Baseline S022: 30 alertas, 3 críticos, 11 altos, 16 moderados. A auditoria bloqueou CI conforme gate crítico, sem suprimir saída.
- Candidato read-only gerado via npm no GitHub Actions (sem scripts de instalação nem push automático): 14 moderados, 0 altos, 0 críticos. Aplicado o lockfile real em S023; versão tar 7.5.24 e @grpc/grpc-js 1.14.7; npm ci, typecheck, unit, build, Rules e audit passaram no run 45911480690. Workflow temporário removido; gate permanente `npm audit --audit-level=critical` mantido. Alertas moderados transitivos do toolchain estão na [Issue #6](https://github.com/CristianoRFB/RFB-Chat/issues/6); sem downgrade forçado.
- S020/S021/S022 apresentaram falhas E2E de cadastro (locator #own-uid), antes das operações administrativas. Capturas e contextos reais do [artefato 15160032737](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911111067) mostraram a tela "Concluir perfil local" com nome genérico. Hipótese: concorrência entre Auth e confirmação do perfil ao montar Workspace após AccountGate. S024 conserva Login montado até a escrita terminar, usa getDocFromServer e consulta auth.currentUser para recuperação. Não aumentou timeout, não adicionou retries nem enfraqueceu Rules.
- **CI da correção S024:** TypeScript: success; Unit tests: success; Build sem conexões de produção: success; Firestore Rules isoladas (demo-rfb-chat): success; Two users and mobile E2E in isolated emulators: in_progress; audit: success. Resultado integral: não homologado até verificação completa.
- QA visual: screenshot de falha realmente inspecionado; sem auditoria visual integral, leitor de tela ou dispositivo físico. G4/G5 produção bloqueados.

### Próximos gates
[#3 push](https://github.com/CristianoRFB/RFB-Chat/issues/3), [#4 mídia externa](https://github.com/CristianoRFB/RFB-Chat/issues/4), [#5 LGPD/antiabuso/governança](https://github.com/CristianoRFB/RFB-Chat/issues/5), [#6 alertas moderados](https://github.com/CristianoRFB/RFB-Chat/issues/6). Antes do EVOLVE 04, confirmar CI da correção e corrigir regressões comprovadas. Rollback: reverter em ordem inversa apenas commits causadores na branch de trabalho; não reverter Rules sem plano de migração para accountControls/reportRate/privacidade e eventos. Não alterar main. Protocolos aplicados: governança GitHub, checkpoint, AntiVibeCoding, AntiLoop (evidência de logs e screenshot; hipótese diferente), QA automatizado, custo R$0 e segurança por Rules. Anti-AI Slop visual integral fica no EVOLVE 04.


# EVOLVE 04 — Visual Excellence — 26/11/2026

**VISUAL_PASS_FULL_CI_PENDING**. Emuladores; PR #1 Draft, sem merge/deploy/billing. 

- EVOLVE 03: [CI anterior](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911757898) 13/14 E2E; trace 15160327144 parou em getByLabel('Conta', exact:true), embora select estivesse no DOM. S025 labels htmlFor/id explícitos e seleção por valor real. [CI S025](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912658637) integralmente PASS: 11 unit, 31 Rules, 14 E2E (56), incluindo administração; audit PASS. #5/#6 abertos.
- S025 [954a31b](https://github.com/CristianoRFB/RFB-Chat/commit/954a31b): conversas primeiro, filtros reais, busca sem acentos, temas claro/escuro persistentes, marca SVG própria com 7, assinatura RFB, navegação mobile e estados vazios. Sem imagens decorativas ou controles inertes.
- S026 [09984cd](https://github.com/CristianoRFB/RFB-Chat/commit/09984cd): cenário real de duas contas. [Primeira CI visual](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912711678) falhou em parser hex abreviado; 3 capturas desktop foram revisadas. Histórico cortava mensagem recente, ações sempre abertas ocupavam espaço, conta abaixo da dobra.
- [420e9eb](https://github.com/CristianoRFB/RFB-Chat/commit/420e9eb): benchmark WhatsApp/Telegram/Slack/Discord/WCAG e mapa de 58 T-IDs; 42 componentes/fluxos mapeados, 16 parciais/consolidados, não são 58 páginas nem percentual global.
- S027 [b2ad72c](https://github.com/CristianoRFB/RFB-Chat/commit/b2ad72c3bffa73f34ae2af0ae5f27ed5437e3d8e): ações/reações em disclosure acessível, ferramentas agrupadas, histórico ampliado, rolagem acompanha mensagens recentes sem forçar leitura antiga, conta reposicionada, parser de contraste corrigido. Testes abriram menu real, sem remover asserts. [QA visual final](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988546) PASS (1 cenário, artifact 15160977197), seis PNG reais inspecionados/versionados com SHA256 e Git blob SHA. Desktop e mobile exibem as três mensagens e compositor. Tablet empilhado, não navegação nativa. Dados sintéticos criados pela UI, sem métricas falsas.
- QA: sete larguras 320/360/390/430/768/1024/1440 sem overflow horizontal no cenário, tema claro persistente após reload, busca/filtros, teclado Tab/Enter e pares selecionados de tokens no tema claro ≥4,5:1. Não é auditoria WCAG integral nem validação de todos estados ou tema escuro. Leitor de tela, zoom, dispositivos reais e outros navegadores pendentes.
- [CI final do código](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988561): TypeScript: success; Unit tests: success; Build sem conexões de produção: success; Firestore Rules isoladas (demo-rfb-chat): success; Two users and mobile E2E in isolated emulators: in_progress; auditoria success. CI integral não homologada na consulta. Audit gate crítico mantido, 14 moderados #6. Removida impressão de bytes no workflow após captura; futuros runs guardam artefato.
- Protocolos: Anti-AI Slop, Anti-Preguiça, Criatividade, AntiVibeCoding, AntiLoop, QA visual com screenshot anterior, inspeção, correção, recaptura; sem retries. Fontes em docs/BENCHMARK-UX-2026.md. Marca proposta V1 ainda sem aceite formal do proprietário; originais PNG não importados; fotos de admin/grupos/ações abertas faltam. #3 push, #4 mídia externa, #5 LGPD/antiabuso, #6 moderados. Sem produção. Rollback S027/S025 e testes correlatos na branch, preservando correção de labels quando possível. 

[Manifesto](../screenshots/manifest.json) · [Design system](DESIGN-SYSTEM.md) · [Mapa das telas](SCREEN-MAP.md).

## S028 — correção de regressão comprovada

CI S027 [45912988561](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988561): 11 unit + 31 Rules PASS, build/typecheck/audit PASS, 14/15 E2E. Trace 15160334841 confirma que fixação, busca e filtro passaram; Excluir ficou inacessível após fechamento do disclosure nativo no snapshot de fixação. O teste passa a verificar a fixação no remetente, abrir o menu real se fechado e verificar a ação visível antes do clique; nenhuma asserção removida, nenhum retry, sem mudança do código visual. S028 aguardando CI. Capturas S027 permanecem evidência do código visual inalterado.

## EVOLVE 04 — checkpoint S028 (26/11/2026)

- S025: CI 45912658637 PASS 11 unit, 31 Rules, 14 E2E; administração corrigida.
- S027: [visual QA](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988546) PASS, seis screenshots reais inspecionados e versionados em 600855b, 7 larguras; mapa de 58 IDs, 42 mapeados em componentes e 16 parciais/consolidados. Não é percentual de conclusão global.
- S027 CI 45912988561: 14/15 E2E; trace 15160334841 comprovou que o menu fechou após fixação. S028 d5a6482 reabre o menu pela interface, preservando asserções e sem retries. [CI S028](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486070): in_progress/pending; visual S028: in_progress/pending.
- Estado: VISUAL_PASS_S028_CI_PENDING. #3–#6 permanecem abertas. PR #1 Draft, main intocada, nenhum deploy ou billing. Acessibilidade integral, dispositivos físicos, marca aprovada e capturas de admin/grupos pendentes. Próximo: confirmar CI integral por SHA antes de iniciar EVOLVE 05.


# EVOLVE 05 — Performance & Infrastructure

Data: 26/11/2026 (São Paulo). Estado **PERF_INFRA_VISUAL_PASS_FINAL_CI_PENDING**. PR #1 Draft; main e produção intocadas. Nenhum recurso pago ativado. R$0 custo recorrente adicional criado.

## Baseline e regressões
- EVOLVE 04 S028: [CI PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486070), [visual PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486069), [checkpoint CI PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913563737). Sem regressão residual comprovada naquele SHA.
- S029 c1e99d2: listeners de notificações e galeria somente quando abertos; timer de galeria somente se aberta ou prévia carregada; revogação da prévia continua observada; deduplicação de nomes de DMs e consultas de grupo estáveis por lista de membros; memória por sessão, sem persistência de conversas. Build público isolado de import Firebase; manifesto e fallback offline de página pública, não PWA funcional de chat em produção.
- CI inicial https://github.com/CristianoRFB/RFB-Chat/actions/runs/45914905451: falha no deep-link TXT por abrir painel automaticamente e teste fechar ao clicar. Removida abertura automática em 43f6af8; [CI 61034de](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915144601) PASS 13 unit, 31 Rules, 15 E2E = 59 testes; auditoria PASS. Regressão corrigida sem enfraquecer Rules.
- S030 7706859: teste guard/serviço offline e export/import Auth+Firestore sintéticos; runbook de cotas, rollback, staging e FCM. [Infra PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281448): build bloqueado, cache só /offline.html, zero requisições externas; conta e documento restaurados em emuladores isolados.
- 61034de: diagnóstico local de erros por 5 categorias limitadas; copiar/zerar agregados, sem conteúdo ou telemetria remota; cobre erros encaminhados por onChildError, não todos erros do navegador ou servidor. +2 unitários.
- Benchmark inicial 45914960995 falhou na entrega do cenário baseline; S031 dcf7da1 confirma DMs em ambas sessões, envio pelo peer e preserva asserts. 45915079932 mediu ambos builds e baseline navegador mas falhou na porta 8080 ocupada. S032 81dd87d usa portas e projeto demo distintos apenas no worktree descartável após medir build; não altera configuração do app. [Benchmark final PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281421), artefato 15161782942 e JSON bruto sanitizado versionado.

## Benchmark pareado medido
Mesmo runner ubuntu-latest, Node22 Java21 Chromium, 3 DMs, 5 envios reais. Instrumentação Proxy em onSnapshot exclusivamente chat-extras.ts e attachments.ts em worktrees descartáveis. Build feito antes da instrumentação e substituição de portas. Dados sintéticos. 

| Métrica | Antes | Depois | Variação |
|---|---:|---:|---:|
| Assinaturas lógicas ativas, painéis fechados | 9 | 2 | -77,8% |
| Assinaturas ativas, painéis abertos | 9 | 9 | igual |
| Assinaturas após fechar painéis | 9 | 2 | -77,8% |
| JS build público bloqueado, bytes | 627846 | 222892 | -64,5% |
| JS gzip, bytes | 191411 | 69524 | -63,7% |
| Entrega local mediana, ms | 142 | 160 | +12,7% (piora observada) |

Amostras antes: 142,136,124,183,145 ms; depois: 160,181,156,132,170 ms. Não demonstram melhora de latência, significância estatística ou SLO. Reavaliar no EVOLVE 06 com carga, alternância de ordem e mais amostras. Assinaturas lógicas não equivalem a leituras faturadas: SDK pode deduplicar consultas; reabrir painéis tem custo de reconsulta. Não extrapolar 77,8% para toda aplicação ou para cobrança. Build público guard exclui Firebase; tamanho futuro do app real ainda não medido. [Dados brutos](benchmarks/EVOLVE-05.json).

## Validação e gates
- [CI código 61034de](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915144601): 59 testes, audit PASS. CI do SHA final 81dd87d6cd651fcf3d2d7fbdf61e8edeb497d30c: [dependency-audit:success, verify:in_progress](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281418). [Visual PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281376), [infra PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281448), [benchmark PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45915281421). 14 moderados #6 ainda abertos; zero altos/críticos na última auditoria.
- Cache público sem dados privados, PWA limitada; FCM #3 depende de staging real, emissor confiável, VAPID e consentimento; backup gerenciado exige Blaze, não ativado. Backup local não é DR de produção. Cloudflare Static Assets e Firebase Spark planejados em INFRASTRUCTURE.md, sem deploy. Cotas propostas de alarme, não implementadas no servidor; #4 mídia externa #5 antiabuso/LGPD #6 dependências. Produção e homologação real exigem aprovação. 
- Protocolos Anti-Preguiça: implementação, benchmark antes/depois e diagnóstico de falhas; AntiVibeCoding: testes reais, sem inventar resultados, preservação de Rules; AntiLoop: hipóteses diferentes para falha de alvo/porta; checkpoint e triagem, custo zero; QA visual reexecutado. Rollback: reverter commits S029–S032 na branch; preservar Rules e exports autorizados; não fazer reset de main. 

Próximo EVOLVE 06: verificar CI final, amostra maior de latência/carga, concorrência, quota, WCAG/OWASP/LGPD e gates externos. Não declarar percentual global nem produção homologada.
