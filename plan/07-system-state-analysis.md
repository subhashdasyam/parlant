# Complete System State Analysis

## Application State Management

### Global State Components
#### State 1: Conversational Session State
**State Structure**: A session is a complex object representing a single, continuous conversation.
```json
{
  "session_id": "string (unique)",
  "agent_id": "string",
  "customer_id": "string",
  "created_at": "datetime",
  "context_variables": { "key": "value", ... },
  "active_journey_id": "string | null",
  "current_journey_state_id": "string | null",
  "events": [
    {
      "event_id": "string",
      "offset": "integer",
      "sender": "user | agent",
      "content": "string",
      "timestamp": "datetime"
    },
    ...
  ]
}
```
**State Location**: The primary source of truth is the main database (e.g., MongoDB). Active sessions may be cached in-memory for performance.
**State Lifecycle**: A session is created upon the first message from a user to an agent. It is updated with every subsequent message from either the user or the agent. It may be marked as `inactive` or `closed` after a period of inactivity or by an explicit API call.
**State Dependencies**: The entire Core Engine's logic for a given conversational turn depends on the current state of the session object.
**State Persistence**: The state is fully persisted in the database, allowing it to survive server restarts.

#### State 2: Agent Configuration State
**Configuration Source**: Loaded from the database. It is created and modified via the management API or SDK.
**Configuration Structure**: A root document for an agent that contains its settings (name, persona) and references to its associated capabilities (Guidelines, Journeys, Tools).
**Dynamic Updates**: The configuration can be updated at runtime via API calls. These changes will be reflected in all subsequent conversational turns for that agent.
**Configuration Validation**: Validation is performed at the API layer using Pydantic models whenever an agent's configuration is created or modified.

### Component-Level State
#### Component 1: SessionListener
**Internal State**: A Python dictionary that maps a `session_id` to a list of waiting `asyncio.Future` objects. This represents the long-polling requests that are waiting for new messages for each session.
**State Synchronization**: This component is a singleton within a single server instance. Access is synchronized by the `asyncio` event loop.
**State Events**:
- **Add Waiter**: When a long-polling GET request arrives and there are no new messages, a future is added to the waitlist for that session.
- **Notify**: When a new agent message is saved, this event is triggered, which resolves all waiting futures for the session, causing the long-polling requests to return.
**State Persistence**: This is ephemeral, in-memory state. It is lost on server restart, which is acceptable as clients are expected to timeout and reconnect.

## Database State Management
The following describes the inferred schemas for the main database collections.

### Table State Analysis
#### Table 1: `agents`
**Schema**:
```json
{
  "_id": "string (agent_id)",
  "name": "string",
  "description": "string",
  "persona": "string"
}
```
**State Relationships**: An agent is a root object. It has one-to-many relationships with sessions, guidelines, and journeys, likely managed through foreign keys in those collections.

#### Table 2: `sessions`
**Schema**: The schema is the same as the "Conversational Session State" described above.
**State Relationships**: A session belongs to one `agent` and one `customer`. It contains a list of embedded event documents.

#### Table 3: `journeys`
**Schema**:
```json
{
  "_id": "string (journey_id)",
  "agent_id": "string",
  "title": "string",
  "entry_conditions": ["string"],
  "states": [{ "state_id": "...", "type": "...", "definition": "..." }],
  "transitions": [{ "from_state": "...", "to_state": "...", "condition": "..." }]
}
```
**State Relationships**: A journey belongs to one `agent`. It is a self-contained state machine.

### Transaction State
Given the document-oriented nature of the data, multi-document ACID transactions are likely used sparingly. They would be necessary for operations that must update multiple collections atomically, such as creating a new guideline and adding its ID to the agent's list of guidelines. These transactions would be managed by the database driver (e.g., PyMongo's `with_session`).

## Cache State Management

### Cache Layer 1: Agent Configuration Cache
**Cache Type**: An in-memory cache (e.g., `cachetools.LRUCache`) is likely used to avoid repeated database lookups for agent configurations.
**Cache Structure**: A dictionary mapping an `agent_id` to the complete agent configuration object.
**Cache Lifecycle**:
- **Population**: On the first request for a given agent, its configuration is loaded from the database and stored in the cache.
- **Invalidation**: When an agent's configuration is updated via the API (`PUT /agents/{agent_id}`), the corresponding cache entry must be deleted to ensure fresh data is loaded on the next request.
**Cache Synchronization**: For a multi-instance deployment, this in-memory cache would become inconsistent. A distributed cache like Redis would be required to ensure all instances have a consistent view of the agent configurations.

## State Recovery Procedures

### Recovery Scenario 1: System Restart
**State Restoration**: All persistent state (agents, sessions, etc.) is stored in the external database and is immediately available after a restart.
**State Validation**: A robust system would include startup health checks to verify database connectivity.
**State Repair**: The existence of a `parlant-prepare-migration` script indicates a mechanism for applying schema changes and data migrations, which is a form of state repair and evolution.
**Ephemeral State**: All in-memory state is lost. This includes active long-polling waiters and any in-memory caches. This is not critical, as clients will simply re-establish their long-polling connections, and caches will be repopulated on demand.
