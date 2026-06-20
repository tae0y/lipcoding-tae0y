---
applyTo: "**/test_*.py,**/*_test.py,tests/**/*.py"
---

# Test Rules

- One test = one behavior. Name by **behavior**, not by method:
  e.g. `test_<resource>_rejects_duplicate_<field>`, based on spec behavior.
- Arrange–Act–Assert. Keep arrange minimal and explicit.
- Test **behavior**, not implementation details or internal state.
- Don't redefine production schemas in test files — import them.
- Don't mock the function under test.
- Core path + edge cases (empty / malformed / large input).

## Competition priority

Tests pulled directly from the grading spec come first. Covering each item of the checklist
that `spec-ingest` produces with an **endpoint integration test** (FastAPI `TestClient`) is
what most directly drives the score.

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_<endpoint>_returns_expected_status() -> None:
    # Path, body, and status code come from docs/spec.md (this year's spec).
    r = client.post("<spec path>", json={...})
    assert r.status_code == 200
```

## Anti-patterns (rejected)

- Coverage theater that runs lines with no assertions.
- An obsession with 1:1 implementation-file ↔ test-file mapping.
- "Just in case" tests with no behavior.
