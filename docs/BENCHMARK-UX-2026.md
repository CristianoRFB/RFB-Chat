# Benchmark de mercado e UX — RFB Chat
Data de consulta: **22/11/2026**. Fontes: páginas oficiais dos respectivos produtos. Esta comparação é pesquisa documental, **não** entrevista com usuários ou teste de usabilidade. Não reproduzir layouts, marcas, ícones ou arte de terceiros.

| Referência | Constatação sustentada pela fonte | Aprendizado proposto para o RFB Chat | Limite |
|---|---|---|---|
| **Slack** | Plano Free limita acesso a histórico recente de mensagens/arquivos a 90 dias e pode excluir dados com mais de um ano | Dar clareza de política de histórico/retenção, não prometer histórico ilimitado | Diferenciação de retenção **não validada**; comparar custos e LGPD antes |
| **Discord** | Servidores organizam canais de texto, categorias e fóruns para discussões específicas | Padrão de navegação grupos/canais do backlog G3; separar conversa privada de comunidade | Não copiar visual de servidor/identidade Discord |
| **Zulip** | Conversas são organizadas por tópicos rotulados, em vez de um fluxo único indiferenciado | Considerar threads por assunto para equipes assíncronas em fases futuras | Efeito real para público RFB ainda hipótese |
| **Element** | Mensageria com protocolo Matrix e recursos de criptografia ponta a ponta | Explicitar o modelo de confiança e a ausência de E2EE no MVP RFB Chat | Firestore Rules e TLS **não** equivalem a E2EE |
| **Mattermost** | Oferta Team Edition tem comunicação por canais e mensagens 1:1/grupos; software pode ser auto-hospedado | Aprender com permissões e busca de mensagens; considerar custo operacional real do self-hosting | Software livre não significa hospedagem gratuita |

## Fontes verificáveis
- Slack — https://slack.com/help/articles/115003205446-Slack-plans-and-features-by-plan ; https://slack.com/help/articles/27204752526611-Feature-limitations-on-the-free-version-of-Slack
- Discord — https://support.discord.com/hc/en-us/articles/33023827550359-Discord-Server-Setup-Guide
- Zulip — https://zulip.com/help/introduction-to-topics
- Element — https://element.io/en/features/end-to-end-encryption
- Mattermost — https://docs.mattermost.com/product-overview/plans

## Hipótese de posicionamento — NÃO VALIDADA
**Público exploratório:** comunidades pequenas e equipes que precisam de conversas privadas e grupos simples. **Proposta de valor a testar:** iniciar uma conversa sem configuração complexa, mantendo histórico recuperável com estados honestos de envio/leitura. O conceito é similar ao de produtos existentes; ainda **não existe diferencial competitivo comprovado**. O MVP local prova viabilidade técnica, não demanda de mercado.

## Design e IA (direções, não mockups)
- Desktop: navegação lateral para conversas, área principal para mensagens e compositor visível.
- Mobile: sequência vertical, controles de toque ≥44px, contraste e foco acessível.
- Estados obrigatórios: vazio, carregando, falha de rede, ausência de permissão, sessão expirada, gravação pendente/confirmada.
- Grupos/canais: pesquisar estrutura de categorias do Discord e tópicos do Zulip, **sem** reproduzir sua apresentação visual.
- Sem ícones, screenshots ou imagens de terceiros importados nesta etapa; os conceitos visuais do ZIP devem passar por revisão de licença.

## Próximas validações de produto
1. Entrevistar 3–5 pessoas de equipes pequenas/comunidades e registrar frequência de uso, dor real e barreiras de adoção.
2. Testar fluxo A→B do MVP, inclusive criação de conta e convite por UID, com 2 pessoas que não participaram do desenvolvimento.
3. Comparar o fluxo de conversa em 360px e desktop, mensurar tempo até primeira mensagem e erros de navegação.
4. Só então priorizar canais, busca e grupos; evitar desenvolvimento de chamadas ou uploads antes de modelo de custo/abuso.

## Dependências e riscos
R$0/mês é meta, não capacidade ilimitada. Firestore em plano Spark e Cloudflare gratuito dependem de limites. Retenção de mensagens, consentimento, direitos de exclusão e moderação exigem política/implementação antes de produção. Para versões reais verificar limites atuais do provedor e operação sob LGPD.


## EVOLVE 04 — 26/11/2026
Pesquisa documental atual: [WhatsApp filtros](https://blog.whatsapp.com/find-messages-faster-with-chat-filters) → filtros visíveis Todas/Pessoas/Grupos sem fingir contagem global de não lidas; [Telegram pastas](https://telegram.org/blog/folders) → agrupamento por tipo; [Slack sidebar](https://slack.com/help/articles/212596808-Adjust-your-sidebar-preferences) → conversas antes de ferramentas administrativas; [Discord server setup](https://support.discord.com/hc/en-us/articles/33023827550359-Discord-Server-Setup-Guide) → canais permanecem associados a grupos; [WCAG 2.2](https://www.w3.org/TR/WCAG22/) → contraste 4,5:1 para texto normal, foco visível, alvos com dimensões adequadas e reduced motion. A referência não autoriza copiar marcas, ícones ou layouts. Decisão: violeta próprio, superfícies sólidas, duas áreas com foco na conversa, textos úteis, estados honestos, iniciais reais de nomes sintéticos e logotipo próprio SVG. Não usar retratos de terceiros como identidades fictícias nem imagens decorativas geradas. Validação de usuários reais ainda não realizada.
