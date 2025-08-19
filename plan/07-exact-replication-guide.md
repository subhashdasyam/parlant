# Parlant Documentation: 07 - Exact Replication Guide

**Version:** 3.0.1
**Timestamp:** 2025-08-19 10:30:23.196731

---

## 1. Complete Step-by-Step Recreation Process

This guide outlines the conceptual process for building a new, complex agent using the Parlant framework, allowing for the exact replication of its functionality.

### Phase 1: Define the Core Components

1.  **Define Agents:** Start by defining the `Agent` entities you will need. Give them clear names and descriptions. Decide on their `composition_mode` (`FLUID` for general purpose, `CANNED_...` for strict control).
2.  **Define Tools:** Identify all external actions your agent needs to perform (e.g., fetching data from an API, querying a database). Implement these as `Tool`s within a `ToolService`. Ensure each tool has a clear description and well-defined parameters with types. This metadata is critical, as it will be used by the LLM to infer arguments.
3.  **Define Glossary:** Identify all domain-specific terms, acronyms, and entities. Create `Term`s in the `Glossary` for each one. This will significantly improve the accuracy of the agent's understanding and responses.

### Phase 2: Implement the Business Logic

4.  **Write Observational Guidelines:** For every simple, atomic business rule, create a `Guideline`. Frame them as "If [condition], then [action]".
    -   *Good Example:* `condition`: "User asks for their order status", `action`: "First, ask for the user's order number."
    -   *Bad Example:* A single guideline that tries to handle the entire order status workflow. Break it down.
5.  **Connect Guidelines to Tools:** For guidelines that require an action, associate them with the appropriate `Tool`s you defined in Phase 1.
6.  **Build Journeys:** For multi-step processes, create a `Journey`. Define the journey's entry condition (by linking it to a guideline) and then create a graph of nodes, where each node is itself a guideline representing a single step in the flow.
7.  **Create Relationships:** For advanced logic, create `Relationship`s between guidelines. The most common is `ENTAILMENT`. For example, a guideline to "Check refund eligibility" might entail a guideline to "First, check order status".

### Phase 3: Test and Refine

8.  **Write BDD Tests:** For each feature, write a `.feature` file describing the desired behavior in plain English. Use the existing tests in `tests/core/stable/engines/alpha/features` as a template.
9.  **Run and Debug:** Run the tests (`poetry run pytest`). When a test fails, use the inspection logs created by the `AlphaEngine` to debug. These logs provide a turn-by-turn breakdown of which guidelines were matched, which tools were called, and what the LLM generated.
10. **Iterate:** Refine your guidelines, tools, and journeys based on the test results until the agent behaves exactly as specified.

## 2. Every Potential Pitfall with Detailed Solutions

| Pitfall | Description | Detailed Solution |
|---|---|---|
| **Agent ignores an instruction.** | You have a guideline, but the agent doesn't seem to be following it. | This is almost always a matching issue, not an LLM stubborness issue. **Solution:** Check the `Inspection` logs for the turn. Find the `guideline_matches` list. <br>1. **Is your guideline in the list?** If not, its `condition` was not considered a semantic match for the conversation. Try rephrasing the condition to be more explicit or closer to the user's likely language. <br>2. **Is it in the list but with a low score?** It might be getting out-competed by another, more general guideline. Make the condition more specific or create a `Relationship` to give it higher priority in certain contexts. |
| **Tool is not called or called with wrong arguments.** | A tool-enabled guideline is matched, but the tool doesn't execute, or it fails because the LLM provided bad arguments. | **Solution:** This is an LLM inference issue. <br>1. **Check the Tool's Schema:** Ensure the tool's parameter descriptions in your Python code are crystal clear and unambiguous. The LLM uses these descriptions to generate the arguments. Add examples if necessary. <br>2. **Check the Context:** The LLM may not have enough information in the conversational context to fill in the arguments. Your guideline's `action` might need to be more descriptive, e.g., instead of "Get weather", use "Get the current weather for the city the user just mentioned." <br>3. **Check the `ToolInsights`:** The inspection logs contain `ToolInsights` which will explicitly state if a parameter was considered `Missing` or `Invalid`. |
| **Agent gets stuck in a loop.** | The agent keeps repeating the same action or asking the same question. | This is an `applied_guideline_ids` issue. It means the guideline causing the repetition was not correctly marked as "applied". **Solution:** <br>1. Check the `analyze_response` method in the `GuidelineMatcher`. This method determines if a guideline was fulfilled by the agent's final message. <br>2. Ensure that the agent's response actually contains content that satisfies the guideline's action. For example, if the action is "Ask for the user's name", the final message must contain a question asking for their name. <br>3. If a guideline is *meant* to be repeatable, add `"continuous": true` to its metadata. |
| **Performance is slow.** | Each turn takes a long time to process. | This is usually due to an excessive number of LLM calls during the preparation phase. **Solution:** <br>1. **Optimize Guideline Matching:** The `disambiguation` batch strategy is powerful but expensive as it makes an LLM call. Rely on `observational` matching where possible. <br>2. **Check `max_engine_iterations`:** If this is set too high, the engine might be looping unnecessarily. Check the logs to see how many iterations are typically run. <br>3. **Use Caching:** Ensure you have a caching layer (like Redis) for database queries and potentially for LLM calls that are likely to be repeated. |

