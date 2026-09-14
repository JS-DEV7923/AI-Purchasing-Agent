# AI Cost and Latency: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Latency Budget

Target total recommendation review latency: less than 10 seconds.

Suggested budget:

| Step | Target |
| --- | --- |
| API validation | < 100 ms |
| Context retrieval from mock services | < 500 ms |
| Rule checks and decision engine | < 100 ms |
| Optional LLM explanation | < 3 seconds |
| Audit persistence | < 100 ms |
| Total without LLM | < 1 second |
| Total with LLM | < 5 seconds preferred, < 10 seconds required |

## 2. Cost Model

MVP can run with zero model cost if template explanations are used.

If LLM is enabled:

- One LLM call per agent review.
- No LLM calls required for action validation.
- No LLM calls required for core evaluation assertions.
- Cache explanation per completed run.

## 3. Cost Controls

- Optional LLM disabled by default or clearly configured.
- Use compact structured prompts.
- Do not include full audit logs unless needed.
- Avoid repeated explanation generation for same run.
- Use deterministic template fallback.
- Track `ai_llm_calls_total` and fallback rate.

## 4. Rate Limits and Quotas

For MVP:

- No external rate limits if LLM disabled.
- If LLM enabled, handle provider rate limit with template fallback.

For future:

- Per-user or per-run LLM call limit.
- Backoff for transient provider failures.
- Cost ceiling per day/category/team.

## 5. Caching

Cache:

- Completed run explanation.
- Scenario evaluation results during a single run if needed.

Do not cache:

- Mutable budget, storage, inventory, or open PO state across action execution without revalidation.

## 6. Degradation Behavior

| Condition | Degradation |
| --- | --- |
| LLM unavailable | Template explanation |
| LLM slow | Timeout then template explanation |
| Provider rate limit | Template explanation and audit warning |
| Evaluation high volume | Skip LLM explanation or use template mode |

