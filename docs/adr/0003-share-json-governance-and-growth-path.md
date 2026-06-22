# ADR 0003: Share JSON Governance And Growth Path

## Status
Accepted

## Context
Markdown Kits uses a local JSON file for lightweight share storage. This keeps deployment simple, but Data URL images can make records large and the JSON file is not suitable for multi-instance writes.

## Decision
- Keep JSON storage for the current single-instance service.
- Add governance around the JSON file before changing databases: optional `expiresAt`, paginated/searchable admin listing, batch deletion, and storage byte reporting.
- Do not compress individual share records in the JSON file yet. Compression would make manual inspection and debugging worse, while the current admin storage metrics make large Data URL pressure visible.
- Treat SQLite or Postgres as the next storage step if the service needs multi-instance deployment, large public traffic, or routine multi-MB image-heavy shares.

## Consequences
- Existing share links remain compatible because `expiresAt` defaults to permanent.
- Operators can see record count and approximate JSON/content bytes before storage becomes a surprise.
- The JSON store remains intentionally single-instance; any multi-instance deployment must revisit this ADR and replace `ShareStore`.
