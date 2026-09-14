# Model Strategy: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Model Responsibility

The model may be used for:

- Synthesizing concise buyer-readable explanations.
- Rephrasing structured rule results into operational language.
- Highlighting risks and unknowns already present in structured context.

The model must not be used as final authority for:

- Inventory math.
- Demand coverage calculations.
- Supplier MOQ validation.
- Budget validation.
- Storage validation.
- Duplicate PO checks.
- Action authorization.
- Purchase order creation.
- Post-action validation.

## 2. MVP Recommendation

Implement deterministic template explanations first. Add optional LLM explanation behind an adapter only after core rules, validation, and evaluation pass.

This ensures the project can run without model credentials and keeps evaluation deterministic.

## 3. Model Selection Criteria

If an LLM is used, select a model with:

- Reliable structured output.
- Low latency for small structured prompts.
- Good instruction following.
- Reasonable cost for demo-scale calls.
- Provider SDK support in chosen stack.
- Ability to run with strict JSON schema or equivalent structured output.

## 4. Fallback Strategy

| Failure | Fallback |
| --- | --- |
| Missing API key | Template explanation |
| Provider timeout | Template explanation |
| Invalid model output | Template explanation and audit warning |
| Hallucinated unsupported field | Drop field and use deterministic data |
| Provider rate limit | Template explanation |

## 5. Versioning

Track:

- `modelProvider`
- `modelName`
- `promptVersion`
- `schemaVersion`
- `explanationMode`: `template` or `llm`

Store these on the agent run or audit event when LLM is used.

## 6. Upgrade Strategy

Before changing model or prompt:

1. Run scenario evaluation suite.
2. Run prompt regression cases.
3. Verify explanation grounding.
4. Verify no structured decision fields change because of explanation generation.
5. Record model/prompt version change.

## 7. Latency Budget

- Total recommendation review: less than 10 seconds.
- LLM explanation target: less than 3 seconds.
- Fallback to template on timeout.

## 8. Cost Controls

- Use at most one LLM call per reviewed recommendation.
- Do not call LLM for evaluation assertions unless testing explanation quality specifically.
- Cache explanation for a completed run.
- Skip LLM call when deterministic explanation is configured.

