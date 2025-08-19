# Complete System Overview

## System Purpose and Core Function
**Primary Objective**: To provide a robust framework for developing Large Language Model (LLM) agents that exhibit guaranteed rule-following behavior, ensuring predictable, consistent, and production-ready performance.
**Business Problem Solved**: The system addresses the critical problem of unreliability in production AI agents, where LLMs often ignore carefully crafted prompts, hallucinate responses, and fail to handle edge cases consistently. Parlant's solution is to enforce behavior through explicit, programmable "Guidelines" and "Journeys" rather than relying on the LLM's interpretation of a natural language prompt.
**System Boundaries**:
- **Included**: The framework provides an API server, a command-line interface (CLI), a Python SDK for development, a pre-built web chat UI, and the core engine for managing the entire lifecycle of an agent's conversation, including state management, tool integration, and logging.
- **Excluded**: The system is a framework, not a standalone application. It does not include the LLMs themselves (it integrates with external providers) or the specific business logic for developer-defined tools.

## Complete System Architecture
**Entry Points**:
- **REST API**: The primary entry point for all interactions, built on FastAPI. It exposes endpoints for managing agents, guidelines, journeys, and conversational sessions.
- **Python SDK**: A software development kit (`parlant.sdk`) used by developers to programmatically define and configure agents and their behaviors.
- **Command-Line Interface (CLI)**: Provides scripts for starting the server (`parlant-server`) and likely for client-side interactions (`parlant`).

**Exit Points**:
- **API Responses**: Synchronous JSON responses to management API calls.
- **Asynchronous Events**: Agent and user messages are delivered to clients via a long-polling mechanism on a dedicated API endpoint.
- **Logs**: Structured logs are generated using `structlog` for diagnostics, monitoring, and tracing.
- **Database Records**: State is persisted to external databases.

**Processing Centers**:
- **FastAPI Application**: The web server that handles all incoming HTTP requests, performs authentication and authorization, and routes requests to the appropriate handlers.
- **Parlant Core Engine**: The central processing unit located in `src/parlant/core/`. It orchestrates the conversational logic, including journey/guideline matching, tool execution, and LLM interaction.
- **Dependency Injection Container**: Utilizes the `lagom` library to manage dependencies and wire together the application's components.

**Data Storage Points**:
- **Vector Database**: Uses `chromadb` for semantic search capabilities, primarily for matching user input against conversational guidelines and journeys.
- **Document Database**: Supports `MongoDB` (optional) for persistent storage of core entities like agents, sessions, guidelines, and logs.
- **In-Memory Storage**: Used for managing session-specific state and caching.

**External Integrations**:
- **LLM Providers**: Connects to external LLM APIs such as OpenAI, Anthropic, and Google Gemini to generate conversational responses.
- **Developer-Defined Tools**: Executes custom Python functions (tools) that can interact with any external API, database, or service required by the business logic.

## System Flow Overview
**Primary Workflows**: The core workflow is a single conversational turn, which involves receiving a user message, matching it to a predefined journey or guideline, executing any necessary tools, calling an LLM to generate a response, and delivering that response back to the user.
**Secondary Workflows**: These include the initial setup and definition of an agent's behavior via the SDK or API, and proactive agent messaging triggered by internal logic rather than direct user input.
**Exception Workflows**: The system has dedicated handlers for authorization errors, rate limiting, and not-found errors. It also manages exceptions from failed tool executions or LLM API calls.
**Maintenance Workflows**: Includes database migration processes (indicated by the `parlant-prepare-migration` script) and system monitoring through logs and analytics.

## Complete Component Map
### Core Components
- **API Server (FastAPI)**:
  - **Role**: Manages all external communication, handling HTTP requests, authentication, and data serialization.
  - **Input Processing**: Converts raw HTTP requests into validated Pydantic data models.
  - **Output Generation**: Serializes internal data into JSON responses.
  - **Dependencies**: Parlant Core Engine, Data Stores.
  - **Dependents**: All external clients (Web UI, SDK, CLI).

- **Parlant Core Engine (`src/parlant/core`)**:
  - **Role**: Orchestrates the entire conversational logic.
  - **Input Processing**: Takes validated data from the API layer.
  - **Output Generation**: Produces the agent's response for the API layer.
  - **Dependencies**: Data Stores, NLP Service, LLM Integrations, Tool Registry.
  - **Dependents**: API Server.

- **Data Stores (`src/parlant/adapters/db`)**:
  - **Role**: Manages the persistence and retrieval of all system data.
  - **Input Processing**: Receives data objects for storage or queries for execution.
  - **Output Generation**: Returns data retrieved from the database.
  - **Dependencies**: MongoDB, ChromaDB.
  - **Dependents**: Parlant Core Engine.

- **LLM Integrations (`src/parlant/core/engines`)**:
  - **Role**: Provides a standardized interface to various external LLM providers.
  - **Input Processing**: Receives a structured request to be sent to an LLM.
  - **Output Generation**: Returns the response from the LLM.
  - **Dependencies**: External LLM APIs.
  - **Dependents**: Parlant Core Engine.

## System Interaction Matrix
```
[External Client] → [API Server] → [Core Engine] → [LLM Integration]
       ↑                  ↓              ↓                 ↓
       └────────────────[Response]  [Tool Execution]  [LLM API Call]
                          ↓              ↓
                       [Data Stores]<-[Read/Write]
```
