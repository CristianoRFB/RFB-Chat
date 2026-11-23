# Roadmap específico — RFBChat (RFB Method)

> **Checkpoint técnico posterior à importação (22/11/2026):** G1 código e primeira fatia G2 para emuladores foram escritos no PR #1, sem prova de execução. A implementação está em `src/App.tsx`, `src/chat-data.ts`, `src/firebase.ts`, `firestore.rules`; `npm install`, typecheck, unit tests, build, rules tests e E2E dependem de resultados reais. Os títulos/checkboxes seguintes registram o plano original e não devem ser interpretados como estado de execução recente. Fonte de verdade: `docs/rfb/STATE.json`.

**Origem:** blueprint original do usuário (22/11/2026); **estado técnico:** `G0_DOCS_IMPORTED / APP_NOT_CREATED / QA_NOT_RUN`. Marcadores abaixo são gate de trabalho, **não aprovação implícita**. Este Starter Pack foi importado em `CristianoRFB/RFB-Chat` na branch `feature/rfb-starter-pack-v1`; ainda não existe aplicação real.

## Gate G0 — fonte, pesquisa e decisão do primeiro produto (parcial)

- [x] Preservar especificação original textual e nome/numeração do projeto.
- [x] Inventariar 10 módulos, 12 features, entidades, 58 telas e jornada; 7 diagramas editáveis iniciais.
- [x] Relacionar riscos técnicos/custos à fonte original.
- [ ] Ler e comparar **3–5 produtos/soluções reais do mesmo nicho**; anotar URL/data, forças de UX, oportunidade e riscos. Não copiar mídia/código/marca de terceiros.
- [ ] Validar público, diferenciais e critérios de MVP, inclusive experiência mobile.
- [ ] Importar PNGs conceituais do ZIP no repo individual e conferir SHA antes de declarar assets versionados.
- [ ] Aprovar arquitectura, permissões, modelo de dados e requisitos aplicáveis ao MVP.

## Gate G1 — bootstrap de repositório e ambiente (não iniciado)

- [x] O usuário criou o repositório público `CristianoRFB/RFB-Chat`; main inicializada, branch de Starter Pack aberta, nenhum Issue/PR preexistia.
- [ ] Usar `rfb:starter` depois de ler o repo, respeitando `AGENTS.md`, `stack.md`, AntiVibeCoding, AntiLoop e proteção de dados.
- [ ] Scaffold React/TS/Vite/Vitest preparado; lockfile e Firebase Emulator pendentes, build/QA NOT_RUN.
- [ ] Nenhuma integração paga, segredo ou dado real; Meta operacional **R$0/mês adicional**.
- [ ] Rodar `npm install`, `npm run typecheck`, `npm run test`, `npm run build` em checkout real e guardar logs/exit codes; sem executor `NOT_RUN`.
- [ ] Branch/PR/Issue, checkpoint e rollback antes de persistência/produção.

## Gate G2 — fluxo vertical mínimo demonstrável (não iniciado)

**Jornada original a implementar e testar:**

1. Entrar com conta
2. Criar conversa
3. Enviar mensagem
4. Entregar e sincronizar
5. Confirmar leitura
6. Retomar histórico

- [ ] Implementar o fluxo inteiro usando estados reais de UI, dados sintéticos e operações coerentes.
- [ ] Testar persistência após recarregar e duas sessões se o domínio exigir, sem vazar registros.
- [ ] Autorizar de modo server-side/Rules todos os comandos protegidos. Casos 401/403 e usuários/tenants distintos.
- [ ] Tratar loading, empty, erro, offline/conflito, retry/idempotência e recuperação, conforme o caso.
- [ ] Captura screenshot real mobile e desktop com SHA/URL do build, nunca usar mockup como evidência de funcionamento.

## Gate G3 — módulos, atores e exceções principais (não iniciado)

- [ ] Selecionar e implementar os demais módulos originais conforme prioridade comprovada, não necessariamente todas as 58 telas físicas.
- [ ] Testar transições da máquina de estados, concorrência e políticas de retenção/exclusão.
- [ ] Adicionar perfis de usuários apenas com matriz RBAC/ABAC e testes de negação.
- [ ] Criar relatórios/logs não sensíveis e mecanismos de recuperação/backup compatíveis com as cotas.

