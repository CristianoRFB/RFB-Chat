# RFBCHAT — Diagramas do Starter Pack (Mermaid editável)

> **ORIGEM:** entidades/estados/jornada retirados de `ESPECIFICACAO-RFB.txt`; relações propostas transcritas de `repos-individuais/01-rfbchat/DATA/RELACOES-DE-DOMINIO.md` do ZIP original enviado. Toda associação é **proposta**, sem cardinalidade homologada. **Nenhum desses gráficos comprova aplicação ou banco existente.** Mermaid é notação prática, não substitui artefato UML formal.

## D-001 — Atores e casos de uso (mapeamento inicial)

```mermaid
flowchart LR
  A1["Visitante"]
  A2["Pessoa autenticada"]
  A3["Administrador de grupo"]
  A4["Moderador"]
  A5["Administrador da plataforma"]
  UC1(["UC-01: Conversa individual e grupo"])
  UC2(["UC-02: Envio de texto e reações"])
  UC3(["UC-03: Responder e editar mensagem"])
  UC4(["UC-04: Indicadores de enviado/recebido/lido"])
  UC5(["UC-05: Mensagens com paginação"])
  UC6(["UC-06: Busca por conversa"])
  A1 --> UC1
  A2 --> UC2
  A3 --> UC3
  A4 --> UC4
  A5 --> UC5
  UC1 --> SYS["RFBCHAT (conceito)"]
  UC2 --> SYS["RFBCHAT (conceito)"]
  UC3 --> SYS["RFBCHAT (conceito)"]
  UC4 --> SYS["RFBCHAT (conceito)"]
  UC5 --> SYS["RFBCHAT (conceito)"]
  UC6 --> SYS["RFBCHAT (conceito)"]
```

O mapeamento é exploratório. Atribuição ator→caso tem de ser validada com a matriz de permissões; a ordem dos papéis na fonte não determina autorização automática.

## D-002 — Modelo conceitual de classes

```mermaid
classDiagram
  class Usuario {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Perfil {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Conversa {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Participacao {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Mensagem {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Anexo {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Reacao {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Leitura {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Chamada {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Convite {
    +string id
    +string status
    +string ownerId
    +int version
  }
  class Denuncia {
    +string id
    +string status
    +string ownerId
    +int version
  }
  Usuario --> Participacao : participa
  Participacao --> Conversa : integra
  Conversa --> Mensagem : contém
  Mensagem --> Anexo : anexa
  Mensagem --> Reacao : recebe
  Mensagem --> Leitura : registra
  Conversa --> Chamada : pode iniciar
  Usuario --> Denuncia : relata
```

**Relações propostas da fonte (a validar):**
- `Usuario` → `Participacao` — participa
- `Participacao` → `Conversa` — integra
- `Conversa` → `Mensagem` — contém
- `Mensagem` → `Anexo` — anexa
- `Mensagem` → `Reacao` — recebe
- `Mensagem` → `Leitura` — registra
- `Conversa` → `Chamada` — pode iniciar
- `Usuario` → `Denuncia` — relata

Não são FK/coleções já criadas. `ownerId`/`version` são campos candidatos genéricos definidos no caderno; modelagem real terá índices, escopo de tenant, constraints e testes de concorrência.

## D-003 — Entidade-relacionamento sem cardinalidades inventadas

```mermaid
erDiagram
  Usuario {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Perfil {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Conversa {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Participacao {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Mensagem {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Anexo {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Reacao {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Leitura {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Chamada {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Convite {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
  Denuncia {
    string id PK
    string status
    string ownerId
    datetime createdAt
  }
```

Os nomes provêm do planejamento; as relações estão em D-002 mas **deliberadamente sem 1:1, 1:N ou N:M**, pois o ZIP proíbe inferir cardinalidade automaticamente. Definir cardinalidades, deleção, transações e tenant invariants antes do Firestore.

## D-004 — Arquitetura de contêineres candidata (visão C4 aproximada)

```mermaid
flowchart LR
  U["Visitante / Pessoa autenticada"] --> UI["React + TypeScript + Vite
SPA/PWA (PLANEJADO)"]
  UI --> AUTH["Firebase Auth (PLANEJADO)"]
  UI --> API["Cloudflare Worker (PLANEJADO)"]
  API --> DB["Firestore Standard / Emulator (PLANEJADO)"]
  AUTH -. token validado .-> API
  TEST["Vitest + Playwright + Rules Emulator"] -. verifica .-> UI
  TEST -. verifica .-> API
```

