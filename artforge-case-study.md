# ArtForge — Case Study

> Closed-source production service. Architecture and engineering approach documented here.

## What It Is
A production Discord bot delivering art-director-level critique to concept artists, grounded in a 300+ book art library via retrieval-augmented generation, with schema-validated structured output and a tiered credit economy.

## Architecture

### Multi-Model Pipeline
Each critique runs two models in one request: Claude (vision) reads the uploaded artwork; OpenAI `file_search` retrieves relevant passages from a vetted art-book corpus. Vision and text retrieval are deliberately separated — the image goes only to the vision model, never into the text-retrieval call.

### RAG Grounding
A curated library is embedded across subject/style-routed vector stores. A retrieval-seed builder maps the user's request parameters to query terms, routing to the correct store so critiques cite real source material rather than generic model knowledge. Target: ~80% library-grounded, 20% model reasoning.

### Structured Output Under Validation
Model output is constrained to a JSON schema and passed through a validator with a repair path: key-set guard, first-JSON-object extraction, and re-injection of critical fields after repair. Malformed generations never reach the user.

### Quality Gate
A six-axis scoring system (two universal + four format-specific axes) gates output into bands — full critique, conditional, or hard redirect — before any evaluation is rendered. Pre-filter, not post-hoc.

### Stateful Economy
Per-user credit and subscription tiers with deduct/refund logic tied to success/failure. Failed external calls refund automatically — the whole pipeline is built around external calls being fragile.

### Delivery Hardening
DM-first with private-thread fallback, section-boundary-aware chunking to fit Discord's message limits. Consistent across five critique commands plus auxiliary tools.

## Engineering Practices
- Separate design sessions from implementation sessions; locked specs before code
- Reuse-first: new commands copy proven handler skeletons, never reinvent validation/retrieval/delivery
- Audit protocol against the live codebase before claims; version-pinned handoffs as source of truth

## Stack
Python, discord.py, Claude API (vision), OpenAI API (file_search / vector stores), JSON schema validation. Deployed as a persistent live service with active beta users.

## What This Proves
RAG pipeline design, structured output under schema validation, multi-model orchestration, stateful service architecture, graceful failure handling, prompt engineering as system design.
