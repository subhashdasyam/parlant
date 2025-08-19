# Complete Input-Output Journey Mapping

## Primary Input Sources

### Input Source 1: Conversational Message via API
This is the primary input for an ongoing conversation, where a user sends a message to an agent.

**Input Types**: A new text message from a human user.
**Input Format**: JSON payload in an HTTP POST request to a session-specific endpoint (e.g., `/sessions/{session_id}/events`). The payload contains the message content and sender information.
**Input Validation**:
- The JSON payload is validated by FastAPI against a Pydantic model.
- The `AuthorizationPolicy` middleware verifies that the requester is permitted to post to the session.
**Entry Point**: The route handler for creating session events, defined in `src/parlant/api/sessions.py`.

#### Complete Journey Path
```
HTTP POST → Middleware Chain → Route Handler → Core Application → Background Task → Data Store → Session Listener → Long-Polling Client
↓           ↓                 ↓               ↓                 ↓                 ↓             ↓                  ↓
[JSON]      [Auth/Log/Trace]  [Pydantic Parse]  [Async Trigger]   [Process Message] [Save Event]  [Notify Waiters]   [Receive Event]
[API Client] [app.py]         [sessions.py]     [application.py]  [background_tasks.py] [persistence] [sessions.py]      [API Client]
```

**Step-by-Step Journey**:
1. **Input Reception**:
   - **Location**: A FastAPI route handler within the router created by `sessions.create_router`.
   - **Processing**: The `uvicorn` server receives the raw HTTP request. FastAPI parses the request path, headers, and body.
   - **Transformations**: The JSON request body is deserialized and validated into a Pydantic model.
   - **Validations**: The `add_correlation_id` middleware injects a tracing ID. The `AuthorizationPolicy` validates the request against defined rules.

2. **Primary Processing (Synchronous API Response)**:
   - **Routing Logic**: FastAPI routes the request to the specific path operation function for posting a new event.
   - **Business Logic Applied**: The handler makes a call to the core `Application` service. Crucially, as per `docs/interactions.md`, this only *triggers* the agent asynchronously.
   - **Data Transformations**: The input Pydantic model is converted into a core domain event object, which is saved to the data store.
   - **API Response**: The API responds immediately with a success status (e.g., `202 Accepted`), returning the ID of the newly created user message event. The agent's reply is *not* in this response.

3. **Secondary Processing (Asynchronous Background Task)**:
   - **Background Tasks**: A background task is queued to handle the core agent logic.
   - **Logic Flow**:
     1. The task loads the full conversation context from the data store.
     2. It uses the `NLPService` to find matching `Journeys` or `Guidelines`.
     3. It executes the matched conversational state, which may involve calling `Tools` (external calls) and the `LLM` (external call).
     4. The resulting agent message is persisted to the data store.
     5. The `SessionListener` is notified of the new event.
   - **Logging**: All steps are logged with the correlation ID.

4. **Output Generation (Separate Long-Polling Flow)**:
   - **Delivery Method**: The client continuously makes long-polling GET requests to an events endpoint (e.g., `/sessions/{session_id}/events?min_offset=...`).
   - **Output Generation**: The `SessionListener` holds the long-polling request open until it is notified of a new event. Once notified, the handler queries the data store for all events after the client's last known offset.
   - **Response Formatting**: The list of new event objects is serialized into a JSON array and sent as the HTTP response to the long-polling request.
   - **Success/Error Handling**: A successful poll returns a `200 OK` with a list of events. A timeout results in an empty list. Server-side errors are caught by FastAPI's exception handlers.

### Input Source 2: System Management via API
This covers administrative actions like creating agents, guidelines, and journeys.

**Input Types**: A request to create, read, update, or delete a system resource.
**Input Format**: JSON payload in POST/PUT requests. URL parameters for GET/DELETE requests.
**Entry Point**: Varies by resource (e.g., `POST /agents`, `POST /guidelines`).

#### Complete Journey Path
```
HTTP Request → Middleware → Route Handler → Data Store → HTTP Response
```
This is a standard synchronous CRUD workflow. The request is received, validated, processed by a handler that interacts directly with a data store (e.g., `AgentStore`), and a synchronous response is returned.

## Output Destinations Analysis
### Output Destination 1: User Interface (via Long-Polling)
**Output Format**: A JSON array of event objects. Each object contains the message content, sender, timestamp, and a unique event ID/offset.
**Delivery Method**: An HTTP response to a long-polling GET request initiated by the client.
**Success Scenarios**: The client receives a list of one or more new events to render.
**Error Scenarios**: The request times out (returning an empty list, which is normal), or a server-side error occurs, returning a standard HTTP error response.

## Complete Data Transformation Map
### Transformation Point 1: API Request to Domain Model
**Input State**: A raw JSON string in the body of an HTTP request.
**Transformation Logic**: FastAPI and Pydantic parse the JSON, validate its structure and types against a predefined schema, and instantiate a Pydantic model. This model is then often converted to an internal domain model.
**Output State**: A validated Python object (Pydantic or domain model).
**Code Location**: Within FastAPI path operation functions (e.g., in `src/parlant/api/agents.py`, `src/parlant/api/sessions.py`).
**Dependencies**: FastAPI, Pydantic.

### Transformation Point 2: Domain Model to API Response
**Input State**: An internal domain model object or a Pydantic response model.
**Transformation Logic**: FastAPI automatically serializes the object into a JSON string.
**Output State**: A JSON string in the HTTP response body.
**Code Location**: The `return` statement of a FastAPI path operation function.
**Dependencies**: FastAPI, Pydantic.
