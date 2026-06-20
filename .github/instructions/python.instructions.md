---
applyTo: "backend/**/*.py,**/*.py"
---

# Python Rules

- Type hints required on every function signature.
- PEP 257 docstrings on public functions/classes. For non-obvious design, write the *why*.
- PEP 8, 4-space. Functions small and single-responsibility. Split when complex.
- Handle edge cases explicitly: empty input, wrong types, large data. No bare `except:`.
- Readable, idiomatic code over clever code.
- For external dependencies, add a usage comment at the import site.

Competition realism: spec grading is #1. If the rules above significantly hurt speed, get
the core path passing first and clean up later. But always keep type hints and explicit
exceptions (fewer bugs means faster in the end).
