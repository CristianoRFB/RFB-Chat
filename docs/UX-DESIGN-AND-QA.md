# RFBChat — UX, identidade e catálogo completo de telas

> **BASE DO USUÁRIO:** os 58 T-IDs abaixo são os planejados na fonte original, NÃO telas programadas. Os 10 PNGs de conceito existentes no ZIP são artes demonstrativas, NÃO prints do produto executando. **Este repositório público recebe o catálogo textual; os 255 PNG originais do ZIP ainda não foram importados nem revisados quanto à marca/licença.**

## Identidade de produto baseada na fonte

- **Segmento:** Comunicação e colaboração.
- **Direção visual original:** Mensageria com duas colunas, conversas rápidas e estados muito claros.
- **Cor de acento no índice do ZIP:** `#6D5EF7`; verificar contraste AA 4,5:1 normal, 3:1 texto grande e estados focados WCAG 2.2.
- **Experiência principal:** Conversas → Grupos e membros → Canais.
- **Arquitetura/condição especializada:** Firestore onSnapshot para MVP; para presença efêmera considerar Realtime Database; Workers para API segura.
- Padrão: desktop 1440 px com grid e navegação consistente, tablet 768/1024 px com reorganização de densidade, mobile 320/360/390/430 px com alvo tátil e CTA alcançável; layout flexível, sem scroll horizontal nem microtexto.

## PNGs ORIGINAIS — localizados no ZIP, não nesta branch

Caminho exato de origem: `RFB-LABS-2026/repos-individuais/01-rfbchat/design/PNG/`.

- **IMG-01** — `01-home.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-02** — `02-fluxo-principal.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-03** — `03-detalhe-e-estado.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-04** — `04-painel-operacional.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-05** — `05-admin-e-permissoes.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-06** — `06-relatorios-e-indicadores.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-07** — `07-configuracoes-e-seguranca.png` — conceito desktop/fluxo geral; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-08** — `08-mobile-home.png` — conceito mobile; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-09** — `09-mobile-fluxo.png` — conceito mobile; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).
- **IMG-10** — `10-mobile-perfil.png` — conceito mobile; estado `SOURCE_ZIP_ONLY` (não copiado ao GitHub).

Outros arquivos do original: `design/desktop.svg`, `design/mobile.svg`, 8 PNG de diagramas e fontes DOT/Mermaid. Ao criar repo independente, copiar assets originais com hashes; para recursos de terceiros validar direitos e não publicar imagem sem licença.

## Navegação e hierarquia inicial (decisão de Starter Pack)

**Primeira demonstração funcional proposta:** começar por Conversas, usando Grupos e membros e Canais como navegação/contexto. Não escrever conteúdo genérico de SaaS em todas as telas; o domínio comunicação e colaboração precisa ser visível no hero, no objeto principal e no CTA. A página deve mostrar o estado vazio, sucesso e falha com feedback concreto, não meros cartões estáticos.

- **Mobile:** menu conciso, CTA principal e fluxo do ator mais comum; títulos específicos, controles 44x44 px quando viável, scroll natural; movimento reduzido respeitado.
- **Desktop:** navegação lateral/superior quando pertinente, conteúdo principal + ações secundárias; evitar enfeites sem função.
- **Acessibilidade:** HTML semântico, foco visível, labels reais, mensagens de erro associadas, teclado, leitor de tela, skip link e `prefers-reduced-motion`.
- **Copy:** dados sintéticos identificados, sem reviews, métricas ou promessas de produto fictícias.

## Catálogo de T001 a T058 — blueprint histórico, não status atual

O marcador NOT_IMPLEMENTED a seguir pertence à importação original. Existem fluxos locais implementados em React para cadastro/login, conversas, grupos, canais, privacidade, mídia e moderação. A correspondência tela a tela e o QA visual manual serão reconciliados no EVOLVE 04. Não inferir 58 telas prontas. Ver [COVERAGE](rfb/COVERAGE.md) e [STATE](rfb/STATE.json).

