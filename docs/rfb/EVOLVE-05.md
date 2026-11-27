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
