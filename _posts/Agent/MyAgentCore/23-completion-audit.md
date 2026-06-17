# Completion Audit

This file records the current completion evidence for `doc/01` through `doc/22`.
It is intentionally evidence-oriented: each row points to implementation areas,
tests, and final validation commands that were checked against the current
worktree.

## Scope

- Source of truth: `doc/01-goal.md` through `doc/22-codegen-plan.md`.
- Highest-priority contract: `doc/21-codegen-contract.md`.
- Test matrix: `doc/22-codegen-plan.md` sections A through O.
- Provider test policy: provider tests use `ollama` / local Ollama. Tests do
  not exercise OpenAI or Claude providers.

## Requirement Evidence

| Area | Docs | Implementation Evidence | Test Evidence |
| --- | --- | --- | --- |
| Public SDK, package, CLI, errors | `01`, `02`, `03`, `21`, `22-A` | `pyproject.toml`, `src/agent_core/__init__.py`, `src/agent_core/api/runtime.py`, `src/agent_core/api/handles.py`, `src/agent_core/errors/codes.py`, `src/agent_core/cli.py` | `tests/unit/test_public_api.py`, `tests/unit/test_assets_and_cli.py` |
| Config and path layout | `03`, `18`, `21`, `22-B` | `src/agent_core/config/*`, `src/agent_core/api/runtime.py`, `src/agent_core/assets/templates/config_default.toml` | `tests/unit/test_config_loader.py`, `tests/unit/test_assets_and_cli.py`, `tests/integration/test_plan_task_tools.py` |
| Provider abstraction and Ollama | `02`, `05`, `19`, `21`, `22-C` | `src/agent_core/providers/base.py`, `src/agent_core/providers/ollama.py`, `src/agent_core/providers/registry.py`, `src/agent_core/providers/tool_mapping.py` | `tests/unit/test_provider_mapping.py`, `tests/integration/test_runtime_loop.py`, `tests/e2e/test_ollama_gemma4.py`, provider forbidden scan |
| Runtime loop, event stream, queue, cancel | `03`, `04`, `07`, `20`, `22-D` | `src/agent_core/api/runtime.py`, `src/agent_core/loop/*`, `src/agent_core/events/*`, `src/agent_core/runtime/*` | `tests/integration/test_runtime_loop.py`, `tests/integration/test_run_queue_cancel.py`, `tests/integration/test_orchestrator_mode.py` |
| SQLite, replay, artifacts, cleanup | `06`, `07`, `09`, `20`, `22-E` | `src/agent_core/storage/*`, `src/agent_core/api/replay.py`, `src/agent_core/artifacts/*`, `src/agent_core/api/runtime.py` | `tests/integration/test_replay_cleanup.py`, `tests/unit/test_artifacts.py` |
| Context, instructions, skills | `06`, `11`, `21`, `22-F` | `src/agent_core/context/*`, `src/agent_core/tools/internal.py`, `src/agent_core/assets/prompts/system/*` | `tests/unit/test_instruction_skill_memory.py`, `tests/integration/test_runtime_loop.py` |
| Code tools and output boundaries | `12`, `19`, `21`, `22-G` | `src/agent_core/tools/builtin_code.py`, `src/agent_core/tools/output_limits.py`, `src/agent_core/tools/registry.py` | `tests/unit/test_code_tools.py`, `tests/integration/test_runtime_loop.py`, `tests/integration/test_replay_cleanup.py` |
| Permissions, hooks, declarative tools | `12`, `14`, `18`, `20`, `22-H` | `src/agent_core/permissions/*`, `src/agent_core/hooks/*`, `src/agent_core/tools/declarative.py`, `src/agent_core/tools/registry.py` | `tests/unit/test_code_tools.py`, `tests/unit/test_hooks_mcp_declarative.py`, `tests/unit/test_assets_and_cli.py` |
| Agent definitions and multi-agent | `15`, `19`, `21`, `22-I` | `src/agent_core/agents/*`, `src/agent_core/tools/agent_tools.py`, `src/agent_core/assets/agents/*`, `src/agent_core/api/runtime.py` | `tests/unit/test_agent_definitions.py`, `tests/integration/test_multi_agent.py` |
| Worker and orchestrator | `15`, `17`, `19`, `22-J` | `src/agent_core/agents/workers.py`, `src/agent_core/tools/agent_tools.py`, `src/agent_core/api/runtime.py`, `src/agent_core/tasks/*` | `tests/integration/test_worker_dispatch.py`, `tests/integration/test_orchestrator_mode.py`, `tests/unit/test_assets_and_cli.py` |
| Task DAG and WAL | `06`, `17`, `19`, `21`, `22-K` | `src/agent_core/tasks/*`, `src/agent_core/storage/task_wal.py`, `src/agent_core/context/task_board.py` | `tests/integration/test_plan_task_tools.py`, `tests/integration/test_worker_dispatch.py` |
| Plan template | `11`, `16`, `21`, `22-L` | `src/agent_core/tasks/tools.py`, `src/agent_core/assets/templates/plan_default.md`, `src/agent_core/context/*` | `tests/integration/test_plan_task_tools.py`, `tests/integration/test_runtime_loop.py` |
| Compact and memory | `08`, `10`, `11`, `19`, `22-M` | `src/agent_core/compact/*`, `src/agent_core/memory/*`, `src/agent_core/tools/internal.py`, `src/agent_core/api/runtime.py` | `tests/unit/test_compact_memory.py`, `tests/integration/test_compact_runtime.py`, `tests/integration/test_memory_extraction_runtime.py` |
| MCP | `12`, `13`, `18`, `19`, `22-N` | `src/agent_core/mcp/*`, `src/agent_core/tools/registry.py`, `src/agent_core/config/models.py` | `tests/integration/test_mcp.py`, `tests/unit/test_hooks_mcp_declarative.py` |
| CLI and end-to-end | `03`, `18`, `19`, `21`, `22-O` | `src/agent_core/cli.py`, `pyproject.toml`, `src/agent_core/assets/*` | `tests/unit/test_assets_and_cli.py`, `tests/e2e/test_ollama_gemma4.py`, wheel build and install smoke test |

