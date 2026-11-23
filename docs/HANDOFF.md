# Handoff — RFB Chat (RFB Method)

Atualizado em 22/11/2026, PR draft #1: https://github.com/CristianoRFB/RFB-Chat/pull/1. Branch `feature/rfb-starter-pack-v1`. HEAD anterior ao checkpoint: `5ac833843306709f84bbd50c1e7a9ceb7ae6dddc`.

## Entregue como código, ainda sem validação real
- `d7248d50`: Firebase SDK conectado apenas aos emuladores locais, Firestore Rules, testes unitários de modelo e testes de regras.
- `b247abdc`: UI React responsiva, cadastro/login local, procurar outra pessoa por UID, criar DM, enviar textos e observar mudanças em tempo real, reload via Firestore.
- `5ac83384`: workflow Actions para instalar deps, typecheck, unit tests, build e Rules no Firestore Emulator.

## Pendências obrigatórias
- Inspecionar resultado real de CI em SHA exato e registrar PASS/FAIL. No checkpoint, duas execuções foram iniciadas, sem conclusão registrada.
- Criar `package-lock.json` a partir de instalação íntegra; executar E2E em dois perfis com contas sintéticas; testar outsider e 401/403, mobile, teclado, offline e retry.
- Revisar UX e atualização de indicadores; ainda **não há confirmação de entregue/lido**, nem E2EE, upload ou moderação.
- Meta R$0 adicional; sem produção, Cloudflare, Blaze, domínios, segredos ou usuários reais. **Nunca mesclar PR por ser mergeable**.

## Como retomar
1. GitHub first: comparar PR #1 HEAD/branch/checks/reviews/Issues com `docs/rfb/STATE.json`.
2. Se CI falhar, ler logs da etapa concreta, aplicar uma única correção rastreável; não marcar PASS sem execução.
3. Depois, `npm install`, `npm run emulators`, `npm run dev`, `npm run test:rules` e QA browser em duas janelas isoladas.
4. Salvar SHA, testes e relatório em `docs/rfb/`, mantendo PR draft.
