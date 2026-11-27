# GitHub triage — 26/11/2026
Repo CristianoRFB/RFB-Chat; branch feature/rfb-starter-pack-v1; código 727782ce3de7c6c31393311b5e38d135b4a46f12. Intake: 0 issues abertas, PR #1 Draft. Saída: [Issue #3](https://github.com/CristianoRFB/RFB-Chat/issues/3) KEEP_OPEN/BLOCKED_EXTERNAL, PR #1 KEEP_OPEN_DRAFT. Issue #2 permanece encerrada com evidência histórica. Não houve merge/deploy. QA por SHA, CI em andamento; próximos gates em EVOLVE-01.md.

## EVOLVE 02
Intake: #3 aberta, PR #1 Draft. Saída: #3 KEEP_OPEN (push), #4 KEEP_OPEN (mídia externa), PR #1 KEEP_OPEN_DRAFT. Código 0b66538174cb725083dd4d25b36a7c71ab8ed306; CI IN_PROGRESS. Sem merge/deploy.


### Revalidação e correção S019
- S017 [CI 45762573543](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762573543): PASS integral.
- S018 [CI 45762642054](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762642054): 11 unitários, 27 Rules e 12 Playwright PASS (50). E2E verificou pacotes RTP de áudio nas duas pontas com fonte sintética, além de prévia de voz e galeria de anexos. Não é prova de rede externa.
- S019 [CI 45762723200](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762723200): FAIL na compilação de Rules; substituição textual interpretou `$'` no regex e duplicou sufixo. Sem supressão de teste. Corrigido em 284c09ce38b65092ccd11aa3667b03060decddfe, reconstruindo Rules sobre S018 e substituindo via callback; [nova CI](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45762857318) em execução na última consulta. QA de purga/preview/vídeo e revogação final ainda NÃO homologado.
- Próximo: conferir nova CI e corrigir regressões comprovadas; #3/#4 permanecem abertas.

## EVOLVE 03
Entrada: 2 issues abertas (#3/#4), PR #1 Draft; saída: #3/#4/#5/#6 KEEP_OPEN, PR #1 KEEP_OPEN_DRAFT. Nenhum merge/deploy. CI final https://github.com/CristianoRFB/RFB-Chat/actions/runs/45911585835; LOCAL_E2E_PENDING_EXTERNAL_GATES_OPEN. Issue #2 histórica permanece fechada, mas a nova regressão de cadastro foi registrada e tratada em S024; não reutilizar a evidência histórica como prova desta versão.

## EVOLVE 04 — checkpoint S028 (26/11/2026)

- S025: CI 45912658637 PASS 11 unit, 31 Rules, 14 E2E; administração corrigida.
- S027: [visual QA](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45912988546) PASS, seis screenshots reais inspecionados e versionados em 600855b, 7 larguras; mapa de 58 IDs, 42 mapeados em componentes e 16 parciais/consolidados. Não é percentual de conclusão global.
- S027 CI 45912988561: 14/15 E2E; trace 15160334841 comprovou que o menu fechou após fixação. S028 d5a6482 reabre o menu pela interface, preservando asserções e sem retries. [CI S028](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45913486070): in_progress/pending; visual S028: in_progress/pending.
- Estado: VISUAL_PASS_S028_CI_PENDING. #3–#6 permanecem abertas. PR #1 Draft, main intocada, nenhum deploy ou billing. Acessibilidade integral, dispositivos físicos, marca aprovada e capturas de admin/grupos pendentes. Próximo: confirmar CI integral por SHA antes de iniciar EVOLVE 05.

## EVOLVE 05
Entrada/saída #3–#6 KEEP_OPEN, PR #1 Draft. Baseline S028 e checkpoint PASS. CI 61034de PASS, benchmark/infra/visual 81dd87d PASS, CI final pendente. Nenhum merge/deploy/faturamento. [Relatório](EVOLVE-05.md).
