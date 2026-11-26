# Administração e moderação — estado após EVOLVE 03

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


## Histórico anterior (preservado)

# Administração e moderação — segurança e limites
As denúncias ficam em `reports/{id}`. Apenas a conta autora pode ler sua denúncia individual. A listagem e mudança de status exigem **custom claims** `moderator:true` ou `admin:true` verificadas por Firestore Rules — nunca role enviada em um formulário do cliente.

`src/ModeratorDashboard.tsx` é apresentado apenas quando o token de autenticação traz essas claims. Um usuário comum não pode promovê-las por URL, localStorage ou documento Firestore.

Neste MVP, não existe serviço privilegiado para atribuir claims nem interface de superadmin. A atribuição deve ocorrer futuramente num ambiente confiável, e ser auditada com logs sem dados sensíveis. Para QA isolado, usar contexto autenticado com custom claims nos testes do Firebase Emulator. A moderação **não está operacional em produção**.

Requisitos de evolução: auditoria de denúncias, retenção e exclusão LGPD, limites de volume/antiabuso, perfis e recurso de contestação antes de produção. Nenhum segredo de administrador ou conta real deve ser usado em demo.
