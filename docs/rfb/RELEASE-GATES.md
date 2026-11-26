# RFB Chat — Gates para liberação (RFB Method)
Versão: 23/11/2026. Este documento distingue laboratório funcional de produção. O PR permanece Draft.

## G5 — antes de solicitar review de produção
- [x] Firestore Rules com controle de membership, bloqueio entre DMs e permissões para relatórios/arquivos.
- [x] Testes unitários (9), Rules (20) e E2E (10) no [run verde](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45302857809).
- [x] Estabilidade do cadastro comprovada por 3 execuções em 45097362021.
- [x] Testes responsivos automatizados 320/390/768/1440.
- [ ] Revisar manualmente UX, teclado, leitor de tela, contrastes WCAG 2.2, estado de rede offline e dispositivos reais.
- [ ] Modelar proteção de volume/limite por conta, spam, quotas, controle de concorrência/carga e monitoramento com alertas.
- [ ] Definir armazenamento privado de mídia escalável (se for necessário), manutenção de links, retenção e exclusão definitiva após TTL; excluir arquivos manualmente hoje não é purga automática.
- [ ] Revisar LGPD: bases legais, consentimento auditável para gravação, direito à exclusão, exportação, retenção de relatórios, privacidade de logs e incidente.
- [ ] Validar papel confiável para atribuição e revogação de custom claims de moderator/admin e auditoria de ações.
- [ ] Executar análise independente de Firestore Rules/OWASP ASVS, ataques de concorrência e dependências.
- [ ] Verificar transporte real de voz WebRTC em redes distintas e necessidade/custo de STUN/TURN ou desabilitar explicitamente esse recurso fora do laboratório.
- [ ] Avaliar implementação frente às 58 telas conceituais e registrar quais foram condensadas, omitidas ou descartadas.

## G6 — release só com aprovação
- [ ] Receber autorização explícita para usar **projeto Firebase real** e conta de hospedagem, incluindo orçamento/cotas e configuração responsável.
- [ ] Definir variáveis públicas, segredos server-side, domínio Cloudflare, staging e rollout com backup/rollback.
- [ ] Proibir saída acidental do `demo-rfb-chat`, incluir smoke tests contra staging, monitoramento e política de contingência.
- [ ] Validar termos/privacidade e liberar somente após revisão humana e plano de resposta a incidentes.
- [ ] PR aprovado, sem bloqueios; plano de deploy assinado. **Não foi realizado merge, deploy ou cobrança**.

**Cobertura atual:** 11/12 fluxos funcionais no emulador; 12ª chamada somente sinalização. Não existe percentual comprovado de conclusão geral do produto ou de homologação para produção.


## Gate EVOLVE 01
- [ ] CI integral verde no SHA S016 ou sucessor; QA de presença/reconexão e testes manuais.
- [ ] Resolver [Issue #3](https://github.com/CristianoRFB/RFB-Chat/issues/3) de push real no staging autorizado.
- [ ] Revisar cota da janela de 500 mensagens e heartbeat, retenção/purga de tombstones e presença; cache em memória não cobre recarga offline.

## Gate EVOLVE 02
- [ ] Homologar armazenamento privado escalável, retenção e redes externas: #4.
- [ ] Confirmar CI final por SHA, QA manual e segurança da mídia.
- [ ] Revisar cotas e índices de dados inline, limites de upload por conta, ausência de TTL automático, exclusão de áudios e backups.
