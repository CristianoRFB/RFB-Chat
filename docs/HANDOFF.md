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