## Final Validation

The following commands were run against the current code state:

```text
PYTHONPATH=src python3 -m compileall -q src
```

Result: passed.

```text
PYTHONPATH=src python3 -m pytest tests/unit tests/integration -q
```

Result: `320 passed in 5.90s`.

```text
SOONG_AGENT_REQUIRE_OLLAMA_E2E=1 PYTHONPATH=src python3 -m pytest tests/e2e -q -rs
```

Result: `3 passed in 6.14s`.

```text
SOONG_AGENT_REQUIRE_OLLAMA_E2E=1 PYTHONTRACEMALLOC=25 PYTHONPATH=src python3 -m pytest tests/unit tests/integration tests/e2e -q -rs -W error::pytest.PytestUnraisableExceptionWarning
```

Result: `323 passed in 150.36s`.

```text
PYTHONPATH=/private/tmp/soong-agent-build-deps python3 -m build --wheel --no-isolation --outdir /private/tmp/soong-agent-dist
```

Result: wheel built successfully as `soong_agent-0.1.0-py3-none-any.whl`.

```text
rg -n "provider\s*=\s*['\"](fake|openai|anthropic)['\"]|FakeProvider|fake_provider|OpenAI|Anthropic|openai|anthropic" tests
```

Result: no matches.

Wheel smoke test:

- Installed the built wheel into a temporary venv with `--no-deps`.
- Imported `agent_core`, `AgentRuntime`, and `UserMessage`.
- Loaded `template.config.default` from packaged assets and confirmed it uses
  `provider = "ollama"`.
- Ran `soong-agent --help` from the installed console script.

Result: passed.

## Current Completion

All documented A-O acceptance areas have direct implementation and test evidence.
The final validation suite passes with local Ollama enabled, and provider tests
do not exercise OpenAI or Claude providers.

Completion: 100%.
