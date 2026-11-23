# Handoff — RFB Chat (22/11/2026, America/Sao_Paulo)
**PR:** https://github.com/CristianoRFB/RFB-Chat/pull/1 — DRAFT, base `main`, branch `feature/rfb-starter-pack-v1`.
**HEAD ao checkpoint:** `f7958c4fc123109633d8b9f0cdf296001acac2e8`.
**Último verde confirmado:** `60b0453e23dd850997aa1ec7223e39f878df4134` — https://github.com/CristianoRFB/RFB-Chat/actions/runs/45095871951 — 9 unit, 17 Rules, 8 E2E, typecheck/build PASS, sem retry.
**Última CI ainda pendente:** https://github.com/CristianoRFB/RFB-Chat/actions/runs/45096426299.

## O que está implementado
Auth Emulator e Firestore Emulator; perfis privados; DM/grupos/convites/admin/canais; resposta/edição/reações/entrega/leitura/paginação/busca; notificações internas e preferências; bloqueio e denúncias, painéis de moderação gated; WebM consentido; arquivos com link temporário; WebRTC P2P local com sinalização e mic sintético.

## Limitações não negociáveis
Sem merge/deploy, sem Firebase real, sem Cloudflare alterado, sem Blaze ou plano pago, sem contas/conversas reais. WebRTC sem TURN não garante conectividade externa nem qualidade; nenhum E2EE. Anexos em Firestore inline (60KB) não são arquitetura escalável. Painel moderador não atribui privilégios, exige custom claims confiáveis. Faltam política de retenção/exclusão, quotas, backup e auditoria de LGPD/OWASP/WCAG.

## Retomada executável
1. Conferir HEAD/PR #1/Issue #2/checks/reviews/Actions e reconciliar `docs/rfb/STATE.json`.
2. Abrir a última execução do HEAD: https://github.com/CristianoRFB/RFB-Chat/actions/runs/45096426299; corrigir falhas reais e atualizar estado após commit.
3. Validar recuperação de perfil recém-criado e notificações com 3 usuários; 3 execuções sem retries antes de fechar Issue #2.
4. Auditoria real de regras/conflitos/concorrência/denúncias, QA mobile ampla, revisão dos PNGs/58 conceitos e licenças.
5. Sem aprovação para produção, preservar PR como DRAFT; somente liberar após gates G5/G6.
