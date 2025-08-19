# Parlant Documentation: 05 - Detailed Setup Instructions

**Version:** 3.0.1
**Timestamp:** 2025-08-19 10:29:51.507943

---

## 1. Complete Environment Requirements

To set up and run the Parlant project, your development environment must meet the following requirements. Using the exact versions specified is highly recommended to ensure compatibility.

| Component | Requirement | Recommended Version | Notes |
|---|---|---|---|
| **Python** | Interpreter | `3.10.x` or higher | The project is specified with `python = "^3.10"` in `pyproject.toml`. |
| **Poetry** | Python Dependency Manager | `1.8.x` or higher | The project uses Poetry for dependency management and packaging. You must have Poetry installed. |
| **Node.js** | JavaScript Runtime | `18.x` or `20.x` | Required for building and managing the frontend chat application. |
| **npm** | Node Package Manager | `9.x` or `10.x` | Comes with Node.js. Used for installing frontend dependencies. |
| **Git** | Version Control | Latest stable | Required for cloning the repository. |
| **Docker** | Containerization (Optional) | Latest stable | Recommended for running dependencies like MongoDB and ChromaDB in isolated containers. |

## 2. Step-by-Step Installation

Follow these steps precisely to set up the project.

### Step 1: Clone the Repository

```bash
git clone https://github.com/emcie-co/parlant.git
cd parlant
```

### Step 2: Configure Environment Variables

The project uses a `.env` file to manage secrets and environment-specific configurations.

1.  Create a `.env` file in the root of the project directory:
    ```bash
    touch .env
    ```
2.  Open the `.env` file and add the following variables. You must provide your own values for services you intend to use.

    ```dotenv
    # --- Core Parlant Configuration ---
    # The secret key used for signing tokens or other security purposes.
    # Generate a secure random key, e.g., using: openssl rand -hex 32
    PARLANT_SECRET_KEY="your-super-secret-key-here"

    # --- Database Configuration ---
    # Choose your database adapters. Common choices are 'json_file' or 'mongo_db'.
    # For a production setup, 'mongo_db' is recommended.
    PARLANT_DB_ADAPTER="mongo_db"
    MONGO_DB_CONNECTION_STRING="mongodb://localhost:27017/parlant"

    # --- Vector Database Configuration ---
    # Choose your vector DB adapter. 'chroma' is a common choice.
    PARLANT_VECTOR_DB_ADAPTER="chroma"
    # For a local ChromaDB running in Docker:
    CHROMA_DB_HOST="localhost"
    CHROMA_DB_PORT="8000"

    # --- LLM Provider API Keys ---
    # Add the API keys for the NLP services you want to use.
    # You only need to provide keys for the services you enable via extras.
    OPENAI_API_KEY="sk-..."
    ANTHROPIC_API_KEY="sk-ant-..."
    # etc. for other services (GEMINI_API_KEY, TOGETHER_API_KEY)
    ```

### Step 3: Install Backend Dependencies

All backend dependencies are managed by Poetry.

1.  **Install base dependencies:**
    ```bash
    poetry install
    ```
2.  **Install Optional Dependencies (Extras):** The project uses "extras" for optional features, like specific database adapters or LLM providers. To use them, you must install the corresponding extras.

    *   **Example: To use MongoDB and OpenAI:**
        ```bash
        poetry install --extras "mongo openai"
        ```
    *   **Example: To install support for all optional LLM providers and databases:**
        ```bash
        poetry install --all-extras
        ```
    *   Refer to the `[tool.poetry.extras]` section in `pyproject.toml` for a full list of available extras.

### Step 4: Install Frontend Dependencies

The chat UI is a React application located in `src/parlant/api/chat`.

```bash
cd src/parlant/api/chat
npm install
```

### Step 5: Build Frontend Assets

After installing the dependencies, you need to build the static assets for the frontend. These assets will be served directly by the FastAPI backend.

```bash
# Still inside src/parlant/api/chat
npm run build
cd ../../../.. # Return to the project root
```

## 3. Running the Application

### Running Backend Server

The backend server is a FastAPI application run with Uvicorn. Poetry provides a convenient script for this.

```bash
# From the project root
poetry run parlant-server
```

By default, the server will be available at `http://localhost:8800`.

-   **API Docs:** `http://localhost:8800/docs`
-   **Chat UI:** `http://localhost:8800/chat` (or `/`, which redirects)

The server will automatically reload when you make changes to the backend Python code.

## 4. Complete Testing Procedures

The project has a comprehensive test suite using `pytest` and `pytest-bdd`.

### Running the Full Test Suite

To run all tests, execute the following command from the project root:

```bash
poetry run pytest
```

### Running Specific Tests

You can run a specific test file or directory by providing its path:

```bash
# Run all tests in the API test suite
poetry run pytest tests/api

# Run a single test file
poetry run pytest tests/core/stable/engines/alpha/test_baseline_scenarios.py
```

### Test Coverage

To generate a test coverage report, you can use the `pytest-cov` plugin (which is installed as a dev dependency):

```bash
poetry run pytest --cov=src/parlant
```

## 5. Complete Deployment Instructions

Deploying Parlant to a production environment involves several steps. Here is a high-level guide for a typical deployment on a Linux server.

1.  **Provision a Server:** A virtual private server (VPS) with a Linux distribution (e.g., Ubuntu 22.04) is a standard choice.
2.  **Set up Dependencies:** Install Python, Poetry, and a reverse proxy like Nginx on the server.
3.  **Deploy Code:** Clone your repository to the server.
4.  **Install Dependencies:** Run `poetry install --no-dev --all-extras` (or the specific extras you need) to install only production dependencies.
5.  **Build Frontend:** Run the `npm install && npm run build` commands for the frontend as described in the installation steps.
6.  **Configure Environment:** Create a `.env` file on the server with your production database credentials, API keys, and a secure `PARLANT_SECRET_KEY`. Do not commit this file to version control.
7.  **Run with a Production Server:** Do not use the development server (`parlant-server`) in production. Instead, use a production-grade ASGI server like Gunicorn.

    ```bash
    # Example Gunicorn command
    poetry run gunicorn -w 4 -k uvicorn.workers.UvicornWorker parlant.bin.server:main_for_gunicorn
    ```
    *(Note: The entry point `parlant.bin.server:main_for_gunicorn` is hypothetical and assumes a function that returns the `app` object. The actual entry point might need to be adjusted for Gunicorn.)*

8.  **Configure Reverse Proxy (Nginx):** Set up Nginx to act as a reverse proxy that listens for public traffic on ports 80/443 and forwards it to the Gunicorn process running on a local port (e.g., 8800). This is also where you would configure SSL/TLS for HTTPS.

    *Example Nginx site configuration:*
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://127.0.0.1:8800;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Also need to configure location for WebSocket connections
        location /logs/ws/ {
            proxy_pass http://127.0.0.1:8800/logs/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    ```
9.  **Set up Process Manager:** Use a process manager like `systemd` or `supervisor` to run the Gunicorn process as a service. This ensures it starts automatically on boot and is restarted if it crashes.
---
