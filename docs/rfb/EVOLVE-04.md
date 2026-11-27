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


**Homologação S028:** [CI PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486070), [visual PASS](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486069).
