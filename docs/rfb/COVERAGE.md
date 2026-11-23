# RFB Chat — Cobertura rastreável (RFB Method)
Atualização: 22/11/2026, America/Sao_Paulo. Referência original: `docs/ESPECIFICACAO-RFB.txt`.
**Regra de percentual:** 90% de 12 AC = **11 AC aprovados integralmente**. Implementação de interface, ou teste em emulador, **não equivale** a homologação/produção. Não transformar cobertura de código em porcentagem de sistema concluído.

## Matriz das 12 funcionalidades originais
| AC | Função | Código implementado | Evidência verificável / lacuna |
|---|---|---|---|
| 01 | Conversa individual e grupo | DM, grupos, permissões | E2E 45095871951 + Rules; fora de produção |
| 02 | Texto e reações | onSnapshot, allowlist de emoji | E2E 45095871951 + Rules |
| 03 | Responder e editar | replyToId, autor-only | E2E 45095871951 + Rules |
| 04 | Enviado/recebido/lido | pendente/gravada/entregue/lida | E2E+Rules; sem entrega push/segundo plano |
| 05 | Paginação | 50 recentes + query anterior | E2E de 52 mensagens em 45095871951 |
| 06 | Busca por conversa | filtro por nome/UID | E2E de busca em 45095871951; sem busca global de conteúdo |
| 07 | Convites e cargos | aceite obrigatório, admin de grupo | E2E 45095871951 + Rules; limite de participantes |
| 08 | Áudio consentido | MediaRecorder WebM, 20s e teto | E2E com microfone fake no CI 45095871951; sem media hosting real |
| 09 | Arquivos privados | TXT/PNG/JPG/PDF até 60KB; link 23h | E2E 45095871951 + Rules; armazenamento base64 não escala |
| 10 | Notificações/prefs | contador não lidas, toggles | Teste E2E novo em `e2e/notifications.spec.ts`; pendente resultado final, sem push |
| 11 | Bloqueio/denúncia | bloqueio server-side, reports e moderação por claims | E2E de bloqueio/denúncia + Rules; atribuição real de moderador pendente |
| 12 | Chamada opcional | WebRTC P2P local com oferta/resposta/ICE | E2E sinalização fake mic em 45095871951; **não prova áudio real externo/TURN** |

**Resultado técnico confirmado do checkpoint verde:** 8 jornadas Playwright sem retry, 17 testes Rules e 9 unitários PASS. Esse conjunto valida fluxos-chave de AC-01 a AC-09 e AC-11 e a sinalização experimental da AC-12. AC-10 e recuperação de perfil dependem do HEAD mais novo. Não se pode declarar 11/12 AC integralmente homologadas ou 90% do produto concluído.

## Cobertura dos 10 módulos da fonte
| Módulo | Estado local |
|---|---|
| Conversas | Fluxo implementado/testado |
| Grupos e membros | Implementado/testado |
| Canais | Implementado; QA funcional no E2E grupo |
| Arquivos e mídia | Implementado para pequeno volume; não produção |
| Chamadas | Prova de conceito P2P, sem transporte remoto comprovado |
| Pesquisa | Filtro de conversas; busca de texto total ainda fora de escopo |
| Notificações | Internas, sem push; CI final pendente |
| Perfil e privacidade | CRUD restrito; recuperação de perfil adicionada |
| Moderação | Regras e painel com custom claims, sem atribuição real |
| Administração | Área de denúncias para admin, **não console completo de plataforma** |

## Gates RFB Method
- **G0:** fonte e diagramas preservados; benchmark documentado, sem validação externa.
- **G1:** React/TS/Vite, Firebase emuladores, lockfile versionado, CI.
- **G2:** DM, grupo e histórico testados no emulador; QA de estabilidade ainda aberto.
- **G3:** 12 áreas funcionais de MVP codificadas com limitações explícitas.
- **G4:** produção e integrações pagas não aprovadas; WebRTC sem TURN.
- **G5:** testes unitários, Rules e E2E rodados; auditoria global, QA mobile abrangente, WCAG/privacidade e concorrência pendentes.
- **G6:** `NOT_DEPLOYED` por segurança e falta de autorização explícita.

Meta financeira: custo recorrente adicional **R$0 no que foi ativado**, não promessa de gratuidade de produção.