## Gate G4 — integrações externas condicionais (bloqueadas até análise)

- [ ] Validar custos e requisitos de RFBChat: Não prometer criptografia ponta a ponta sem protocolo auditado; WebRTC e TURN têm custo em escala.
- [ ] Risco específico: Não prometer criptografia ponta a ponta sem protocolo auditado; WebRTC e TURN têm custo em escala.
- [ ] Se houver pagamentos, vídeo, IA, mapas/tiles, R2 ou dispositivos físicos: sandbox/fixture e orçamento aprovado antes de produzir; nunca ativar serviços pagos automaticamente.
- [ ] Provar callback/webhook autorizado, assinatura/verificação, retentativas, concorrência e monitoramento quando existirem.

## Gate G5 — QA e engenharia de qualidade (não executado)

- [ ] Vitest (regras, modelos, invariantes), contratos HTTP, Firestore Emulator Rules, teste de concorrência/idempotência.
- [ ] Playwright Chrome desktop/mobile em 320/360/390/430/768/1024/1440 px com screenshot/screencast dos fluxos e falhas.
- [ ] OWASP ASVS 5.0 aplicável, autorização server-side, LGPD, uso de assets licenciados, auditoria de dependências, acessibilidade WCAG 2.2.
- [ ] Checks GitHub CI/Actions executados e aprovados em HEAD exato; reviewer independente e validação humana do produto.
- [ ] Rastrear cada requisito abaixo até código, teste, issue e evidência `PASS`.

**12 aceites originais — todos NÃO comprovados:**
- [ ] AC-01: Conversa individual e grupo — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-02: Envio de texto e reações — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-03: Responder e editar mensagem — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-04: Indicadores de enviado/recebido/lido — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-05: Mensagens com paginação — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-06: Busca por conversa — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-07: Convites e cargos em grupos — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-08: Áudio gravado com consentimento — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-09: Arquivos privados com links temporários — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-10: Notificações e preferências — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-11: Bloqueio e denúncia — persistência, autorização, concorrência, teste de integração, teste E2E.
- [ ] AC-12: Chamadas individuais opcionais — persistência, autorização, concorrência, teste de integração, teste E2E.

## Gate G6 — integração, publicação e portfólio profissional (não iniciado)

- [ ] Aprovação explícita para deploy na conta/projeto/branch identificados; confirmar limite de custo, segurança e rollback.
- [ ] Preview isolado real com URL aberta e verificada; não tocar Cloudflare/Firebase existentes sem necessidade.
- [ ] Fotos e textos com licença/origem; navegação completa e métricas apenas comprovadas.
- [ ] Promover repo só quando CI/QA e gates de privacidade atendidos; não tratar mergeable=true como aprovação.
- [ ] No portfólio profissional `cristiano-bueno-portfolio.on7.workers.dev`, mostrar inicialmente **Planejamento/Conceito**; quando implementação/teste existirem, evoluir para **Protótipo** e depois **Aplicação**, com screenshots reais e links confirmados. Esta atualização do RFB Method **não modifica o Worker**.

## Quadro de estado e rastreabilidade

| Item | Estado | Evidência ou ausência |
|---|---|---|
| Fonte original | `IMPORTED_VERBATIM` | `ESPECIFICACAO-RFB.txt` |
| Fluxo G2 | `PLANNED` | Jornada acima |
| Modelagem | `DRAFT` | `DIAGRAMAS.md`, cardinalidades pendentes |
| Telas e UX | `SPECS_IMPORTED` | `UX-DESIGN-AND-QA.md`, PNGs no ZIP |
| Código React/TS | `NOT_CREATED` | Nenhum repo individual |
| Firebase/Cloudflare | `NOT_DEPLOYED` | Nenhum recurso novo autorizado |
| Testes E2E/CI | `NOT_RUN` | Sem app/checkout |
| Portfólio profissional | `NOT_ADDED` | Worker existente preservado |

**Próxima ação executável no futuro repo:** depois do usuário criar o repositório, importar assets com hashes, fazer pesquisa de nicho, escrever critério G2 e implementar o primeiro fluxo com teste real. Registrar avanço em `ROADMAP.md`, `STATE.json`, `PROGRESS.md` e Issues/PRs somente após execução.
