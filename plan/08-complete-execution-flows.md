# Complete Execution Flow Analysis

## Primary Execution Flows

### Flow 1: User Message Processing (Sync + Async)
This flow details the complete lifecycle of a single user message, from reception to the agent's response. It is fundamentally split into two parts: a fast, synchronous acknowledgement, and a slower, asynchronous processing task.

**Flow Overview**: A user sends a message. The API acknowledges it immediately with an HTTP 202. In the background, the system processes the message, calls tools and an LLM, and saves the agent's response. The response is delivered to the client via a separate, long-polling GET request.

---
#### Detailed Execution Steps (Synchronous Acknowledgement)

**Step 1: Request Reception (0ms)**
- **Function**: Uvicorn/Starlette ASGI server request handling.
- **Location**: Web server layer, before FastAPI.
- **Input**: Raw HTTP POST request targeting `/sessions/{session_id}/events`.
- **Processing**: Parses the raw HTTP request into a structured object.
- **Output**: A request object passed to the FastAPI application.

**Step 2: Middleware Execution (5ms)**
- **Function**: `add_correlation_id` and authorization middleware.
- **Location**: `src/parlant/api/app.py`.
- **Input**: The FastAPI `Request` object.
- **Processing**: Injects a correlation ID for tracing and calls the `AuthorizationPolicy` to verify the request is permitted.
- **Output**: The `Request` object, now enriched with context, or an `AuthorizationException` is raised.

**Step 3: Route Handling & Validation (15ms)**
- **Function**: The `POST /events` route handler in `src/parlant/api/sessions.py`.
- **Input**: The `Request` object.
- **Processing**: FastAPI uses the function's type hints to parse and validate the request body against a Pydantic model (e.g., `CreateEventRequest`).
- **Output**: A validated Pydantic model object. An `HTTPException` (422) is raised on failure.

**Step 4: Initial Processing & Async Task Creation (30ms)**
- **Function**: The route handler calls a method on the `Application` service, e.g., `application.handle_message()`.
- **Location**: `src/parlant/api/sessions.py` → `src/parlant/core/application.py`.
- **Input**: `session_id`, user message content, and other context.
- **Processing**: Creates and persists the user's message event to the database. It then calls `asyncio.create_task()` to schedule the agent's response generation to run in the background.
- **Output**: The unique ID of the newly created user message event.

**Step 5: API Response (40ms)**
- **Function**: FastAPI response handling.
- **Location**: FastAPI framework layer.
- **Input**: The data to be returned (the user message event ID).
- **Processing**: Serializes the response data to a JSON string.
- **Output**: An HTTP `202 Accepted` response with the JSON payload, sent back to the original caller.

---
## Parallel Execution Flows

### Concurrent Flow 1: Asynchronous Agent Response Generation
This is the main concurrent flow, running on the `asyncio` event loop.

**Concurrency Model**: Single-threaded asynchronous concurrency via `asyncio`.
**Trigger Mechanism**: A call to `asyncio.create_task()` in the `Application` service.

#### Background Execution Sequence
This sequence runs independently in the background after the initial API request has returned.

**Step 1: Load Full Context**
- **Function**: `SessionStore.get_session()`, `AgentStore.get_agent()`.
- **Processing**: Retrieves the full conversation history and the agent's configuration from the database.

**Step 2: Match Intent**
- **Function**: `ContextualCorrelator.find_matches()`.
- **Processing**: Uses vector search on ChromaDB to find the best matching Journey or Guideline for the user's message.

**Step 3: Execute State/Action**
- **Function**: `Tool.execute()` or internal journey logic.
- **Processing**: If the matched state is a `tool_state`, it executes the tool. If it's a `chat_state`, it prepares the prompt instructions.

**Step 4: Call LLM**
- **Function**: A method in `src/parlant/core/engines/` for the specific LLM provider.
- **Processing**: Composes the final prompt and makes an HTTP request to the external LLM API.

**Step 5: Save Response & Notify**
- **Function**: `SessionStore.add_event()`, `SessionListener.notify()`.
- **Processing**: The agent's response is saved to the database. The `SessionListener` is then notified, which releases any waiting long-polling requests for this session.

## Error Execution Flows

### Error Flow 1: Authorization Failure (Sync)
**Error Detection Point**: The `authorization_policy.authorize()` call in the middleware (`src/parlant/api/app.py`).
**Error Propagation**: The `authorize` method raises a custom `AuthorizationException`.
**Error Recovery**: The exception is caught by the `authorization_error_handler` defined in `app.py`. This handler logs the event and raises a FastAPI `HTTPException`.
**Final Outcome**: The client receives an HTTP 403 Forbidden response.

### Error Flow 2: Tool Execution Failure (Async)
**Error Detection Point**: A `try...except` block around the `tool.execute()` call within the background task.
**Error Propagation**: The exception is caught locally within the background task, preventing it from crashing the server.
**Error Recovery**: The task's logic should handle the exception by creating a specific "agent error" event (e.g., "I was unable to complete that request."). This error event is then saved to the session just like a normal message.
**Final Outcome**: The `SessionListener` is notified, and the client receives the error message, informing the user of the failure in-band.
