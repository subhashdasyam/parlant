# Complete Decision Logic Mapping

## Primary Decision Trees

### Decision Tree 1: Appointment Scheduling Journey
This decision tree maps the conversational flow for scheduling a healthcare appointment, based on the `create_scheduling_journey` function in `examples/healthcare.py`.

**Entry Point**: A user's message is semantically matched to the condition: "The patient wants to schedule an appointment".
**Decision Factors**: The user's natural language responses to questions about available times and appointment details.

#### Complete Decision Flow
```
User asks to schedule -> Get available slots -> Offer slots to user -> User Responds
                                                                      |
                     +------------------------------------------------+------------------------------------------------+
                     | (Condition: "The patient picks a time")        | (Condition: "None of those times work...")     |
                     ↓                                                ↓                                                ↓
               Confirm Details → User Confirms?                     Get later slots → Offer later slots → User Responds  |
                     |                      |                           |                                         |  | (Guideline: "visit is urgent")
      (Yes) ---------> Schedule Appointment → End Journey                |            (Picks a time) -----------------+  |
                     |                                                    |            (None work) → Ask to call → End      ↓
      (No) ----------> [Loop or Fallback Guideline]                       +----------------------------------------------+ Tell to call office immediately
```

**Detailed Decision Analysis**:

#### Decision Point 1: User Response to Initial Slots
**Location**: Transitions from the `t2` state in `create_scheduling_journey` in `examples/healthcare.py`.
**Condition Logic**: The system evaluates the user's natural language response against two conditions:
1. `condition="The patient picks a time"`
2. `condition="None of those times work for the patient"`
**Decision Factors**: The primary factor is the semantic meaning of the user's message, as interpreted by the underlying LLM and NLP service.
**Possible Outcomes**:
- **Outcome A (Picks a time)**: The workflow transitions to the `t3` state to confirm the selected time with the patient.
- **Outcome B (None work)**: The workflow transitions to the `t6` state to fetch and offer alternative, later appointment slots.

#### Decision Point 2: User Confirmation of Details
**Location**: Transition from the `t3` state in `create_scheduling_journey`.
**Condition Logic**: `condition="The patient confirms the details"`
**Decision Factors**: The user's affirmative or negative response to the confirmation prompt.
**Possible Outcomes**:
- **Outcome A (Confirms)**: The workflow transitions to the `t4` state, which executes the `schedule_appointment` tool to finalize the booking.
- **Outcome B (Does not confirm)**: The journey does not have an explicit path for this. The system would likely re-prompt or rely on a fallback guideline.

## Business Rule Decision Trees
These are implemented as `Guidelines`, which act as high-priority, context-aware business rules that can override the standard conversational flow.

### Business Rule 1: Urgent Visit Request
**Rule Statement**: "If the patient says their visit is urgent, tell them to call the office immediately."
**Implementation Location**: `examples/healthcare.py`, within the `create_scheduling_journey` function.
**Rule Logic**:
```python
await journey.create_guideline(
    condition="The patient says their visit is urgent",
    action="Tell them to call the office immediately",
)
```
**Rule Execution Scenarios**: This guideline is scoped to the scheduling journey. If a user's message is determined to be urgent at any point within that journey, this rule will trigger, interrupting the standard flow to provide an immediate, critical instruction.

### Business Rule 2: Off-Topic Inquiry
**Rule Statement**: "If the patient asks about something unrelated to healthcare, kindly deflect the inquiry."
**Implementation Location**: `examples/healthcare.py`, in the `main()` function.
**Rule Logic**:
```python
await agent.create_guideline(
    condition="The patient inquires about something that has nothing to do with our healthcare",
    action="Kindly tell them you cannot assist with off-topic inquiries - do not engage with their request.",
)
```
**Rule Execution Scenarios**: This is a global, agent-level guideline. It can be triggered at any point in any conversation, acting as a guardrail to keep the agent on topic.

## Validation Logic Map

### Validation Point 1: API Request Body Validation
**Validation Type**: Structural and data type validation of incoming JSON payloads.
**Validation Rules**: Defined by Pydantic models corresponding to each API endpoint that accepts a request body.
**Implementation**: Implicit in the FastAPI route handler definitions.
```python
# Example from a route handler
@router.post("/")
async def create_agent(request: CreateAgentRequest): # FastAPI validates against CreateAgentRequest
    ...
```
**Error Handling**: If validation fails, FastAPI automatically returns an HTTP 422 Unprocessable Entity response with details about the validation error.
**Success Path**: The validated data is available in the route handler as a Pydantic object.

## Authorization and Permission Logic
The system uses a centralized `AuthorizationPolicy` object, which is checked at various points.

### Permission Check 1: Access to API Documentation
**Check Location**: `add_correlation_id` middleware in `src/parlant/api/app.py`.
**Permission Logic**:
```python
await authorization_policy.authorize(
    request=request,
    operation=Operation.ACCESS_API_DOCS,
)
```
**Access Granted Path**: The request proceeds to the appropriate handler, and the OpenAPI (Swagger) documentation is served.
**Access Denied Path**: An `AuthorizationException` is raised, which is caught by a global exception handler and converted into an HTTP 403 Forbidden response.

### Permission Check 2: General Endpoint Authorization
**Check Location**: Within each route handler, typically via a dependency injection mechanism. The `AuthorizationPolicy` is passed to each router factory (e.g., `agents.create_router(policy=...)`).
**Permission Logic**: Before executing business logic, the handler calls the policy with the required operation.
```python
# Pseudocode for a route handler
async def create_agent_handler(request, policy: AuthorizationPolicy):
    await policy.authorize(request, Operation.CREATE_AGENT)
    # If no exception, proceed...
```
**Access Granted Path**: The handler executes its business logic (e.g., creates an agent).
**Access Denied Path**: An `AuthorizationException` is raised, resulting in an HTTP 403 Forbidden response.
