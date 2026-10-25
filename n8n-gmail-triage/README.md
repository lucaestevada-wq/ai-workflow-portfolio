# n8n Gmail Triage — LLM-Powered Email Routing with Human Approval

Automatically categorises, prioritises and drafts replies for every inbound Gmail. A human approval gate sits before any email is sent — which turned out to be the real value story (see [Key Finding](#key-finding)).

**Stack**: n8n Community Edition (self-hosted, Docker) · Gmail API · Claude Haiku 5.5 · Google Sheets

---

## Workflow diagram

```
Gmail Trigger
     │
     ▼
Anthropic (Claude Haiku 5.5)
  Structured JSON prompt →
  { category, urgency, summary, reply }
     │
     ▼
JSON Parse & Validate
     │
     ├── category = "spam" ──────────────────────────────┐
     │                                                    │
     ▼                                                    ▼
Gmail: Create Draft Reply          Google Sheets: Log row (spam)
     │
     ▼
Google Sheets: Log row
     │
     ▼
Human Approval Gate  ←── reviews draft before anything is sent
     │
     ├── Approved ──► Gmail: Send Draft
     │
     └── Declined ──► Gmail: Delete Draft
```

---

## Node breakdown

| # | Node | What it does |
|---|------|-------------|
| 1 | **Gmail Trigger** | Polls inbox every minute for new messages |
| 2 | **Anthropic** | Sends subject + body to Claude; returns structured JSON |
| 3 | **JSON Parse** | Extracts `category`, `urgency`, `summary`, `reply` |
| 4 | **IF (spam check)** | Routes spam to log-only branch; no draft created |
| 5 | **Gmail: Create Draft** | Creates a draft from the `reply` field |
| 6 | **Sheets: Log** | Appends one row: timestamp, category, urgency, summary |
| 7 | **Human Approval** | Wait node — email sent to operator with Approve / Decline links |
| 8 | **Gmail: Send / Delete** | Executes the operator's decision |

---

## The prompt (v1.1)

```
Return ONLY valid JSON, no other words, no code fences:
{"category":"sales|support|spam|other","urgency":"low|medium|high","summary":"max 12 words","reply":"short polite draft reply"}

Rules for the reply field:
- Never state prices, deadlines, attachment names, or policies that are not explicitly written in the email above.
- If any of those details are missing, ask for them instead of inventing them.

Subject: {{ $json.subject }}
Email: {{ $json.text }}
```

---

## Key finding

During testing Claude invented facts in draft replies: fake refund amounts, attachment names that didn't exist, policy deadlines that weren't in the email. This made the **approval gate non-optional** — it's not a formality, it's what makes the workflow safe to deploy.

The v1.1 prompt adds an explicit rules block that prevents hallucination of unsupported details. Draft quality improved immediately; operators now spend time on edge cases rather than correcting invented facts.

---

## Test results (15-email test set)

| Metric | Result |
|--------|--------|
| Category accuracy | 14 / 15 (93%) |
| Urgency accuracy | 14 / 15 (93%) |
| Hallucinated facts in draft (v1.0) | 6 / 15 |
| Hallucinated facts in draft (v1.1) | 0 / 15 |
| Cost per email (Haiku 5.5) | ~$0.0001 |

---

## What this proves

- Structured LLM output via n8n's Anthropic node (JSON schema enforcement)
- Prompt engineering to eliminate hallucinated facts in agentic drafts
- Human-in-the-loop approval pattern before irreversible actions
- Branching logic (spam skip, approve/decline)
- Multi-destination output: Sheets logging + Gmail drafts in one run

---

## Setup

1. Import `gmail-triage.json` into n8n
2. Add credentials: Gmail OAuth2, Anthropic API, Google Sheets OAuth2
3. Set your Google Sheet ID in the Sheets node
4. Set your approval email address in the Human Approval node
5. Activate workflow

> Self-hosted n8n in Docker. Tested on n8n v1.x with Claude Haiku 5.5 (`claude-haiku-5-5`).