## 3. All Best Practices with Specific Examples

-   **Fine-Grained Guidelines:** Avoid monolithic guidelines. Break down complex logic into small, single-purpose rules.
    -   **Bad:** `Guideline(condition="User wants to return an item", action="Handle the full return process...")`
    -   **Good:**
        -   `Guideline(condition="User wants to return an item", action="Acknowledge the request and ask for the order number.")`
        -   `Guideline(condition="User provides order number", action="Call the get_order_details tool.")`
        -   `Guideline(condition="Order is eligible for return", action="Inform the user and provide a shipping label.")`
-   **Behavior-Driven Development (BDD):** Write your agent's requirements as `.feature` files first. This clarifies the desired behavior before you write any code and gives you an executable test case.
-   **Isolate External Services with Adapters:** The codebase does this very well. When adding a new database or external API, always create a new module in the `src/parlant/adapters` directory. This keeps the core logic clean and makes it easy to swap out services.
-   **Use the Glossary:** Don't embed domain-specific knowledge in prompts or guideline conditions. Define it once in the `Glossary`. This makes the system more maintainable and improves matching accuracy across all guidelines.
    -   **Example:** Instead of mentioning "SKU" in 10 different guidelines, define "SKU" in the glossary with a description. The engine will automatically use this information during matching.

## 4. Comprehensive Troubleshooting Guide

| Question | Answer |
|---|---|
| **How do I see the exact prompt being sent to the LLM?** | The `GenerationInfo` object, saved as part of the `Inspection` record for each turn, contains the exact prompt sent to the LLM and the raw response received. You can query the database for these records or configure the logger to print them in real-time by increasing the log level. |
| **Why is my Journey not being activated?** | A Journey is only activated if its entry-condition guideline is matched. Follow the debugging steps for "Agent ignores an instruction" for that specific entry guideline. Also, check the `_find_journeys_sorted_by_relevance` method in the engine to see if your journey is even being considered in the top-k most relevant journeys. |
| **How do I add a new LLM provider?** | 1. Add the provider's Python client library to `pyproject.toml` as an optional dependency and create a new "extra" for it. <br>2. Create a new file in `src/parlant/adapters/nlp`, e.g., `my_llm_service.py`. <br>3. In this file, create a class that inherits from `NLPService` and implement the required methods (`generate`, `embed`, etc.) by calling your new provider's SDK. <br>4. Register your new service in the dependency injection container. |
| **How do I clear the agent's memory for testing?** | For a full reset, you can delete the session. For a softer reset, you can use a tool to clear the `applied_guideline_ids` and `journey_paths` from the session's `agent_state`. The persistence layer determines where the data is stored (e.g., in a local JSON file or a MongoDB collection), which you can clear manually if needed. |

---
