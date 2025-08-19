# Parlant Documentation: 08 - Complete Code Reference

**Version:** 3.0.1
**Timestamp:** 2025-08-19 10:31:54.232665

---

## 1. Every Code Snippet with Full Context

This section provides practical, copy-pasteable code examples for the most common tasks when using the Parlant Python SDK.

### Snippet 1: Creating a Basic Agent with a Tool and a Guideline

This is the "Hello, World!" of Parlant. It demonstrates setting up a server, creating an agent, defining a tool it can use, and giving it a single rule to follow.

```python
import asyncio
import parlant.sdk as p

# 1. Define a tool the agent can use.
# The decorator automatically registers it with the framework.
@p.tool
async def get_user_info(context: p.ToolContext, user_id: str) -> p.ToolResult:
    """Retrieves user information from a database."""
    # In a real application, you would query your database here.
    print(f"Tool called: Getting info for user {user_id}")
    if user_id == "123":
        return p.ToolResult({"name": "Alice", "plan": "Premium"})
    return p.ToolResult({"error": "User not found"})

async def main():
    # 2. Start the Parlant server.
    # The `async with` block handles startup and graceful shutdown.
    async with p.Server() as server:

        # 3. Create an agent.
        # This is persisted in the database configured in your .env file.
        agent = await server.create_agent(
            name="SupportBot",
            description="A helpful assistant for user support."
        )

        # 4. Create a guideline to link a user intent to the tool.
        # This tells the agent WHEN to use the tool.
        await agent.create_guideline(
            condition="User asks for their account information.",
            action="""
                Use the get_user_info tool to retrieve the user's account details.
                The user's ID is available in the context.
            """,
            tools=[get_user_info]
        )

        # 5. Create a guideline to handle the tool's output.
        await agent.create_guideline(
            condition="The get_user_info tool returns user information.",
            action="""
                Present the user's name and plan in a friendly message.
            """
        )

        print("🎉 Agent 'SupportBot' is ready!")
        print(f"Chat UI available at http://{server.host}:{server.port}/chat")

        # Keep the server running to interact with the agent.
        await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
```

### Snippet 2: Starting a Chat Session and Sending a Message

This snippet shows how a client application would interact with a running Parlant agent.

```python
import asyncio
import httpx

# Assume the Parlant server from Snippet 1 is running.
BASE_URL = "http://localhost:8800"
AGENT_ID = "SupportBot" # The name we used when creating the agent.

async def chat():
    async with httpx.AsyncClient() as client:
        # 1. Create a new session for a specific user (customer).
        # In a real app, you'd have a customer management system.
        customer_id = "customer_456"

        response = await client.post(
            f"{BASE_URL}/sessions",
            json={"agent_id": AGENT_ID, "customer_id": customer_id}
        )
        session = response.json()
        session_id = session['id']
        print(f"Started new session: {session_id}")

        # 2. Post a message event to the session.
        user_message = "Can you tell me about my account? My ID is 123."
        response = await client.post(
            f"{BASE_URL}/sessions/{session_id}/events",
            json={
                "kind": "message",
                "source": "CUSTOMER",
                "data": {"message": user_message}
            }
        )
        print(f"Posted message, server responded with: {response.status_code}")

        # 3. Poll for the agent's response.
        # In a real app, you would use the WebSocket for this.
        print("Waiting for agent's response...")
        while True:
            await asyncio.sleep(2)
            response = await client.get(f"{BASE_URL}/sessions/{session_id}/events")
            events = response.json()
            agent_messages = [
                e for e in events
                if e['source'] == 'AGENT' and e['kind'] == 'message'
            ]
            if len(agent_messages) > 0 and agent_messages[-1]['data']['message'] != "Thinking...":
                print("Agent responded:", agent_messages[-1]['data']['message'])
                break

if __name__ == "__main__":
    asyncio.run(chat())
```

## 2. All API Endpoints with Complete Documentation

This table documents the complete REST API provided by the Parlant backend.

