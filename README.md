# RFB Chat — RFB Labs
**Estado:** laboratório funcional em Firebase Auth/Firestore Emulator, com validação automatizada; **não publicado, não homologado para uso real**. Especificação original: `docs/ESPECIFICACAO-RFB.txt`. RFB Method e inventário de aceites em `docs/rfb/COVERAGE.md`.

## Funcionalidades do laboratório
Login e recuperação de perfil local; conversas privadas e grupos; convites aceitos e cargos; canais de grupo; mensagens em tempo real; respostas, edição, reações, paginação e filtro de conversas; confirmação de entrega/leitura; notificações internas e privacidade; bloqueio e denúncias; moderação com custom claims; áudio WebM consentido até 20s; arquivos privados até 60KB com link até 23h e exclusão/revogação manual pelo autor; chamada de voz P2P **experimental** sem TURN/SFU.

**Atenção:** armazenamento inline e WebRTC local são limitados. Não existe criptografia ponta a ponta, hospedagem de mídia escalável, push, SLA, proteção completa antiabuso, backups ou deploy. A expiração do link NÃO elimina os bytes automaticamente do Firestore; o autor pode excluí-los manualmente. A UI de moderação exige custom claims atribuídas em ambiente de confiança — não há concessão de privilégio no cliente. Nunca usar com conversas privadas reais.

## Instalação local
Requer Node 22, npm, Java 21, portas 8080 e 9099 livres. O lockfile está versionado; usar sempre `npm ci`.

```sh
npm ci
npm run emulators
# Em outro terminal:
npm run dev
```

Abra o endereço Vite informado e cadastre contas **sintéticas** em navegadores ou sessões independentes. O Firebase usa `demo-rfb-chat`, não um projeto real. O histórico do emulador pode desaparecer após encerrá-lo.

## QA
```sh
npm run typecheck
npm run test
npm run test:rules
npm run build
npm run test:e2e
```

A suíte Playwright utiliza Chromium com microfone sintético em CI e **sem retries**. Testes de Rules exigem o Firestore Emulator disponível conforme o script `test:rules`. O checkpoint atual passou com **9 testes unitários, 20 regras Firestore e 10 fluxos E2E sem retries**: https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809. Inclui revogação de arquivo por autor, bloqueio ampliado e viewport de 320 a 1440px. A correção da concorrência de cadastro passou em três execuções sucessivas (run 45097362021); a Issue #2 está fechada. Ver `docs/rfb/STATE.json`. O build de produção exibe uma tela de bloqueio intencional.

## Controle e continuidade
- [Escopo original e aceites](docs/ESPECIFICACAO-RFB.txt)
- [Cobertura por AC e gates](docs/rfb/COVERAGE.md)
- [Estado canônico](docs/rfb/STATE.json)
- [Progresso e handoff](docs/rfb/PROGRESS.md)
- [Gates de produção e segurança](docs/rfb/RELEASE-GATES.md)
- [QA atualizado](docs/rfb/QA-2026-11-23.md)
- [Segurança de moderação](docs/ADMIN-MODERATION.md)
- [Benchmark UX](docs/BENCHMARK-UX-2026.md)
- [PR #1 Draft](https://github.com/CristianoRFB/RFB-Chat/pull/1)

**Meta de custo recorrente adicional: R$0**, sujeita a cotas. Nenhum Firebase real, Cloudflare de produção ou plano pago foi criado nesta rodada. Um PR aberto não significa que a branch main contém essas alterações.
