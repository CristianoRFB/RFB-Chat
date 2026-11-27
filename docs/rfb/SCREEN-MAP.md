# Matriz T001–T058 — implementação real e lacunas

Data: 26/11/2026. Baseline de design 954a31b; cada ID preservado. I = fluxo/componente implementado no código, não homologação independente. P = parcial ou consolidado com lacuna explícita. Não representa 58 páginas distintas nem percentual de conclusão. CI/QA por SHA em EVOLVE-04.md.

| T-ID | Escopo original | Código | Estado | Limite |
|---|---|---|---|---|
| T001 | Landing / apresentação | App.tsx / Login + production-stop | P | Apresentação contextual, não há landing comercial pública. |
| T002 | Cadastro / criar conta | App.tsx / Login | I | Cadastro local; ver CI por SHA. |
| T003 | Login e recuperar acesso | App.tsx / Login + profile recovery | P | Login e reparo do perfil; reset de senha real não implementado. |
| T004 | Onboarding e perfil | App.tsx / Workspace; profile-data; PrivacyPanel | I | Perfil local e recuperação manual. |
| T005 | Página principal / feed | App.tsx / Workspace | I | Lista e conversa, não feed genérico. |
| T006 | Busca e filtros | Workspace; MessageCenter | I | Filtros Todas/Pessoas/Grupos e busca de histórico limitado. |
| T007 | Detalhes do recurso | MessageCenter; FilePanel | I | Detalhe de conversa e arquivo. |
| T008 | Fluxo de criação | new-chat; GroupControls; composer | I | Criação de conversa, grupo e mensagem. |
| T009 | Fluxo de edição | MessageCenter; GroupChannels; PrivacyPanel | I | Edição de texto, canal, nome e grupo. |
| T010 | Confirmação / revisão | AudioRecorder; AdminPanel; FilePanel | I | Revisão de áudio, confirmação administrativa e upload. |
| T011 | Estado concluído / recibo | MessageCard; GroupControls; PrivacyRights | I | Recibos e feedback de sucesso. |
| T012 | Lista pessoal / histórico | MessageCenter; NotificationsPanel | I | Histórico local até 500; notificações até 10 conversas. |
| T013 | Notificações | NotificationsPanel | P | Internas; push #3. |
| T014 | Mensagens ou contato | MessageCenter | I | DM/grupo local. |
| T015 | Central de ajuda | README + copy contextual | P | Ajuda contextual; central dedicada ausente. |
| T016 | Preferências e privacidade | PrivacyPanel; PrivacyRights | I | Preferências e pedidos; LGPD integral #5. |
| T017 | Acesso e segurança | AccountGate; PrivacyPanel; Rules | P | Restrições e bloqueios; recuperação de senha/MFA não homologados. |
| T018 | Página vazia / primeira vez | Workspace; MessageCenter | I | Vazio de conversa e pesquisa. |
| T019 | Carregamento e skeleton | App.tsx / loading, AccountGate | P | Estados de carregamento; skeleton dedicado ausente. |
| T020 | Erro de rede / retentar | MessageCenter; App.tsx | I | Estado de cache/reconexão e erros. |
| T021 | Sem permissão / bloqueio | AccountGate; Rules | I | Suspensão/banimento e negação. |
| T022 | Estado de conflito concorrente | profile-data; MessageCenter | P | Conflito de cadastro resolvido por single-flight; UI geral de concorrência ausente. |
| T023 | Admin: visão geral | ModeratorDashboard; AdminPanel; PrivacyQueue | P | Áreas administrativas, sem dashboard de KPIs fictícios. |
| T024 | Admin: gestão de usuários | AdminPanel | I | Até 50 perfis, seleção, cargo e status. |
| T025 | Admin: moderação e auditoria | ModeratorDashboard | I | Fila e histórico de denúncias. |
| T026 | Admin: regras e configurações | AdminPanel; Rules | P | Permissões e restrições; edição de políticas globais não disponível. |
| T027 | Admin: relatórios | ModeratorDashboard; PrivacyQueue | P | Fila, contagens reais, sem analytics/export de relatórios. |
| T028 | Página 404 / recurso indisponível | FilePanel; errorText; production-stop | P | Indisponibilidade e acesso negado; rota 404 dedicada não existe. |
| T029 | Módulo / Conversas — lista | Workspace / conversation-list | I | Lista de conversas. |
| T030 | Módulo / Conversas — detalhe | MessageCenter | I | Mensagens e ações. |
| T031 | Módulo / Conversas — criar/editar | Workspace; MessageCenter | I | Criar conversa e editar mensagem. |
| T032 | Módulo / Grupos e membros — lista | Workspace / filtro Grupos; GroupControls | I | Grupos e participantes. |
| T033 | Módulo / Grupos e membros — detalhe | GroupControls; GroupChannels | I | Detalhe, cargos e canais. |
| T034 | Módulo / Grupos e membros — criar/editar | GroupControls | I | Criar, renomear, convidar e aceitar. |
| T035 | Módulo / Canais — lista | GroupChannels / channel-nav | I | Lista de canais. |
| T036 | Módulo / Canais — detalhe | GroupChannels / channel-conversation | I | Detalhe com mensagens. |
| T037 | Módulo / Canais — criar/editar | GroupChannels | I | Criar/editar canal. |
| T038 | Módulo / Arquivos e mídia — lista | FilePanel / media gallery | I | Até 50 arquivos novos. |
| T039 | Módulo / Arquivos e mídia — detalhe | FilePanel | I | Preview, download e revogação. |
| T040 | Módulo / Arquivos e mídia — criar/editar | FilePanel; AudioRecorder | P | Upload até 300 KB e áudio; sem edição de binários, #4. |
| T041 | Módulo / Chamadas — lista | CallPanel | P | Chamada ativa local, sem lista histórica dedicada. |
| T042 | Módulo / Chamadas — detalhe | CallPanel | I | Estado, consentimento, mute, RTP local. |
| T043 | Módulo / Chamadas — criar/editar | CallPanel | P | Criar/atender/encerrar; redes externas #4. |
| T044 | Módulo / Pesquisa — lista | Workspace; MessageCenter | I | Lista de resultados. |
| T045 | Módulo / Pesquisa — detalhe | MessageCenter | I | Seleção/visualização de mensagem encontrada. |
| T046 | Módulo / Pesquisa — criar/editar | Workspace; MessageCenter | I | Alterar filtros e pesquisa. |
| T047 | Módulo / Notificações — lista | NotificationsPanel | I | Lista de não lidas. |
| T048 | Módulo / Notificações — detalhe | NotificationsPanel -> Workspace | P | Abrir conversa, sem detalhe separado. |
| T049 | Módulo / Notificações — criar/editar | PrivacyPanel | P | Preferência de notificação; push #3. |
| T050 | Módulo / Perfil e privacidade — lista | PrivacyPanel; PrivacyRights | I | Perfil, preferências, pedidos e denúncias próprias. |
| T051 | Módulo / Perfil e privacidade — detalhe | PrivacyPanel; PrivacyRights | I | Detalhe contextual. |
| T052 | Módulo / Perfil e privacidade — criar/editar | PrivacyPanel; PrivacyRights | I | Alterar nome, bloquear e solicitar direitos. |
| T053 | Módulo / Moderação — lista | ModeratorDashboard | I | Fila de denúncias até 50. |
| T054 | Módulo / Moderação — detalhe | ModeratorDashboard | I | Detalhe e histórico auditável. |
| T055 | Módulo / Moderação — criar/editar | ReportPanel; ModeratorDashboard | I | Enviar, revisar, encerrar; sem edição de denúncia enviada. |
| T056 | Módulo / Administração — lista | AdminPanel | I | Lista de perfis autorizada. |
| T057 | Módulo / Administração — detalhe | AdminPanel; PrivacyQueue | I | Histórico da conta e fila. |
| T058 | Módulo / Administração — criar/editar | AdminPanel | I | Alterar papel/estado com confirmação auditada. |