| Tela | Especificação original | Estágio |
|---|---|---|
| T001 | Landing / apresentação | `NOT_IMPLEMENTED` |
| T002 | Cadastro / criar conta | `NOT_IMPLEMENTED` |
| T003 | Login e recuperar acesso | `NOT_IMPLEMENTED` |
| T004 | Onboarding e perfil | `NOT_IMPLEMENTED` |
| T005 | Página principal / feed | `NOT_IMPLEMENTED` |
| T006 | Busca e filtros | `NOT_IMPLEMENTED` |
| T007 | Detalhes do recurso | `NOT_IMPLEMENTED` |
| T008 | Fluxo de criação | `NOT_IMPLEMENTED` |
| T009 | Fluxo de edição | `NOT_IMPLEMENTED` |
| T010 | Confirmação / revisão | `NOT_IMPLEMENTED` |
| T011 | Estado concluído / recibo | `NOT_IMPLEMENTED` |
| T012 | Lista pessoal / histórico | `NOT_IMPLEMENTED` |
| T013 | Notificações | `NOT_IMPLEMENTED` |
| T014 | Mensagens ou contato | `NOT_IMPLEMENTED` |
| T015 | Central de ajuda | `NOT_IMPLEMENTED` |
| T016 | Preferências e privacidade | `NOT_IMPLEMENTED` |
| T017 | Acesso e segurança | `NOT_IMPLEMENTED` |
| T018 | Página vazia / primeira vez | `NOT_IMPLEMENTED` |
| T019 | Carregamento e skeleton | `NOT_IMPLEMENTED` |
| T020 | Erro de rede / retentar | `NOT_IMPLEMENTED` |
| T021 | Sem permissão / bloqueio | `NOT_IMPLEMENTED` |
| T022 | Estado de conflito concorrente | `NOT_IMPLEMENTED` |
| T023 | Admin: visão geral | `NOT_IMPLEMENTED` |
| T024 | Admin: gestão de usuários | `NOT_IMPLEMENTED` |
| T025 | Admin: moderação e auditoria | `NOT_IMPLEMENTED` |
| T026 | Admin: regras e configurações | `NOT_IMPLEMENTED` |
| T027 | Admin: relatórios | `NOT_IMPLEMENTED` |
| T028 | Página 404 / recurso indisponível | `NOT_IMPLEMENTED` |
| T029 | Módulo / Conversas — lista | `NOT_IMPLEMENTED` |
| T030 | Módulo / Conversas — detalhe | `NOT_IMPLEMENTED` |
| T031 | Módulo / Conversas — criar/editar | `NOT_IMPLEMENTED` |
| T032 | Módulo / Grupos e membros — lista | `NOT_IMPLEMENTED` |
| T033 | Módulo / Grupos e membros — detalhe | `NOT_IMPLEMENTED` |
| T034 | Módulo / Grupos e membros — criar/editar | `NOT_IMPLEMENTED` |
| T035 | Módulo / Canais — lista | `NOT_IMPLEMENTED` |
| T036 | Módulo / Canais — detalhe | `NOT_IMPLEMENTED` |
| T037 | Módulo / Canais — criar/editar | `NOT_IMPLEMENTED` |
| T038 | Módulo / Arquivos e mídia — lista | `NOT_IMPLEMENTED` |
| T039 | Módulo / Arquivos e mídia — detalhe | `NOT_IMPLEMENTED` |
| T040 | Módulo / Arquivos e mídia — criar/editar | `NOT_IMPLEMENTED` |
| T041 | Módulo / Chamadas — lista | `NOT_IMPLEMENTED` |
| T042 | Módulo / Chamadas — detalhe | `NOT_IMPLEMENTED` |
| T043 | Módulo / Chamadas — criar/editar | `NOT_IMPLEMENTED` |
| T044 | Módulo / Pesquisa — lista | `NOT_IMPLEMENTED` |
| T045 | Módulo / Pesquisa — detalhe | `NOT_IMPLEMENTED` |
| T046 | Módulo / Pesquisa — criar/editar | `NOT_IMPLEMENTED` |
| T047 | Módulo / Notificações — lista | `NOT_IMPLEMENTED` |
| T048 | Módulo / Notificações — detalhe | `NOT_IMPLEMENTED` |
| T049 | Módulo / Notificações — criar/editar | `NOT_IMPLEMENTED` |
| T050 | Módulo / Perfil e privacidade — lista | `NOT_IMPLEMENTED` |
| T051 | Módulo / Perfil e privacidade — detalhe | `NOT_IMPLEMENTED` |
| T052 | Módulo / Perfil e privacidade — criar/editar | `NOT_IMPLEMENTED` |
| T053 | Módulo / Moderação — lista | `NOT_IMPLEMENTED` |
| T054 | Módulo / Moderação — detalhe | `NOT_IMPLEMENTED` |
| T055 | Módulo / Moderação — criar/editar | `NOT_IMPLEMENTED` |
| T056 | Módulo / Administração — lista | `NOT_IMPLEMENTED` |
| T057 | Módulo / Administração — detalhe | `NOT_IMPLEMENTED` |
| T058 | Módulo / Administração — criar/editar | `NOT_IMPLEMENTED` |

