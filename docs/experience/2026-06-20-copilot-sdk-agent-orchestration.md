# Copilot SDK Agent Orchestration — Experience Notes

**Date:** 2026-06-20 (Lipcoding competition day)
**Context:** Journey from converting the research feature from a "single API call" to real agent
tool orchestration and getting it working in a production container.

---

## 1. Problem Before the Switch: Using SDK Like an API

Symptoms of the original code:

```python
# ❌ Tool is passthrough — just echoes arguments back
@define_tool(...)
async def collect_materials(params) -> dict:
    return {"materials": params.materials}   # just echo

# ❌ Final result is model's text JSON blob parsed manually
content = resp.data.content
data = json.loads(content[content.find("{"):content.rfind("}")+1])
```

→ Tool calls were only formal; actual results depended on model's text JSON
→ Even with tool definitions, this was an "API wrapper" not "agent orchestration"

---

## 2. Real Orchestration Pattern: Store Capture

**Core principle:** Tool handler saves received arguments to `store` → assemble final result from store

```python
def _make_research_tools(store: dict, on_tool=None) -> list:
    @define_tool(description="...")
    async def collect_materials(params) -> dict:
        store["materials"] = [ResearchMaterial(**m) for m in params.materials]
        if on_tool: on_tool("collect_materials", len(store["materials"]))
        return {"ok": True, "collected": len(store["materials"])}  # <- feedback to agent

    @define_tool(description="...")
    async def frame_options(params) -> dict:
        store["options"] = [str(o) for o in params.options]
        if on_tool: on_tool("frame_options", len(store["options"]))
        return {"ok": True, "framed": len(store["options"])}

    return [collect_materials, frame_options]

# Usage: assemble Research from tool call results
research = _research_from_store(store)  # no JSON parsing dependency
```

**Effect:**
- Tool calls are real output channels, not decoration
- If the model doesn't call tools, there are no results → real orchestration
- `on_tool` callback exposes "🔧 collect_materials — 5 items" delta in streaming → makes orchestration visible in demo

---

## 3. Production Container BYOK Failure Causes and Fixes

### Symptom
- Local (with CLI auth): SDK tool calls work (collect 5 / frame 4)
- Production container: `content=''` empty idle → error

### Cause 1: No Copilot CLI in Dockerfile

```dockerfile
# ❌ Before: Python runtime only, no CLI
FROM python:3.12-slim
```

```dockerfile
# ✅ After: Node 20 + @github/copilot installed
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
RUN npm install -g @github/copilot
```

### Cause 2: `use_logged_in_user` defaults to True

Python SDK's `CopilotClient` default:
```python
use_logged_in_user=True   # -> bundled CLI requires GitHub logged-in user
```

No GitHub logged-in user in container → CLI blocks → empty idle

**Fix:** Create client with `use_logged_in_user=False` in BYOK mode

```python
def _make_client() -> CopilotClient:
    if os.environ.get("COPILOT_PROVIDER_BASE_URL", "").strip():
        return CopilotClient(use_logged_in_user=False)  # <- headless BYOK
    return CopilotClient()
```

With this flag, the bundled runtime starts with `--no-auto-login`, using only the BYOK provider without GitHub auth.

### Cause 3: Unstable Prompt for Tool Calls in Streaming Mode

`send_and_wait` path calls tools fine; `send + streaming=True` path doesn't.

**Fix:** Add explicit forcing instruction to prompt

```python
# ❌ Weak phrasing
"Call the collect_materials and frame_options tools directly to complete the pre-research."

# ✅ Forcing phrasing
"You MUST call the collect_materials tool and the frame_options tool at least once each. "
"If you do not call the tools, the results will not be saved."
```

---

## 4. Fallback Chain (End-to-End Baseline Protection)

```
1st priority: Copilot SDK agent (local CLI / BYOK container)
    ↓ failure/empty result
2nd priority: Azure Foundry direct call (openai AzureOpenAI, JSON mode)
    ↓ failure
3rd priority: Heuristic
```

This structure ensures:
- If SDK path is blocked in production, **Foundry provides real AI pre-research**
- If SDK + BYOK is working, tool orchestration + streaming delta visibility

---

## 5. BYOK Container Configuration Summary

Environment variables to add to container:

| Variable | Value | Notes |
|---|---|---|
| `COPILOT_PROVIDER_BASE_URL` | `https://<aoai>.openai.azure.com` | Activates BYOK when set |
| `COPILOT_PROVIDER_TYPE` | `azure` | |
| `COPILOT_PROVIDER_API_KEY` | `<API_KEY>` | |
| `COPILOT_PROVIDER_AZURE_API_VERSION` | `2024-10-21` | |
| `COPILOT_MODEL` | `gpt-4o` | Deployment name |

→ If `AZURE_OPENAI_*` are already set, `config.setup_byok_env()` helper fills these automatically

**No GitHub token required** (bypasses GitHub auth when BYOK is active)

---

## 6. Deployment Pattern (Local → ACR)

ACR remote build (`az acr build`) is convenient but slow when build is heavy (like installing Copilot CLI).
Local Docker build → ACR push can be faster due to layer caching.

```bash
# linux/amd64 required (Mac M-series arm64 → ACA requires amd64)
docker build --platform linux/amd64 \
  -t lipcodingabk8.azurecr.io/lipcoding-api:TAG \
  -t lipcodingabk8.azurecr.io/lipcoding-api:latest .
docker push lipcodingabk8.azurecr.io/lipcoding-api:TAG
az containerapp update -n lipcoding-api -g rg-lipcoding \
  --image "lipcodingabk8.azurecr.io/lipcoding-api:TAG"
```

---

## 7. Scoring Perspective (Copilot SDK 25%)

Difference between simple call vs orchestration:

| Item | Simple call | Agent orchestration |
|---|---|---|
| Tool role | Decoration before JSON parsing | Real output channel |
| Result assembly | Model text JSON parsing | store (tool call results) |
| Streaming visibility | Tokens only | Includes tool invocation deltas |
| Production independence | Crashes on JSON parse failure | Falls back to Foundry when store is empty |

"Agent + tool calls + streaming" is the combination that maximizes Copilot SDK depth score.
