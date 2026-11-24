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
