# Architecture Diagrams: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. System Context

```mermaid
flowchart LR
  Buyer[Buyer / Category Operator]
  Evaluator[Technical Evaluator]
  App[AI Purchasing Agent Local App]
  LLM[Optional LLM Provider]
  MockOps[Mock Operational Data and Services]

  Buyer -->|Review recommendations, approve actions| App
  Evaluator -->|Run demo and evaluation scenarios| App
  App -->|Optional explanation request| LLM
  App -->|Typed service calls| MockOps

  subgraph OutOfScope[Future Real Systems - Out of Scope]
    ERP[ERP / Procurement]
    WMS[WMS / Inventory]
    Forecast[Forecasting Service]
    Supplier[Supplier API / EDI]
    Finance[Budget / Finance]
  end

  App -.future replacement.-> ERP
  App -.future replacement.-> WMS
  App -.future replacement.-> Forecast
  App -.future replacement.-> Supplier
  App -.future replacement.-> Finance
```

## 2. Runtime Components

```mermaid
flowchart TB
  UI[Frontend UI]
  API[API Layer]
  Orchestrator[Agent Run Orchestrator]
  Decision[Decision Engine]
  Explain[Explanation Adapter]
  Rules[Rule Engine]
  Validation[Validation Service]
  Actions[Action Service]
  Eval[Evaluation Runner]
  Audit[Audit Logger]
  Repo[(Mock Repository)]
  LLM[Optional LLM Provider]

  UI --> API
  API --> Orchestrator
  API --> Actions
  API --> Eval
  API --> Repo

  Orchestrator --> Repo
  Orchestrator --> Rules
  Orchestrator --> Decision
  Orchestrator --> Explain
  Orchestrator --> Validation
  Orchestrator --> Audit

  Decision --> Rules
  Explain -->|optional| LLM
  Actions --> Validation
  Actions --> Repo
  Validation --> Rules
  Validation --> Repo
  Eval --> Orchestrator
  Eval --> Actions
  Eval --> Repo
  Audit --> Repo
```

## 3. Trust Boundaries

```mermaid
flowchart LR
  subgraph Client[Client Trust Zone]
    Browser[Browser UI]
  end

  subgraph Server[Application Trust Zone]
    API[Validated API Commands]
    Agent[Agent Core]
    Rules[Deterministic Rules and Validation]
    Repo[(Mock Repository)]
  end

  subgraph External[External / Untrusted Zone]
    LLM[Optional LLM]
    Notes[Supplier or Recommendation Text]
  end

  Browser -->|Untrusted JSON| API
  API -->|Typed commands| Agent
  Agent --> Rules
  Agent --> Repo
  Agent -->|Sanitized structured context| LLM
  Notes -->|Data only, never instructions| Agent
  LLM -->|Parsed explanation only| Agent
```

## 4. Recommendation Review Sequence

```mermaid
sequenceDiagram
  actor Buyer
  participant UI as Frontend
  participant API as API Layer
  participant Agent as Agent Orchestrator
  participant Services as Mock Services
  participant Rules as Rule Engine
  participant Decision as Decision Engine
  participant Explain as Explanation Adapter
  participant Audit as Audit Logger

  Buyer->>UI: Select recommendation and run review
  UI->>API: POST /api/agent-runs
  API->>Agent: startReview(recommendationId)
  Agent->>Audit: log input
  Agent->>Services: fetch recommendation and context
  Services-->>Agent: operational facts or typed errors
  Agent->>Rules: evaluate facts and constraints
  Rules-->>Agent: rule check results
  Agent->>Decision: select decision and proposed action
  Decision-->>Agent: structured decision
  Agent->>Explain: synthesize explanation
  Explain-->>Agent: explanation or fallback
  Agent->>Audit: log decision and checks
  Agent-->>API: run decision
  API-->>UI: decision, evidence, audit events
  UI-->>Buyer: Show decision and action controls
```

## 5. Action and Validation Sequence

```mermaid
sequenceDiagram
  actor Buyer
  participant UI as Frontend
  participant API as API Layer
  participant Action as Action Service
  participant Repo as Mock Repository
  participant Validate as Validation Service
  participant Audit as Audit Logger

  Buyer->>UI: Approve or execute action
  UI->>API: POST /api/agent-runs/{runId}/actions
  API->>Action: executeAllowedAction(runId, actionType, approval)
  Action->>Repo: write PO / reject / escalate
  Repo-->>Action: success, failure, or partial success
  Action->>Validate: validate resulting state
  Validate->>Repo: re-fetch recommendation, PO, constraints
  Repo-->>Validate: resulting state
  Validate-->>Action: validation passed or failed
  Action->>Audit: log action and validation
  Action-->>API: action result and recovery
  API-->>UI: final status
  UI-->>Buyer: Show validation and recovery
```

## 6. Data Ownership

```mermaid
erDiagram
  PRODUCT ||--o{ INVENTORY : has
  PRODUCT ||--o{ DEMAND_FORECAST : has
  PRODUCT ||--o{ SUPPLIER_OPTION : sourced_by
  PRODUCT ||--o{ PURCHASE_RECOMMENDATION : recommended_for
  PRODUCT ||--o{ PURCHASE_ORDER : ordered_as
  PURCHASE_RECOMMENDATION ||--o{ AGENT_RUN : reviewed_by
  AGENT_RUN ||--o{ AUDIT_EVENT : records
  AGENT_RUN ||--o| ACTION_RESULT : produces
  AGENT_RUN ||--o| VALIDATION_RESULT : produces
  PURCHASE_ORDER ||--o{ VALIDATION_RESULT : validated_by
```

