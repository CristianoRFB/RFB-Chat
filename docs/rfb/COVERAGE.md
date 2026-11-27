# RFB Chat — Matriz de cobertura (RFB Method)

Data: 23/11/2026, America/Sao_Paulo. Referência: [especificação](../ESPECIFICACAO-RFB.txt). Implementação: [PR #1 DRAFT](https://github.com/CristianoRFB/RFB-Chat/pull/1). Último código verificado: `3dc7e7b4f1175509ae32476dd219ad8215c8be36`.

**Resultado verificável:** 11/12 recursos (91,7%) com fluxos funcionais no laboratório Firebase Emulator; a 12ª funcionalidade tem apenas a sinalização de chamada WebRTC verificada. Isso é **cobertura funcional do protótipo**, não 91,7% de todas as telas, controles, integrações, acessibilidade, segurança e produção. O checklist original de aceite exige persistência, autorização, concorrência, integração e E2E por AC; nem todos estes aspectos foram homologados individualmente para operação real.

| AC | Função da fonte | Estado do laboratório | Evidência ou restrição |
|---|---|---|---|
| 01 | Conversa individual e grupo | Fluxo testado | DMs, membership, grupos; Rules + E2E |
| 02 | Envio de texto e reações | Fluxo testado | Assinaturas reativas somente em mensagens visíveis |
| 03 | Responder e editar | Fluxo testado | Editar apenas texto próprio, autorização em Rules |
| 04 | Indicadores enviado/recebido/lido | Fluxo testado | Carimbo do servidor; sem push em segundo plano |
| 05 | Paginação | Fluxo testado | 52 mensagens e carregamento de página anterior |
| 06 | Busca por conversa | Fluxo testado | Filtro de conversas (não indexação do conteúdo) |
| 07 | Convites e cargos | Fluxo testado | Aceite explícito, owner/admin, canais |
| 08 | Áudio gravado com consentimento | Fluxo testado | WebM até 20 s com microfone sintético no E2E; consentimento não auditado |
| 09 | Arquivos privados e links temporários | Fluxo testado | Link autenticado ~23h, máx. 60KB, exclusão pelo autor; **sem purga TTL automática** |
| 10 | Notificações e preferências | Fluxo testado | Contagem interna não lidas, toggles; sem push |
| 11 | Bloqueio e denúncia | Fluxo testado | Bloqueio server-side de DM, chamadas, ICE, reações e arquivos; moderação por claims |
| 12 | Chamadas individuais opcionais | Prova de conceito parcial | E2E de sinalização e término, **não prova RTP/áudio real ou redes externas** |

**CI por SHA:** [run 45302857809](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809): `npm ci`, TypeScript, build, 9 Vitest, 20 Rules Test, 10 Playwright Chromium, todos aprovados sem retry. [Run de estabilização 45097362021](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45097362021): tentativas 1, 2 e 3 sucessivas, sem retries internos. [Issue #2](https://github.com/CristianoRFB/RFB-Chat/issues/2) fechada com evidência.

## 10 módulos originais
Conversas, Grupos/Membros, Canais, Arquivos/Mídia, Pesquisa, Notificações e Perfil/Privacidade: fluxos de laboratório. Chamadas: P2P experimental sem TURN/SFU. Moderação: denúncia, revisão por custom claim (sem atribuição real de privilégios). Administração: fila de denúncias, não console completo de plataforma.

O catálogo de **58 telas** é conceitual. Não equivale a 58 layouts finalizados; fluxos correspondentes são reunidos em páginas e painéis React. G5 não passou por auditoria manual integral; G6/deploy não foi executado.

## Gates
G0 fonte e diagramas preservados; G1 ambiente, CI e lockfile; G2 fluxo principal; G3 11 fluxos completos em laboratório + P2P parcial; G4 mídia externa não habilitada; G5 9/20/10 testes automáticos verdes, revisão humana pendente; G6 bloqueado até autorização, segurança e infraestrutura real. Veja [RELEASE-GATES.md](RELEASE-GATES.md).


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

## EVOLVE 04 — checkpoint S028 (26/11/2026)

- S025: CI 45912658637 PASS 11 unit, 31 Rules, 14 E2E; administração corrigida.
- S027: [visual QA](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988546) PASS, seis screenshots reais inspecionados e versionados em 600855b, 7 larguras; mapa de 58 IDs, 42 mapeados em componentes e 16 parciais/consolidados. Não é percentual de conclusão global.
- S027 CI 45912988561: 14/15 E2E; trace 15160334841 comprovou que o menu fechou após fixação. S028 d5a6482 reabre o menu pela interface, preservando asserções e sem retries. [CI S028](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486070): in_progress/pending; visual S028: in_progress/pending.
- Estado: VISUAL_PASS_S028_CI_PENDING. #3–#6 permanecem abertas. PR #1 Draft, main intocada, nenhum deploy ou billing. Acessibilidade integral, dispositivos físicos, marca aprovada e capturas de admin/grupos pendentes. Próximo: confirmar CI integral por SHA antes de iniciar EVOLVE 05.
