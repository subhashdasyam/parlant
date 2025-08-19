# Complete Data Flow Blueprint

## Data Source Analysis

### Data Source 1: User-Generated Conversational Data
This is the live data that drives conversations.

**Source Type**: API Request from an end-user client.
**Data Structure**: A JSON object containing the message content and sender information, e.g., `{"content": "I need to book an appointment", "sender": "user_123"}`.
**Access Method**: Data is **received** via an HTTP POST request to a session-specific endpoint.
**Update Method**: This data is immutable. New events are created to represent the continuation of the conversation; existing events are not modified.

#### Data Journey Through System
This chart follows a single user message from reception to the generation of the agent's response.
```
API Request → Pydantic Model → Core Domain Event → Background Task Context → LLM Prompt → Agent Domain Event → Data Store Record → API Response
↓             ↓                ↓                   ↓                       ↓            ↓                   ↓                 ↓
[Raw JSON]    [Validated Obj]  [Internal Obj]      [Task Payload]          [Formatted Str] [Internal Obj]      [DB Format]       [JSON Event List]
```

**Detailed Data Flow Steps**:
1. **Data Reception**:
   - **Method**: An HTTP POST request is received by the FastAPI server.
   - **Location**: A route handler in `src/parlant/api/sessions.py`.
2. **Data Validation**:
   - **Validation Rules**: The incoming JSON is validated against a Pydantic model's schema for structure and data types.
   - **Validation Location**: The function signature of the FastAPI route handler.
   - **Invalid Data Handling**: FastAPI automatically rejects invalid data with an HTTP 422 response.
3. **Data Processing**:
   - **Transformation Logic**: The validated Pydantic object is converted into an internal `SessionEvent` domain object. This object is appended to the session's history.
   - **Business Logic Applied**: The content of the `SessionEvent` (the user's text) is the primary input for the Core Engine's intent matching logic, which determines which Journey or Guideline to trigger.
   - **Processing Location**: The core logic resides in `src/parlant/core/application.py`.
4. **Data Storage**:
   - **Storage Method**: The newly created `SessionEvent` object is passed to a persistence adapter to be saved in the database.
   - **Storage Location**: `src/parlant/core/persistence/`.
   - **Storage Format**: BSON for MongoDB, or a similar format for other supported databases.

### Data Source 2: Agent Configuration Data
This is the static data that defines an agent's behavior.

**Source Type**: Database (e.g., MongoDB, ChromaDB).
**Data Structure**: Database documents representing Journeys, Guidelines, Tools, and agent settings.
**Access Method**: Retrieved from the database via data store classes (e.g., `JourneyStore`, `GuidelineStore`) when a conversational turn is being processed.
**Update Method**: Updated via synchronous CRUD operations through the management API endpoints.

## Data Transformation Pipeline

### Transformation 1: Raw User Input to Enriched LLM Prompt
This is the most critical data transformation in the system, where various data sources are synthesized into a single, actionable prompt for the LLM.

**Input Format**: A simple JSON object containing the user's latest message text.
**Transformation Logic**:
1. The user's text is received and a matching Journey or Guideline is identified via vector search.
2. The system retrieves the corresponding instruction, which is a natural language string (e.g., `action="Confirm the details with the patient"`).
3. If the current state requires a tool, the tool is executed, and its result is retrieved (e.g., a list of available appointment times).
4. The agent's persona (e.g., "You are a helpful assistant"), the full conversation history, the specific instruction from the Journey/Guideline, and the formatted tool results are all combined into a single, coherent string.
**Output Format**: A single, large, formatted string that constitutes the final prompt to be sent to the LLM API.
**Transformation Rules**: The rules for this assembly are governed by the prompt engineering logic within the Core Engine, likely located in `src/parlant/core/engines/`.

## Data State Management

### State 1: Conversational Session State
**State Definition**: Represents the complete history and current context of a single conversation. This includes the list of all messages, the current active journey, and any set context variables.
**State Triggers**: A new session is created upon receiving the first message from a user. The state is updated with every subsequent user or agent message.
**State Transitions**: A session is typically in an `active` state. It can transition to a `closed` or `expired` state based on explicit user action or inactivity timeouts.
**State Location**: The complete session state is persisted in the primary database (e.g., MongoDB). A subset of the state for active conversations may be cached in memory for performance.

### State 2: Journey State Machine
**State Definition**: Represents the user's current position within a multi-step `Journey`.
**State Triggers**: A user's message matches the entry condition of a `Journey`.
**State Transitions**: The user's response to an agent's prompt triggers a transition from the current state to the next, as defined by the `condition` on the transition path.
```
(State: Offer Times) → [Condition: "User picks a time"] → (State: Confirm Time)
```
**State Location**: The ID of the current state for a given session is stored as part of that session's data in the database.

## Data Dependencies Map

### Dependency 1: Journey on Tool
**Dependent Data**: A Journey's `tool_state`.
**Dependency Type**: A `tool_state` is defined by a direct reference to a registered `Tool`.
**Impact Analysis**: If a `Tool`'s function signature is changed (e.g., a parameter is renamed or removed), any `Journey` that relies on it will fail at that state. Deleting a tool will break all associated journeys.

### Dependency 2: Session on Agent
**Dependent Data**: A `Session` object.
**Dependency Type**: Every `Session` is inextricably linked to the `Agent` it was created for.
**Impact Analysis**: The `Agent` record is the source of truth for the configuration (persona, Journeys, Guidelines) that drives the conversation. Modifying an agent's configuration will immediately affect the behavior of all subsequent conversational turns in any active sessions for that agent.
