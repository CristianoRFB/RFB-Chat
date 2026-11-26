# Handoff do RFB Chat — 23/11/2026 (America/Sao_Paulo)
**Repositório:** `CristianoRFB/RFB-Chat`. **Branch:** `feature/rfb-starter-pack-v1`. **PR:** [#1 DRAFT](https://github.com/CristianoRFB/RFB-Chat/pull/1), sem merge ou deploy.
**SHA verificado do código:** `3dc7e7b4f1175509ae32476dd219ad8215c8be36`. **CI:** [45302857809](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809) PASS — 9 unit, 20 Rules, 10 E2E, npm ci, typecheck e build.

## Realizado
- A instabilidade de cadastro foi corrigida por serialização do perfil e confirmada em três execuções sucessivas do run 45097362021. [Issue #2](https://github.com/CristianoRFB/RFB-Chat/issues/2) fechada.
- 11 dos 12 recursos originais possuem fluxos funcionais testados no emulador (91,7% da matriz funcional local). O 12º tem sinalização P2P experimental.
- Hardening: bloqueio de DM impede mensagens/edições/reações/chamadas/ICE/novos anexos; denúncias têm transições válidas; áudio é imutável; arquivos podem ser eliminados pelo autor; reações usam listeners próximos ao viewport; 320/390/768/1440px testados em E2E.

## Limitações
Firebase é **somente emulador**. O build não oferece serviço de produção. Sem E2EE, push, TURN/SFU, política de retenção ou purga TTL automática, moderação privilegiada operacional, controle de quota, backup de produção, QA manual de WCAG/LGPD/OWASP ou publicação Cloudflare. Não tratar 58 telas conceituais como implementadas. Não adicionar serviços pagos ou conectar dados reais por conta própria.

## Retomada
1. Verificar PR head/checks/comments e arquivo `docs/rfb/STATE.json`.
2. Completar a [matriz de gates de produção](rfb/RELEASE-GATES.md) e avaliar 58 telas contra UI efetiva.
3. Testar mídia WebRTC em redes reais, acessibilidade por teclado/leitor de tela, LGPD/retencão/segurança e cotas.
4. Solicitar aprovação de configuração real e orçamento antes de habilitar Firebase/Cloudflare; manter PR Draft até revisão humana.


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
