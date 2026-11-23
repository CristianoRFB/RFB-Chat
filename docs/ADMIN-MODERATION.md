# Administração e moderação — segurança e limites
As denúncias ficam em `reports/{id}`. Apenas a conta autora pode ler sua denúncia individual. A listagem e mudança de status exigem **custom claims** `moderator:true` ou `admin:true` verificadas por Firestore Rules — nunca role enviada em um formulário do cliente.

`src/ModeratorDashboard.tsx` é apresentado apenas quando o token de autenticação traz essas claims. Um usuário comum não pode promovê-las por URL, localStorage ou documento Firestore.

Neste MVP, não existe serviço privilegiado para atribuir claims nem interface de superadmin. A atribuição deve ocorrer futuramente num ambiente confiável, e ser auditada com logs sem dados sensíveis. Para QA isolado, usar contexto autenticado com custom claims nos testes do Firebase Emulator. A moderação **não está operacional em produção**.

Requisitos de evolução: auditoria de denúncias, retenção e exclusão LGPD, limites de volume/antiabuso, perfis e recurso de contestação antes de produção. Nenhum segredo de administrador ou conta real deve ser usado em demo.
