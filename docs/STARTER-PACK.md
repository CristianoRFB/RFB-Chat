# RFBChat — Starter Pack inicial (RFB Method)

> **ESTADO ATUAL:** `BLUEPRINT_ORIGINAL_PRESERVADO / STARTER_SPECIFIED / APP_NOT_CREATED / QA_NOT_RUN / DEPLOY_NOT_DONE`. Repositório individual iniciado; a UI inicial ainda não é o MVP funcional. O conceito não equivale a software pronto.

## 00. Proveniência e estado de importação

- **Especificação atual RFB:** [ESPECIFICACAO-RFB.txt](ESPECIFICACAO-RFB.txt).
- **Proveniência GitHub e SHA:** [PROVENIENCIA.md](PROVENIENCIA.md).
- **Novo repositório individual:** `CristianoRFB/RFB-Chat`, público; ainda sem aplicativo funcional ou deploy.
- **Materiais binários:** PNGs e ZIP histórico não foram copiados para repositório público por falta de revisão de licenças/marca.
- **Estado:** G0 documentos importados, scaffold G1, backend/QA/browser/deploy NOT_RUN.

## 01. Definição do produto — origem do usuário

**Segmento:** Comunicação e colaboração. **Slogan:** Conversas que acompanham sua equipe.

**Problema:** Pequenas equipes e comunidades precisam trocar mensagens, organizar grupos, encontrar arquivos e manter histórico sincronizado.

**Quem usa:** Equipes pequenas, comunidades e grupos de trabalho.

**Prova de valor pretendida:** Dois usuários em navegadores diferentes conversam em tempo real, recebem confirmações e mantêm a conversa após atualizar.

**Identidade visual proposta:** Mensageria com duas colunas, conversas rápidas e estados muito claros.

## 02. MVP implementável, não somente protótipo ilustrado

**Hipótese da primeira fatia:** reproduzir a jornada principal abaixo com **dados sintéticos**, navegação de verdade, lógica testável e persistência/autorização quando o backend for introduzido. Começar com 1 fluxo completo; não implementar 58 telas superficiais ao mesmo tempo.

1. Entrar com conta
2. Criar conversa
3. Enviar mensagem
4. Entregar e sincronizar
5. Confirmar leitura
6. Retomar histórico

**Recorte de escopo G2 (decisão proposta):** `Conversa individual e grupo + Envio de texto e reações + Responder e editar mensagem`; validar dependências de identidade, permissões e estados com a fonte original antes do código. Critério de demonstração: Dois usuários em navegadores diferentes conversam em tempo real, recebem confirmações e mantêm a conversa após atualizar.

**Fora do primeiro slice (planejado):** Indicadores de enviado/recebido/lido; Mensagens com paginação; Busca por conversa; Convites e cargos em grupos; Áudio gravado com consentimento; Arquivos privados com links temporários; demais integrações conforme risco/custo. Nada dessas funções está implementado no repositório de metodologia.

## 03. Atores e regras de acesso

- **A-01 — Visitante:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-02 — Pessoa autenticada:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-03 — Administrador de grupo:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-04 — Moderador:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.
- **A-05 — Administrador da plataforma:** definir recursos permitidos, negados e testes 401/403 por rota, tenant e ownership; nenhuma role vem do body do cliente.

## 04. Domínios e módulos

**Módulos originais (10):** Conversas; Grupos e membros; Canais; Arquivos e mídia; Chamadas; Pesquisa; Notificações; Perfil e privacidade; Moderação; Administração.

**Entidades propostas (modelagem original, cardinalidades não homologadas):** Usuario; Perfil; Conversa; Participacao; Mensagem; Anexo; Reacao; Leitura; Chamada; Convite; Denuncia.

**Features originais (12):**
- [ ] **F-01** Conversa individual e grupo — requisito/aceite AC-01; código e teste `NOT_RUN`.
- [ ] **F-02** Envio de texto e reações — requisito/aceite AC-02; código e teste `NOT_RUN`.
- [ ] **F-03** Responder e editar mensagem — requisito/aceite AC-03; código e teste `NOT_RUN`.
- [ ] **F-04** Indicadores de enviado/recebido/lido — requisito/aceite AC-04; código e teste `NOT_RUN`.
- [ ] **F-05** Mensagens com paginação — requisito/aceite AC-05; código e teste `NOT_RUN`.
- [ ] **F-06** Busca por conversa — requisito/aceite AC-06; código e teste `NOT_RUN`.
- [ ] **F-07** Convites e cargos em grupos — requisito/aceite AC-07; código e teste `NOT_RUN`.
- [ ] **F-08** Áudio gravado com consentimento — requisito/aceite AC-08; código e teste `NOT_RUN`.
- [ ] **F-09** Arquivos privados com links temporários — requisito/aceite AC-09; código e teste `NOT_RUN`.
- [ ] **F-10** Notificações e preferências — requisito/aceite AC-10; código e teste `NOT_RUN`.
- [ ] **F-11** Bloqueio e denúncia — requisito/aceite AC-11; código e teste `NOT_RUN`.
- [ ] **F-12** Chamadas individuais opcionais — requisito/aceite AC-12; código e teste `NOT_RUN`.

