# Agentflow AI — Agentic AI Operations Automation Platform

**Agentflow AI** is a production-grade full-stack AI operations platform that translates natural language prompts into executable visual workflows. The platform generates workflow graphs from prompts, renders those graphs on an interactive React Flow canvas, executes them through a chain of 5 cooperating AI agents, integrates with real third-party tools (Gmail, Slack, Discord, Google Sheets), queues background jobs with retry backoff, streams live execution events over Socket.IO, and persists an immutable audit trail in MongoDB.

---

## 🌟 Key Platform Features

- **Natural Language Prompt-to-Workflow Engine**: Converts plain English descriptions into complete DAG graphs with named nodes, positions, edges, and configurations. Supports OpenRouter (Claude 3.5), Google Gemini SDK, and a rich deterministic rule engine fallback.
- **5 Cooperating AI Agent Chain**:
  1. **Planner Agent**: Analyzes DAG topology, determines node execution order, and emits confidence scores.
  2. **Execution Agent**: Executes nodes against third-party integrations or AI providers with mustache variable interpolation (`{{node-1.summary}}`).
  3. **Validation Agent**: Enforces output contracts and schemas before downstream progression.
  4. **Recovery Agent**: Classifies failure taxonomy (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and applies exponential backoff or operator escalation.
  5. **Monitoring Agent**: Emits real-time Socket.IO telemetry and persists immutable `ExecutionLog` entries.
- **Interactive Drag-and-Drop Canvas**: Built with `@xyflow/react`, custom node cards (Triggers, Agents, Integrations, Conditions, Actions), glowing animated edges, and a dynamic schema inspector panel.
- **Third-Party Integrations**: Gmail (send/read), Slack (channels/webhooks), Discord (bot/webhooks), and Google Sheets (append/read) with **AES-256-GCM** credential encryption at rest. Includes built-in Sandbox/Mock mode for instant testing without OAuth keys.
- **Real-Time Telemetry & Audit Trail**: Live execution timeline streams agent events to the browser with status badges, step outputs, and notifications drawer.
- **Zero-Config Developer Experience**: Automatically initializes embedded in-memory MongoDB and an in-memory queue fallback if external MongoDB or Redis instances are not running.

---

## 🏗️ Architecture & Folder Structure

```
Project spect/
├── client/                     # Next.js (Pages Router) Frontend
│   ├── src/
│   │   ├── components/         # AppShell, MetricGrid, NodePalette, NodeConfigPanel, WorkflowCanvas
│   │   ├── pages/              # Landing (/), Login, Register, Dashboard, Workflows, Executions, Integrations, Settings
│   │   ├── services/           # Axios API client, Socket.IO client
│   │   ├── store/              # Zustand AuthStore & WorkflowStore
│   │   └── styles/             # Dark theme globals & glow animations
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── agents/             # Planner, Execution, Validation, Recovery, Monitoring, Orchestrator
│   │   ├── config/             # Environment, Mongo/In-Memory DB, Socket.IO
│   │   ├── controllers/        # Auth, Workflow, Execution, Integration, Notification
│   │   ├── integrations/       # Base, Gmail, Slack, Discord, Google Sheets
│   │   ├── middleware/         # Auth JWT, Express-Validator, Error Handler
│   │   ├── models/             # User, Workflow, Execution, ExecutionLog, Integration, Notification, AgentMemory
│   │   ├── queues/             # BullMQ (Redis) with resilient in-memory fallback
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & AI generation
│   │   ├── utils/              # AES-256-GCM encryption
│   │   └── server.js           # Server bootstrap
│   ├── test/                   # Automated Node.js test suite
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (`node -v`)
- **npm** v9.0.0 or higher (`npm -v`)
- *(Optional)* MongoDB & Redis — **not required** for local testing as embedded in-memory engines are built-in!

---

### 2. One-Command Setup & Run (Recommended)

From the project root directory, you can install and run both frontend and backend concurrently:

1. **Install all dependencies (root, backend, and frontend)**:
   ```bash
   npm run install:all
   ```

2. **Start both Backend (port 5000) & Frontend (port 3000) with one command**:
   ```bash
   npm run dev
   ```

---

### 3. Individual Component Setup

#### Backend Setup (`server/`):
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will start at **http://localhost:5000**.*

#### Frontend Setup (`client/`):
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will start at **http://localhost:3000**.*

---

## 🔑 Default Credentials & Instant Demo Login

For fast onboarding without manual registration:
- **Email**: `operator@agentflow.ai`
- **Password**: `OperatorPass2026!`
- Or simply click the **"1-Click Instant Demo Login"** button on the `/login` page.

---

## ⚙️ Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Express HTTP server port | `5000` |
| `CLIENT_URL` | Allowed frontend CORS origin | `http://localhost:3000` |
| `JWT_SECRET` | Secret key for JWT signing & verification | `super_secret_jwt_key...` |
| `CREDENTIAL_ENCRYPTION_KEY` | 32-byte hex key for AES-256 token encryption | `0123456789abcdef...` |
| `MONGODB_URI` | MongoDB connection URI *(empty = embedded in-memory Mongo)* | `""` |
| `REDIS_URL` | Redis URI for BullMQ *(empty = in-memory queue)* | `""` |
| `OPENROUTER_API_KEY` | OpenRouter API Key for Claude/Llama models | `""` |
| `GEMINI_API_KEY` | Google Gemini SDK Key | `""` |
| `GMAIL_CLIENT_ID` | Google OAuth Client ID | `""` |
| `GMAIL_CLIENT_SECRET` | Google OAuth Client Secret | `""` |
| `SLACK_CLIENT_ID` | Slack OAuth Client ID | `""` |
| `SLACK_CLIENT_SECRET` | Slack OAuth Client Secret | `""` |
| `DISCORD_CLIENT_ID` | Discord Bot / OAuth Client ID | `""` |
| `DISCORD_BOT_TOKEN` | Discord Bot Token | `""` |
| `GOOGLE_SHEETS_CLIENT_ID` | Google Sheets OAuth Client ID | `""` |
| `GOOGLE_SHEETS_CLIENT_SECRET` | Google Sheets OAuth Client Secret | `""` |

---

## 🛠️ Usage Guide

### 1. Generating Workflows via Natural Language
1. Navigate to **AI Builder** (`/workflows/builder`).
2. Type an instruction such as:
   - *"Process incoming Gmail invoices, extract total amount with AI, add to Google Sheets, and notify Slack #finance"*
   - *"Listen for webhook incident alerts, classify outage severity with Gemini, post to Discord war-room, and email on-call engineer"*
3. Click **Generate Workflow Graph**.
4. The multi-agent builder materializes nodes, positions, and connections.
5. Click **Save & Open in Full Studio** to edit or execute.

### 2. Visual Studio & React Flow Canvas
1. Open any workflow (`/workflows/[id]`).
2. Drag triggers, AI agents, or third-party integrations from the left **Node Palette**.
3. Connect node handles to define data flow.
4. Click any node to open the right-hand **Node Inspector** to configure parameters, mustache variables (`{{node-1.output}}`), or validation contracts.
5. Click **Run Execution** to dispatch the run to the agent engine.

### 3. Real-Time Execution Console & Multi-Agent Telemetry
1. Open an execution (`/executions/[id]`).
2. Watch the live **Socket.IO** timeline as each agent executes:
   - **Planner Agent**: Evaluates graph topology & emits confidence score.
   - **Execution Agent**: Executes steps against third-party integrations or AI providers.
   - **Validation Agent**: Confirms output schemas against contract rules.
   - **Recovery Agent**: Handles transient issues or escalates failures.
   - **Monitoring Agent**: Emits audit logs and operator notifications.
3. Use **Pause**, **Resume**, or **Cancel** buttons to control active runs in real time.

### 4. Third-Party Integrations Hub
1. Navigate to **Integrations** (`/integrations`).
2. Connect Gmail, Slack, Discord, and Google Sheets using standard OAuth or manual tokens/webhooks.
3. When testing locally without OAuth apps, built-in **Sandbox Mock Modes** automatically simulate third-party execution with authentic payloads.

---

## 🧪 Running Automated Tests

Run the backend automated end-to-end test suite:
```bash
cd server
npm test
```
The suite verifies health, registration, JWT authentication, workflow CRUD, prompt generation, multi-agent execution pipeline, timeline logs, and integration encryption.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, queue status, and LangGraph availability |
| `POST` | `/api/auth/register` | Register new operator account |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT |
| `GET` | `/api/auth/me` | Fetch authenticated operator profile |
| `GET` | `/api/workflows/dashboard` | Aggregated metrics, recent executions & agent feed |
| `GET` | `/api/workflows` | List workflows with filtering/search |
| `POST` | `/api/workflows` | Create a new workflow manually |
| `POST` | `/api/workflows/generate` | Generate DAG graph from prompt via AI |
| `GET` | `/api/workflows/:id` | Fetch workflow details |
| `PUT` | `/api/workflows/:id` | Update workflow nodes & edges |
| `POST` | `/api/workflows/:id/duplicate` | Clone an existing workflow |
| `POST` | `/api/workflows/:id/execute` | Start agentic workflow execution |
| `DELETE` | `/api/workflows/:id` | Delete workflow |
| `GET` | `/api/executions` | List execution runs |
| `GET` | `/api/executions/:id` | Get execution snapshot and status |
| `GET` | `/api/executions/:id/timeline` | Get granular agent timeline events |
| `POST` | `/api/executions/:id/pause` | Pause active execution |
| `POST` | `/api/executions/:id/resume` | Resume paused execution |
| `POST` | `/api/executions/:id/cancel` | Cancel active execution |
| `GET` | `/api/integrations` | List integration connection statuses |
| `POST` | `/api/integrations` | Save manual credentials / webhook |
| `DELETE` | `/api/integrations/:provider` | Disconnect integration |
| `GET` | `/api/notifications` | List user notifications |

---

## 🛡️ Security Architecture
- Passwords hashed with **bcryptjs** at cost factor 12.
- Sessions authenticated with signed **JWTs**.
- Tokens and sensitive credentials encrypted at rest using **AES-256-GCM**.
- Route rate limiting enabled via **express-rate-limit**.
- HTTP security headers applied via **helmet**.
- CORS restricted to configured `CLIENT_URL`.
- Input bodies validated with **express-validator**.
