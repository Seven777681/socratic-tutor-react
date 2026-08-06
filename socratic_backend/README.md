# Socratic Tutor Backend

FastAPI service used by the Next.js application for isolated Python code
execution. The repository also retains an experimental Python implementation
of the five tutoring agents, but the active tutor workflow runs in Next.js via
LangGraph.js.

## Setup

```bash
cd socratic_backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

The base requirements are sufficient for health checks and real Python code
execution. To experiment with the legacy Python agents later, install:

```bash
pip install -r requirements-agents.txt
```

No API key is required for `/api/code/run`. Only if you deliberately test the
legacy Python tutor endpoint, copy `.env.example` to `.env` and add model
credentials:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
MODEL_NAME=...
```

## Run

```bash
uvicorn server:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`

## How it connects to the frontend

The Next.js route `app/api/code/run/route.ts` proxies code execution to
`POST http://127.0.0.1:8000/api/code/run`, configurable with the
`SOCRATIC_BACKEND_URL` environment variable. Tutor requests remain inside the
Next.js server and use `lib/server/tutor-multi-agent.ts`.

The legacy `/api/tutor/message` route remains available for experiments and
routes requests by `stage`/`action`:

| Frontend stage/action | Agent(s) called |
|---|---|
| `stage === "plan"` or `action === "review_plan"` | Agent 1 (plan review) |
| `action === "generate_reflection_summary"` | Agent 5 (reflection) |
| everything else (coding/debugging) | Agent 3 (code analysis) → Agent 4 (monitor) → Agent 2 (Socratic dialogue) |

## Notes

The subprocess code runner is intended for trusted local development only. Python isolated mode and execution timeouts are not a security sandbox, so do not expose this endpoint publicly or run untrusted code in production without a dedicated sandbox.

- `agent_services.py` (plain function calls via `llm_base.py`) is loaded lazily
  only if the legacy Python tutor route is called.
- `graph_nodes.py` + `tutor_graph.py` is an alternate LangGraph state-machine
  implementation of the same 5 agents. It is currently unused by the HTTP
  server but kept for reference/future use if you want the strict
  Plan → Code → Monitor → Reflect state machine enforced server-side instead
  of being driven by the frontend's `stage` field.
- `main.py` is an unused PyCharm template file and can be deleted.