## 05. Stack e decisão de R$0

**Stack candidata original:** React + TypeScript + Vite; Cloudflare Workers / Static Assets; Firebase Auth / Firestore; ferramentas opcionais conforme módulo.

**Especialização original:** Firestore onSnapshot para MVP; para presença efêmera considerar Realtime Database; Workers para API segura.

**Risco/custo apontado na fonte:** Chamadas/áudios/arquivos exigem mídia, possível TURN/SFU, limites e cobrança por volume.

**Risco de domínio:** Não prometer criptografia ponta a ponta sem protocolo auditado; WebRTC e TURN têm custo em escala.

**Decisão de implementação proposta:** React + TypeScript + Vite para interface responsiva; Firebase Emulator como primeira persistência testável; Workers/Static Assets e Firebase Auth/Firestore **somente quando houver necessidade e conta autorizada**. No projeto novo consultar Cloudflare CLI `cf` e documentação atual; projetos legados Wrangler ficam em Wrangler. Não instalar R2, Stream, mapas comerciais, pagamento real ou API de IA paga por padrão. Custo recorrente adicional alvo: **R$0**, sujeito às cotas e pré-requisitos reais; nunca prometer produção escalável gratuita.

**Segurança transversal:** sem credenciais no repositório; tokens validados em backend, Firestore Rules testadas, API privilegiada não confia no userId/tenantId/preço/role enviados pelo navegador; logs sem dados sensíveis. Para funcionalidades de comunicação e colaboração, revisar requisitos de segurança e leis pertinentes antes de dados reais.

## 06. Telas e diagramas

- [UX, layout desktop/mobile, catálogo T001–T058 e QA](UX-DESIGN-AND-QA.md) — conceitos originais do ZIP NÃO são screenshots de aplicativo.
- [Diagramas, riscos de modelagem, C4, UML e ERD](DIAGRAMAS.md) — desenhos de arquitetura **propostos**, validação de cardinalidade e semântica ainda pendente.
- [Roadmap e gates por fase](ROADMAP.md) — preparação para repositório independente, sem merge/deploy antecipado.

## 07. Critérios de entrega do Starter Pack

- [x] Requisito ORIGINAL transcrito e preservado, com identificador da fonte.
- [x] Resumo do problema, atores, módulos, jornada, 12 features, telas e dependências em documentos editáveis.
- [x] Diagramas editáveis Mermaid propostos; todos devem passar revisão de arquitetura antes de virar schema.
- [ ] Pesquisa externa do segmento atual, concorrentes e decisões de posicionamento com referências/data/observações `NOT_RESEARCHED_FOR_THIS_PROJECT`.
- [ ] Design PNG original do ZIP extraído e versionado no **repo individual** com integridade/licença (arquivo binário ainda não está nesta branch).
- [ ] Código React/TypeScript gerado, com build real e primeiro fluxo implementado `NOT_CREATED`.
- [ ] Regras Firebase/Workers com testes E2E, autenticação e autorização reais `NOT_RUN`.
- [ ] Capturas de tela verdadeiras, feedback de usuário, deploy/preview Cloudflare `NOT_RUN`.
- [ ] Aprovação do escopo e URL do repositório específico `PENDING_USER_CREATION`.

## 08. Handoff para o futuro repo `RFBChat`

1. Criar repositório individual **quando solicitado pelo usuário**; verificar se já existe antes de propor novo, conferir Issues/PRs/HEAD.
2. Importar **sem modificar** original TXT e assets documentais do ZIP na pasta de `01-rfbchat`; registrar hashes no manifest; não confundir PNG de conceito com screenshot de produto.
3. Transportar Starter Pack/UX/Diagramas/Roadmap, adaptar paths e marcar tarefas do projeto no Issue tracker; a fonte original permanece referência imutável.
4. Antes de programar pesquisar mercado e UX do **nicho específico**, validar fluxo principal, DTO/Rules/segurança/uso em dispositivo, escolher stack realmente suportada e custo R$0.
5. Implementar primeira fatia da jornada acima e provar com testes executados; atualizar `ROADMAP.md` e `STATE/PROGRESS` a cada checkpoint; `codex:pc` prioriza browser, execução local, testes do Firebase Emulator e screenshot.
6. Somente quando demonstrável e realmente publicado incluir no **portfólio profissional** com selo `PROTÓTIPO` ou `PROJETO CONCLUÍDO` de acordo com evidência. Não editar o Worker profissional nesta rodada.
