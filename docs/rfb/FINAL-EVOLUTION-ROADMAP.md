# Final Evolution Roadmap — RFB Chat V1

Meta: release V1.0.0, zero custo recorrente adicional dentro das cotas, sem merge/deploy sem autorização. Escopo original de 12 AC preservado; extensões competitivas explicitadas.

| EVOLVE | Entrega e gate | Situação |
|---|---|---|
| 01 Complete Messaging | busca, presença, exclusão, encaminhamento, fixação, push, offline, grupos/canais, documentação; duas sessões, persistência, Rules | CI local PASS; push bloqueado #3 |
| 02 Media Engine | áudio, arquivos privados, galeria, compressão, WebRTC, expiração; mídia real e cota | Parcial: S017-S019; CI IN_PROGRESS; #4 externo |
| 03 Administration & Security | gestão, denúncias, RBAC, antispam, auditoria, LGPD | Pendente |
| 04 Visual Excellence | benchmark, 58 T-IDs reconciliados, design system arredondado, temas, acessibilidade, logo/assinatura, Anti-AI Slop | Pendente |
| 05 Performance & Infrastructure | listeners, cache, PWA, FCM autorizado, monitoramento, cotas, backup/rollback | Pendente |
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
