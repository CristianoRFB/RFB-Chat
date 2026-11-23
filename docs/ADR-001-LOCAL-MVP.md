# ADR-001 — MVP local isolado: Auth + Firestore

Estado: **PROPOSTA IMPLEMENTADA_NAO_VERIFICADA** (22/11/2026). Fonte: `docs/ESPECIFICACAO-RFB.txt`, RFB Method `stack.md`.

## Escopo
Fluxo individual: cadastro/login no Auth Emulator, perfil mínimo sem e-mail no Firestore, convite por UID explícito, conversa com 2 membros, mensagens limitadas a 2.000 caracteres, sincronia via `onSnapshot`, máximo 50 mensagens recentes e recuperação por reload. Sem grupos, leitura, push, anexos, presença, E2EE ou deploy.

## Modelo e autorização
- `profiles/{uid}`: nome público para usuário autenticado; apenas o dono cria/altera; listagem proibida.
- `conversations/dm_{uidA}_{uidB}`: membros são dois UIDs, ordenados pelo cliente; criação requer dois perfis existentes, autor membro e timestamp do servidor. Edição e exclusão proibidas.
- `conversations/{id}/messages/{autoId}`: remetente autenticado e membro, corpo 1–2.000 caracteres, timestamp de servidor. Mensagens imutáveis neste slice.
- A interface usa o status **Gravado** quando o SDK confirma o servidor, **Enviando** durante escrita local. Não afirma lido/entregue; reações e receipts dependem de uma nova fatia.

## Riscos documentados
- A criação de DMs é permitida para qualquer conta cadastrada com UID conhecido, sem convite/bloqueio; requer antiabuso e bloqueio antes de produção.
- O UID é identificador, não segredo. Não divulgar e-mail no documento de perfil; texto das mensagens não é E2EE.
- Sem exclusão/moderação/retenção e sem rate limit. Não produzir dados reais nem deploy.
- Ordenação por createdAt: durante pendência o timestamp pode ainda não estar resolvido; confirmar no QA.
- Lockfile e testes não executados na sessão sem acesso à rede npm; revisar dependências/versions antes de homologar.

## Comandos previstos
```sh
npm install
npm run emulators
# Outro terminal
npm run dev
npm run typecheck
npm run test
npm run build
npm run test:rules
```

A aplicação usa o projeto **`demo-rfb-chat` exclusivamente em Vite DEV**, portas locais 9099/8080. Build de produção exibe bloqueio intencional. Nunca selecionar conta Firebase real por acidente. Referências: https://firebase.google.com/docs/emulator-suite/connect_auth e https://firebase.google.com/docs/firestore/security/test-rules-emulator.
