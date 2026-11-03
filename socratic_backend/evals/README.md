# Fixed dialogue regression set

`fixed_dialogues.json` is the stable first-stage evaluation set for the AI Tutor.
It is intentionally independent of live student data and must not be rewritten to
match a model's latest output.

Each case contains:

- the task and teaching stage;
- the current learning focus and hint level;
- a short conversation and the latest student message;
- optional code, run result, plan, or memory context;
- observable expectations such as response language, focus progression, allowed
  strategy, prohibited solution content, and maximum question count.

Validate the dataset structure without calling an LLM:

```powershell
socratic_backend\.venv\Scripts\python.exe socratic_backend\evals\validate_fixed_dialogues.py
```

Run one inexpensive smoke case first:

```powershell
socratic_backend\.venv\Scripts\python.exe socratic_backend\evals\run_fixed_dialogues.py --limit 1
```

Run the complete regression set:

```powershell
socratic_backend\.venv\Scripts\python.exe socratic_backend\evals\run_fixed_dialogues.py
```

The runner calls the compiled LangGraph directly. It does not call the HTTP/auth
layer and does not write student memory, learning records, or Supabase data. It
does make real model calls, so it requires the backend model environment variables
and consumes API quota.

Reports are written to the ignored `evals/results/` directory in JSON and Markdown.
Results use three meaningful outcomes: `pass` for all deterministic rules passing,
`fail` for a deterministic failure, and `review` when deterministic checks pass but
teaching semantics still need human review. Runtime failures use `error`.
Each failed rule is mapped to likely backend files and function names, and the
"priority improvements" section ranks those code locations by failure count.

Compare a new run with an earlier JSON report:

```powershell
socratic_backend\.venv\Scripts\python.exe socratic_backend\evals\run_fixed_dialogues.py `
  --compare socratic_backend\evals\results\fixed-dialogues-PREVIOUS.json
```

Useful filters are `--case CASE_ID`, `--category CATEGORY`, and `--limit N`.
Raw outputs stay separate from the golden dataset so repeated runs never modify
the fixtures.