| Method & Path | Description | Example Request Body | Example Response Body |
|---|---|---|---|
| **`POST /sessions`** | Creates a new chat session for an agent and customer. | `{ "agent_id": "MyAgent", "customer_id": "user123" }` | `{ "id": "sess_abc123", "agent_id": "...", ... }` (Full Session object) |
| **`GET /sessions/{id}`** | Retrieves the details of a specific session. | (None) | `{ "id": "sess_abc123", "agent_id": "...", ... }` (Full Session object) |
| **`PATCH /sessions/{id}`** | Updates the properties of a session (e.g., its title). | `{ "title": "My Support Chat" }` | `{ "id": "sess_abc123", "title": "My Support Chat", ... }` |
| **`DELETE /sessions/{id}`** | Deletes a session and its history. | (None) | `200 OK` |
| **`GET /sessions/{id}/events`** | Retrieves the full list of events for a session. | (None) | `[ { "id": "evt_xyz", "kind": "message", ... }, ... ]` (List of Event objects) |
| **`POST /sessions/{id}/events`** | Posts a new event to a session (e.g., a user message). | `{ "kind": "message", "source": "CUSTOMER", "data": { "message": "Hi!" } }` | `200 OK` |
| **`POST /agents`** | Creates a new agent configuration. | `{ "name": "NewAgent", "description": "...", "composition_mode": "FLUID" }` | `{ "id": "agent_def456", "name": "NewAgent", ... }` (Full Agent object) |
| **`GET /agents`** | Lists all available agents. | (None) | `[ { "id": "agent_abc", ... }, { "id": "agent_def", ... } ]` |
| **`POST /guidelines`** | Creates a new guideline. | `{ "condition": "User is happy", "action": "Offer a coupon", "agent_id": "agent_abc" }` | `{ "id": "gl_ghi789", "condition": "...", ... }` (Full Guideline object) |
| **`GET /guidelines`** | Lists guidelines, with optional filtering by agent or tags. | (Query params: `?agent_id=agent_abc`) | `[ { "id": "gl_ghi789", ... }, ... ]` |
| **`POST /tools`** | Registers a new tool from an OpenAPI specification. | `{ "service_name": "weather_api", "spec": "..." }` | `{ "id": "tool_jkl012", ... }` |
| **`GET /tools`** | Lists all registered tools. | (None) | `[ { "id": "tool_jkl012", ... }, ... ]` |
| **`POST /journeys`** | Creates a new conversational journey. | `{ "name": "Onboarding", "description": "...", "entry_condition_guideline_ids": ["gl_abc"] }` | `{ "id": "j_mno345", ... }` |
| **`GET /journeys`** | Lists all available journeys. | (None) | `[ { "id": "j_mno345", ... }, ... ]` |
| **`GET /logs/ws/{client_id}`** | Establishes a WebSocket connection for receiving real-time events. | (WebSocket Upgrade Request) | (Connection established) |

## 3. Every Database Interaction Explained

Direct database interaction is discouraged. The framework provides a complete abstraction layer for persistence.

-   **`EntityQueries`:** This class (injected via the container) should be used for all **read** operations. It provides methods like `find_guidelines_for_context`, `read_agent`, `read_session`, etc. These methods are adapter-aware and will route the query to the correct database (e.g., MongoDB, ChromaDB) based on the configuration.
-   **`EntityCommands`:** This class should be used for all **write** operations (`create`, `update`, `delete`). It provides methods like `create_agent`, `update_session`, etc.

This separation of read and write operations is a form of the CQRS (Command Query Responsibility Segregation) pattern, which helps to keep the data logic clean and maintainable.

## 4. Complete Error Codes and Messages

The API uses standard HTTP status codes for responses.

| Code | Status | Meaning |
|---|---|---|
| `200` | OK | The request was successful. |
| `201` | Created | A new resource was successfully created (used by some POST endpoints). |
| `403` | Forbidden | You are not authorized to perform this action or access this resource. Caused by an `AuthorizationException`. |
| `404` | Not Found | The requested resource (e.g., a session or agent with the given ID) does not exist. Caused by an `ItemNotFoundError`. |
| `422` | Unprocessable Entity | The request body is malformed or failed validation (e.g., a required field is missing). This is handled automatically by FastAPI. |
| `429` | Too Many Requests | The client has exceeded the configured rate limit. Caused by a `RateLimitExceededException`. |
| `500` | Internal Server Error | An unexpected error occurred on the server. The response body will contain a generic error message, and the detailed traceback is logged on the server. |

## 5. Complete Code Style and Patterns Guide

For developers looking to contribute to the Parlant codebase, understanding these core patterns is essential.

-   **Dependency Injection (DI):** The entire application is wired together using the `lagom` DI container. Components should never instantiate their own dependencies (e.g., `db = MongoDb()`). Instead, they should declare their dependencies in their `__init__` method and let the container provide them. This makes components loosely coupled and easy to test.
-   **Strategy Pattern:** Complex logic with multiple possible implementations (like guideline matching or tool calling) is handled using the Strategy pattern. An orchestrator class (e.g., `GuidelineMatcher`) delegates the work to a specific `Strategy` object (e.g., `GenericGuidelineMatchingStrategy`). This makes the system highly extensible.
-   **Adapter Pattern:** All external services (databases, LLMs, vector stores) are accessed through an Adapter. This isolates the core application logic from the specifics of any third-party library, making it easy to add support for new services without changing the core code.
-   **Asynchronous Everywhere:** The entire backend is built on `asyncio`. All I/O-bound operations (database calls, API requests) must be `await`ed, and functions that perform them must be `async def`. This allows the server to handle a large number of concurrent connections efficiently.

---