Antes de deploy confirmar configuração atual de Cloudflare, Firebase Spark, SDK no runtime, limites/custos, upload, autenticação e isolamento. A arquitetura acima NÃO está operacional.

## D-005 — Sequência do fluxo principal (planejado)

```mermaid
sequenceDiagram
  actor U as Pessoa usuária de teste
  participant UI as SPA / Interface
  participant API as API autorizada (planejada)
  participant DB as Firebase Emulator (planejado)
  U->>UI: 1. Entrar com conta
  UI->>API: Validar ação e autorização (1)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 2. Criar conversa
  UI->>API: Validar ação e autorização (2)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 3. Enviar mensagem
  UI->>API: Validar ação e autorização (3)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 4. Entregar e sincronizar
  UI->>API: Validar ação e autorização (4)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 5. Confirmar leitura
  UI->>API: Validar ação e autorização (5)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  U->>UI: 6. Retomar histórico
  UI->>API: Validar ação e autorização (6)
  API->>DB: Transação/consulta sintética (se aplicável)
  DB-->>API: Resultado de teste
  API-->>UI: Resultado ou erro autorizado
  UI-->>U: Estado final ou recuperação
```

Pseudointeração, não endpoints existentes. Criar contratos reais em G1/G2, incluir falha de rede, permissão negada, retry, duplicação e concorrência.

## D-006 — Máquina de estados do domínio (fonte)

```mermaid
stateDiagram-v2
  [*] --> S0
  state "criada" as S0
  state "enviada" as S1
  state "entregue" as S2
  state "lida" as S3
  state "removida" as S4
  S0 --> S1
  S1 --> S2
  S2 --> S3
  S3 --> S4
  S4 --> [*]
```

Transições não autorizadas devem ser recusadas; definir precondição, agente, logs, efeitos transacionais e reversões para cada aresta.

## D-007 — Atividade e exceção principal

```mermaid
flowchart TD
  START(["Iniciar RFBCHAT"]) --> GUARD{"Autorização e dados válidos?"}
  GUARD -- "Não" --> DENY["Erro seguro e recuperação"]
  GUARD -- "Sim" --> T1["Entrar com conta"]
  T1 --> T2["Criar conversa"]
  T2 --> T3["Enviar mensagem"]
  T3 --> T4["Entregar e sincronizar"]
  T4 --> T5["Confirmar leitura"]
  T5 --> T6["Retomar histórico"]
  T6 --> END(["Fluxo demonstrado com dados sintéticos"])
  DENY --> START
```

O diagrama representa o cenário mínimo. Cenários alternativos não estão todos detalhados; desenvolver quando o primeiro fluxo estiver em código.

## Catálogo de diagramas: aplicabilidade de 14 UML + 4 C4 + ERD

| Tipo considerado | Estado |
|---|---|
| UML: casos de uso | RASCUNHO — atores e casos via fluxograma Mermaid, revisar UML formal |
| UML: classes | RASCUNHO — entidades e relações propostas do ZIP |
| UML: objetos | AVALIAR necessidade após contratos de dados |
| UML: pacotes | AVALIAR quando os módulos forem implementados |
| UML: componentes | AVALIAR depois da definição da API |
| UML: estrutura composta | AVALIAR apenas se houver interfaces internas complexas |
| UML: implantação | AVALIAR após decisão Cloudflare/Firebase e staging |
| UML: perfis | AVALIAR necessidade de estereótipos específicos |
| UML: atividades | RASCUNHO — jornada com autorização/erro |
| UML: estados | RASCUNHO — sequência de estados original |
| UML: sequência | RASCUNHO — interações previstas, backend NÃO implementado |
| UML: comunicação | AVALIAR após contrato de comunicação |
| UML: visão geral de interação | AVALIAR para fluxos concorrentes complexos |
| UML: timing | AVALIAR apenas se tempo/liveness for requisito |
| C4: contexto | RASCUNHO — atores externos ainda devem ser confirmados |
| C4: contêineres | RASCUNHO — stack original candidata, não deployed |
| C4: componentes | AVALIAR após implementação de API/UI |
| C4: código | AVALIAR após G2, sem diagrama vazio artificial |
| ERD | RASCUNHO — entidades sem inventar cardinalidades |

**Critério de manutenção:** requisitos `F-IDs` e telas `T001..T058` devem indicar o D-ID pertinente; nenhuma classe/relacionamento vai para produção sem teste Rules/contratos e revisão de modelagem. Diagramas de objetos, perfil, timing, composite structure etc. NÃO são gerados apenas para preencher catálogo quando não são adequados.
