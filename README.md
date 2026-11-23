# RFB Chat — RFB Labs

**Estado: IMPLEMENTADO_NAO_VERIFICADO (laboratório local).** Código para cadastro, duas contas, conversa individual, mensagens com `onSnapshot` e histórico local no Firestore Emulator. **Não está em produção**: sem deploy, sem CI executada, sem teste E2E e sem validação do runtime nesta sessão.

## Executar localmente

Pré-requisitos: Node.js compatível com Vite 7, npm, Java 21 e portas **9099** e **8080** livres.

```sh
npm install
npm run emulators
```

Em outro terminal:

```sh
npm run dev
```

Abra o localhost informado pelo Vite em duas sessões independentes (normal e privada) ou dois navegadores. Cadastre duas contas de teste (e-mails sintéticos), copie o UID visível da conta B, crie uma conversa na conta A, envie mensagens nos dois sentidos e recarregue. **Todos os dados são do emulador**; encerrar o processo pode apagá-los.

## Validação obrigatória

```sh
npm run typecheck
npm run test
npm run build
npm run test:rules
```

`test:rules` inicia o Firestore Emulator separadamente. Execute somente após instalar dependências. O laboratório usa ID `demo-rfb-chat`, valores fictícios e portas fixas no loopback. Build de produção mostra um bloqueio informativo, não um chat conectado a produção.

## Proteções e limites

- Login por e-mail/senha no Auth Emulator; autenticação de terceiros e produção desabilitadas neste recorte.
- Conversas de dois membros; mensagens só podem ser lidas/escritas por membros conforme `firestore.rules`.
- Listagem de perfis negada; descobrir a outra pessoa exige compartilhar UID conscientemente.
- Até 50 mensagens recentes por conversa; sem paginação antiga neste recorte.
- Status de mensagem `Enviando` / `Gravado` não significa entregue/lida.
- Sem anexos, chamadas, grupos, E2EE, bloqueio, moderação ou antiabuso. Não utilizar para dados reais.

Consulte `docs/ADR-001-LOCAL-MVP.md`, `docs/rfb/STATE.json`, `docs/rfb/PROGRESS.md`, `docs/HANDOFF.md` e os documentos originais do Starter Pack. O projeto mantém a meta de **R$0/mês de custo recorrente**, condicionada a cotas e à futura revisão da infraestrutura.
