# Complete System Reconstruction Blueprint

This document provides a step-by-step guide to reconstructing a functional AI agent application using the Parlant framework. It uses the `healthcare.py` example as a template for the final application logic.

## Phase 1: Environment and Foundation Setup

### Step 1.1: Development Environment Preparation
**Objective**: Set up an exact, reproducible development environment.
**Prerequisites**:
- Python (version 3.10+ recommended)
- Poetry (Python dependency manager)
- Git
- Docker (for running databases like MongoDB and ChromaDB)

**Environment Setup Commands**:
```bash
# 1. Clone the Parlant repository or start from a new directory
git clone https://github.com/emcie-co/parlant.git
cd parlant

# 2. Install all Python dependencies using Poetry
# This command reads the pyproject.toml file and installs all required packages.
poetry install

# 3. (Optional) Set up external databases using Docker
# This requires a docker-compose.yml file specifying the services.
# Example: docker-compose up -d mongodb chromadb
```

**Environment Validation**:
```bash
# 1. Verify Python and Poetry versions
python --version
poetry --version

# 2. Run the test suite to ensure all components are installed and working
poetry run pytest
```

### Step 1.2: Project Structure Creation
**Objective**: Create the basic directory structure for a new Parlant-based application.
**Directory Structure**:
```
.
├── .venv/
├── pyproject.toml
├── poetry.lock
└── my_agent/
    └── main.py
```
**Structure Creation Script**:
```bash
mkdir my_agent
touch my_agent/main.py
```

## Phase 2: Core Application Implementation
This phase focuses on implementing the agent's core logic inside `my_agent/main.py`, following the patterns from `examples/healthcare.py`.

### Step 2.1: Implement Tools
**Objective**: Define the agent's capabilities to interact with external systems.
**Implementation**:
```python
# my_agent/main.py
import parlant.sdk as p
from datetime import datetime

# A tool is a simple async Python function decorated with @p.tool.
# It can take arguments and must return a p.ToolResult.

@p.tool
async def get_upcoming_slots(context: p.ToolContext) -> p.ToolResult:
    # In a real application, this would call an external API or database.
    print("Fetching available appointment slots...")
    return p.ToolResult(data=["Monday 10 AM", "Tuesday 2 PM", "Wednesday 1 PM"])

@p.tool
async def schedule_appointment(context: p.ToolContext, datetime: str) -> p.ToolResult:
    # This tool takes an argument extracted by the LLM from the conversation.
    print(f"Scheduling appointment for {datetime}...")
    return p.ToolResult(data=f"Success! Appointment confirmed for {datetime}")
```

### Step 2.2: Implement Journeys (Workflows)
**Objective**: Define the structured, multi-step conversational flows.
**Implementation**:
```python
# my_agent/main.py

async def create_scheduling_journey(agent: p.Agent) -> p.Journey:
    # 1. Create the journey and define its entry condition
    journey = await agent.create_journey(
        title="Schedule an Appointment",
        conditions=["The patient wants to schedule an appointment"],
    )

    # 2. Define the states and transitions
    # Initial state -> Get slots
    t0 = await journey.initial_state.transition_to(tool_state=get_upcoming_slots)

    # Get slots -> Offer slots
    t1 = await t0.target.transition_to(
        chat_state="List the available times and ask which one works."
    )

    # Offer slots -> (if user picks a time) -> Confirm details
    t2_happy_path = await t1.target.transition_to(
        chat_state="Confirm the details with the patient before scheduling.",
        condition="The patient picks a time",
    )

    # Offer slots -> (if user says none work) -> End
    t2_sad_path = await t1.target.transition_to(
        chat_state="Ask the patient to call the office to find a suitable time.",
        condition="None of those times work for the patient",
    )
    await t2_sad_path.target.transition_to(p.END_JOURNEY)


    # Confirm details -> (if user confirms) -> Schedule appointment
    t3 = await t2_happy_path.target.transition_to(
        tool_state=schedule_appointment,
        condition="The patient confirms the details",
    )

    # Schedule appointment -> Final confirmation
    t4 = await t3.target.transition_to(chat_state="Confirm the appointment has been scheduled.")
    await t4.target.transition_to(p.END_JOURNEY)

    return journey
```

### Step 2.3: Implement Guidelines (Business Rules)
**Objective**: Define global rules and edge case handlers.
**Implementation**:
```python
# In the main setup function

await agent.create_guideline(
    condition="The patient asks to talk to a human",
    action="Please call our office at +1-234-567-8900 to speak with a representative.",
)

await agent.create_guideline(
    condition="The patient asks an off-topic question",
    action="I can only assist with healthcare-related inquiries. How can I help you today?",
)
```

## Phase 3: System Assembly and Execution

### Step 3.1: Create the Main Entry Point
**Objective**: Write the main function to initialize the server, create the agent, and register all its behaviors.
**Implementation**:
```python
# my_agent/main.py
import asyncio

async def main():
    # The p.Server context manager handles startup and shutdown.
    async with p.Server() as server:
        # 1. Create the agent
        agent = await server.create_agent(
            name="Healthcare Agent",
            description="Is empathetic and calming to the patient.",
        )

        # 2. Register all behaviors
        await create_scheduling_journey(agent)
        # ... register other journeys and guidelines ...

        print("Healthcare agent is running. Access the playground at http://localhost:8800")
        # Keep the script running to keep the server alive
        await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 3.2: Execution
**Objective**: Run the agent.
**Command**:
```bash
poetry run python my_agent/main.py
```

## Reconstruction Validation Checklist

### Functional Validation
- [ ] Does the server start without errors?
- [ ] Can you access the chat playground at `http://localhost:8800`?
- [ ] Does sending "I want to schedule an appointment" trigger the scheduling journey?
- [ ] Does the agent correctly offer the time slots from the `get_upcoming_slots` tool?
- [ ] Does the agent correctly follow both the "happy path" (user picks a time) and the "sad path" (user says none work)?
- [ ] Do the global guidelines (e.g., asking for a human) trigger correctly?

### Technical Validation
- [ ] All Python dependencies from `pyproject.toml` are installed correctly.
- [ ] The `poetry run` command executes the script successfully.
- [ ] Logs from the script (e.g., "Fetching available appointment slots...") appear in the console.
