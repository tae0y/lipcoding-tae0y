---
applyTo: "**/*.md"
---

# Markdown Rules

## Writing

- One H1 per file, matching the document's purpose.
- Keep paragraphs short. Use tables/lists only when they aid scanning.
- Declare the language on code blocks.
- Link related files with relative paths.
- No filler, flattery, or emoji overuse.

## Reading (long documents — when a spec/doc exceeds 100 lines and you only need part of it)

1. **Scan headings first**: grab the table of contents with `grep -n "^#" <file>`.
2. **Read only the relevant section**: open just the part you need by line range.

For short files, or when you need the full context, read it straight through. (This saves
the 3-hour limit and tokens when handling a large spec via `spec-ingest`.)
