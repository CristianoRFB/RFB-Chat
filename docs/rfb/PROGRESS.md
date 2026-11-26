# RFB Chat — Progresso do RFB Method
23/11/2026 · PR [#1 DRAFT](https://github.com/CristianoRFB/RFB-Chat/pull/1) · branch `feature/rfb-starter-pack-v1` · fonte `docs/ESPECIFICACAO-RFB.txt`.

| Etapa | Situação |
|---|---|
| G0 / Discovery | 10 módulos, 12 funcionalidades, 58 telas conceituais e riscos documentados |
| G1 / Stack | React, TypeScript, Vite, Firebase Auth/Firestore Emulators, npm ci, CI |
| G2 / Caminho central | Login, conversa DM, persistência, retorno e recebimento em duas contas testados |
| G3 / Módulos | DM/grupos/canais, histórico, reações, respostas/edição, busca, leitura, notificações, privacidade, bloqueio/denúncias, arquivos e áudio implementados |
| G4 / Especializados | P2P local com sinalização e mídia fake; sem conectividade externa validada |
| G5 / Automação | **PASS**: 9 unitários, 20 Firestore Rules, 10 Playwright E2E, npm ci/typecheck/build no SHA `3dc7e7b4f1175509ae32476dd219ad8215c8be36` |
| G5 / QA humano | Pendente revisão mobile real, WCAG, OWASP, LGPD, retenção, concorrência e cota |
| G6 / Produção | **Não autorizado, não executado** |

**Cobertura funcional do laboratório:** 11/12 = 91,7%, não progresso total de produto. [CI mais recente](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809); [Issue #2 fechada](https://github.com/CristianoRFB/RFB-Chat/issues/2) após 3 aprovações consecutivas. Despesas recorrentes adicionais ativadas: R$0; não equivale a estimativa de custo de produção.

Próximo gate: [RELEASE-GATES.md](RELEASE-GATES.md), [COVERAGE.md](COVERAGE.md), [HANDOFF](../HANDOFF.md).


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
