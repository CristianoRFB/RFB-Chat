# RFB Chat — Matriz de cobertura (RFB Method)

Data: 23/11/2026, America/Sao_Paulo. Referência: [especificação](../ESPECIFICACAO-RFB.txt). Implementação: [PR #1 DRAFT](https://github.com/CristianoRFB/RFB-Chat/pull/1). Último código verificado: `3dc7e7b4f1175509ae32476dd219ad8215c8be36`.

**Resultado verificável:** 11/12 recursos (91,7%) com fluxos funcionais no laboratório Firebase Emulator; a 12ª funcionalidade tem apenas a sinalização de chamada WebRTC verificada. Isso é **cobertura funcional do protótipo**, não 91,7% de todas as telas, controles, integrações, acessibilidade, segurança e produção. O checklist original de aceite exige persistência, autorização, concorrência, integração e E2E por AC; nem todos estes aspectos foram homologados individualmente para operação real.

| AC | Função da fonte | Estado do laboratório | Evidência ou restrição |
|---|---|---|---|
| 01 | Conversa individual e grupo | Fluxo testado | DMs, membership, grupos; Rules + E2E |
| 02 | Envio de texto e reações | Fluxo testado | Assinaturas reativas somente em mensagens visíveis |
| 03 | Responder e editar | Fluxo testado | Editar apenas texto próprio, autorização em Rules |
| 04 | Indicadores enviado/recebido/lido | Fluxo testado | Carimbo do servidor; sem push em segundo plano |
| 05 | Paginação | Fluxo testado | 52 mensagens e carregamento de página anterior |
| 06 | Busca por conversa | Fluxo testado | Filtro de conversas (não indexação do conteúdo) |
| 07 | Convites e cargos | Fluxo testado | Aceite explícito, owner/admin, canais |
| 08 | Áudio gravado com consentimento | Fluxo testado | WebM até 20 s com microfone sintético no E2E; consentimento não auditado |
| 09 | Arquivos privados e links temporários | Fluxo testado | Link autenticado ~23h, máx. 60KB, exclusão pelo autor; **sem purga TTL automática** |
| 10 | Notificações e preferências | Fluxo testado | Contagem interna não lidas, toggles; sem push |
| 11 | Bloqueio e denúncia | Fluxo testado | Bloqueio server-side de DM, chamadas, ICE, reações e arquivos; moderação por claims |
| 12 | Chamadas individuais opcionais | Prova de conceito parcial | E2E de sinalização e término, **não prova RTP/áudio real ou redes externas** |

**CI por SHA:** [run 45302857809](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809): `npm ci`, TypeScript, build, 9 Vitest, 20 Rules Test, 10 Playwright Chromium, todos aprovados sem retry. [Run de estabilização 45097362021](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45097362021): tentativas 1, 2 e 3 sucessivas, sem retries internos. [Issue #2](https://github.com/CristianoRFB/RFB-Chat/issues/2) fechada com evidência.

## 10 módulos originais
Conversas, Grupos/Membros, Canais, Arquivos/Mídia, Pesquisa, Notificações e Perfil/Privacidade: fluxos de laboratório. Chamadas: P2P experimental sem TURN/SFU. Moderação: denúncia, revisão por custom claim (sem atribuição real de privilégios). Administração: fila de denúncias, não console completo de plataforma.

O catálogo de **58 telas** é conceitual. Não equivale a 58 layouts finalizados; fluxos correspondentes são reunidos em páginas e painéis React. G5 não passou por auditoria manual integral; G6/deploy não foi executado.

## Gates
G0 fonte e diagramas preservados; G1 ambiente, CI e lockfile; G2 fluxo principal; G3 11 fluxos completos em laboratório + P2P parcial; G4 mídia externa não habilitada; G5 9/20/10 testes automáticos verdes, revisão humana pendente; G6 bloqueado até autorização, segurança e infraestrutura real. Veja [RELEASE-GATES.md](RELEASE-GATES.md).
