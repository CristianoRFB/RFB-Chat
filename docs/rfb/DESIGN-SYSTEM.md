# RFB Chat — Design system V1

Identidade: violeta escuro, tipografia do sistema, produto de conversas para pequenas equipes. Marca SVG própria com balão e 7 discreto; assinatura RFB preservada separadamente no rodapé. Aprovação final da identidade pelo proprietário ainda não ocorreu. Não atribuir diferencial de mercado sem pesquisa de campo.

| Token | Escuro | Claro |
|---|---|---|
| Fundo | #111119 | #EFEDF5 |
| Superfície | #191923 | #FFFFFF |
| Texto | #F4F1FA | #211D32 |
| Texto secundário | #B7B2C8 | #5B556D |
| Acento | #B9AEFF | #5142C4 |
| Botão primário | #B9AEFF | #5142C4 |
| Bolha enviada | #44356D | #E3DCFF |

Componentes: painéis 24px, campos 12px, botões primários 14px, filtros/cápsulas, avatares circulares, bolhas 20px com canto de origem reduzido. Área desktop a partir de 900px com rolagem independente; mobile/tablet em fluxo vertical com link de ida/volta à conversa. Temas persistem somente preferência no localStorage, sem dados de conversa. Estados de vazio, filtro, conexão, erro, bloqueio e restrição preservados. Transições curtas e reduced motion. Nada de métricas inventadas, controles decorativos, cards sem função, arte AI ou gradientes supérfluos. Nomes e mensagens sintéticos são criados pelo fluxo real de QA; não se apresentam como usuários/clientes reais.

QA: Playwright em Chromium, matriz 320/360/390/430/768/1024/1440, desktop e mobile com dados persistidos, teste de contraste de pares de tokens, navegação por Tab e Enter, screenshots com viewport e SHA. Não equivale a WCAG integral; leitores de tela, navegadores físicos e pesquisa de usabilidade pendentes. [Mapa T001–T058](SCREEN-MAP.md).