**Prioridade de desenvolvimento:** T001 apresentação, T003 login se realmente requerido, T005 primeira tela do produto, T007 recurso, T008 criação, T009 edição, T010 confirmação, T018–T022 vazios/erro/concorrência, T028 404 e T029–T031 primeiro módulo, mais telas necessárias ao fluxo end-to-end. Não gerar telas de admin/moderação sem domínio, autorização e dados reais de teste.

## Contrato de design para exportação futura

**D-UX-01:** mockup desktop e mobile de cada tela prioritária, mantendo estilo original sem usar o PNG como prova de execução. **D-UX-02:** user flow clicável ou interativo, separado do layout conceitual. **D-UX-03:** UI real em React, estados tratados. **D-UX-04:** screenshot REAL com URL/commit/viewports e data, separado dos PNG conceituais.

A lista de 58 telas não obriga implementar 58 páginas idênticas: revisar redundância, agrupar componentes e produzir apenas aquelas necessárias ao caso de uso, preservando rastreabilidade de cada T-ID.

## QA visual obrigatório antes de portfólio público

- [ ] Mobile 320, 360, 390, 430 px; tablet 768/1024; desktop 1440 px em navegador REAL.
- [ ] Navegação por teclado, sem foco preso, linguagem acessível, erros e loaders visíveis.
- [ ] Comparação com PNGs **originais** e feedback fundamentado; não exigir pixel match nem plagiar marcas.
- [ ] CRUD/fluxo mínimo real, persistência após reload, dados isolados e teste de duas sessões quando aplicável.
- [ ] Screenshot do APP executando e screenshot do original rotulados distintamente.
- [ ] Cores/contraste, motion/reduced-motion, CLS e imagens/performance avaliados.
- [ ] Publicação somente com gate de segurança, custo e permissão do usuário.

**Status no RFB Method:** `SCREEN_CATALOG_IMPORTED / ORIGINAL_DESIGN_REFERENCED / BROWSER_QA_NOT_RUN`.


## Reconciliação EVOLVE 04
O catálogo histórico acima NÃO é a situação atual. A [matriz atual de 58 IDs](rfb/SCREEN-MAP.md) mapeia componentes e lacunas individualmente, e o [design system](rfb/DESIGN-SYSTEM.md) registra os tokens e as decisões. Capturas reais e resultados são registrados no relatório EVOLVE-04 e no manifesto. Não considerar os PNGs de conceito como evidência.
