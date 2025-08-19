# Complete Scenario Trigger Mapping

## Code Path Analysis

### Active Code Paths (Regularly Executed)
#### Path 1: Successful Conversational Turn (Journey-Based)
This is the primary "happy path" for user interaction.
**Trigger Conditions**: A user's message semantically matches the entry condition of a configured `Journey`.
**Frequency**: High. This path is executed for most user interactions that follow a predefined conversational flow.
**Components Involved**: API Server, Core Engine, Data Stores, LLM Integration, Tool Registry.
**Code Locations**: `src/parlant/api/sessions.py`, `src/parlant/core/application.py`, `src/parlant/core/journeys.py`, `src/parlant/core/engines/`.
**Complete Execution Trace**:
```
User Message → Find Matching Journey → Execute Journey State → Call LLM → Save Agent Message → Notify Client
↓              ↓                       ↓                       ↓           ↓                   ↓
[API Event]    [Vector Search]         [Run Tool or Prep Chat] [Get Response] [Persist Event]    [Release Long Poll]
```

### Dormant Code Paths (Rarely Executed)
#### Path 1: Tool Execution Failure Recovery
**Activation Triggers**: A registered `Tool` function raises an unhandled exception during its execution. This typically happens if an external API call within the tool fails (e.g., network error, 5xx response).
**Why Rarely Used**: This path is only taken when external dependencies of a tool fail, which is assumed to be infrequent.
**Code Location**: The `try...except` block surrounding the tool execution logic, likely within the Core Engine's journey processing module.
**Testing Requirements**: Requires mocking a tool to raise a specific exception to verify that the error handling path is triggered correctly.

#### Path 2: High-Priority Guideline Interruption
**Scenario Description**: An edge case or global rule that must interrupt the normal flow of a conversation to provide a critical response.
**Trigger Conditions**: A user's message semantically matches a `Guideline`'s condition (e.g., "The patient says their visit is urgent" from `examples/healthcare.py`).
**Code Implementation**: `await agent.create_guideline(...)`
**Impact Analysis**: The standard conversational flow is immediately halted. The `Guideline`'s `action` is executed instead, providing a higher-priority response that overrides the journey's logic.

### Conditional Code Paths
#### Condition 1: Journey State Transition Logic
**Condition Logic**: The system evaluates the user's response against the natural language `condition` strings defined on the transitions of the current journey state.
**Path A (Condition Met)**: The journey transitions to the target state of the first matched condition. For example, if a user says "Yes, that time works," the `condition="The patient picks a time"` is met, and the flow proceeds to the confirmation state.
**Path B (Different Condition Met)**: If the user says "None of those times work," the flow transitions to the `get_later_slots` state instead.
**Configuration**: The conditions are defined by the developer in the journey creation script (e.g., `examples/healthcare.py`).

#### Condition 2: Authorization Policy Enforcement
**Role Checking Logic**: The `AuthorizationPolicy.authorize(request, operation)` method is called, typically in middleware or as a dependency in a route handler. The policy's internal logic inspects the request (e.g., headers, cookies) to determine if the operation is permitted.
**Admin Path**: A request with admin credentials can access management endpoints (e.g., `POST /agents`, `DELETE /guidelines`).
**User Path**: A request with standard user credentials can interact within their own conversational session but is denied access to administrative endpoints.
**Guest Path**: An unauthenticated request is denied access to all protected endpoints.

## Scenario Matrix

### Error Scenarios
#### Error 1: Database Connection Failure
**Trigger**: The database server is down, unreachable, or rejects the connection.
**Detection Method**: The database driver (e.g., `pymongo`) raises a connection exception when a data store class attempts to perform an operation.
**Recovery Process**: A global exception handler in `src/parlant/api/app.py` catches the exception, logs the critical error, and returns an HTTP 503 Service Unavailable response. There is no automatic recovery; the service remains degraded until the database connection is restored.
**User Impact**: The service is unavailable. All API calls that require database access will fail.

#### Error 2: External LLM Service Timeout
**Timeout Conditions**: The configured LLM provider's API is slow, down, or fails to respond within the client's timeout window.
**Retry Logic**: A production-grade system would implement a retry mechanism with exponential backoff.
**Fallback Behavior**: If the LLM call ultimately fails, the background task processing the turn should catch the exception. It should then log the failure and save a specific "agent error" event to the session (e.g., "I'm having trouble thinking right now. Please try again in a moment.") to inform the user.
**Error Propagation**: The error is contained within a single conversational turn and does not crash the server.

### Security Scenarios
#### Security 1: Unauthorized Access Attempt
**Detection Triggers**: A request is made to a protected endpoint without valid authentication or authorization credentials for the required `Operation`.
**Security Response**: The `AuthorizationPolicy` raises an `AuthorizationException`. This is caught by a global exception handler in `app.py`.
**Logging**: The authorization error is logged at the `TRACE` level, recording the failed attempt.
**User Notification**: The user's client receives an HTTP 403 Forbidden response.
