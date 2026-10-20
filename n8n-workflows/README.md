# n8n workflows

Practice workflows from my n8n fundamentals sessions (Oct 20, 2026). Self-hosted n8n Community Edition in Docker. All use free public APIs, no credentials.

| File | What it does | Concepts |
|---|---|---|
| `01-webhook-basics.json` | Webhook receives a POST, Edit Fields adds `status: received`, Respond to Webhook sends it back | Webhook trigger, test vs production URL, custom response |
| `02-http-request-and-post.json` | GET live Barcelona weather (Open-Meteo), build `city`, `temp` and a sentence with expressions, POST to a test API | HTTP Request (GET/POST), JSON body, expressions |
| `03-json-and-lists.json` | GET 10 users from a test API, keep only `name` and `email` for each item | Arrays as items, Edit Fields, dropping fields |
| `04-weather-webhook-capstone.json` | POST `{"name": "Luca"}` to a webhook, fetch weather, reply `Hi Luca, it is X degrees in Barcelona` | Webhook, HTTP Request, cross-node expressions (`$('Webhook')`), Respond to Webhook |

## Try the capstone
1. In n8n: **Import from File**, pick `04-weather-webhook-capstone.json`.
2. Click **Execute workflow**.
3. Send a request:
   `Invoke-RestMethod -Method Post -Uri http://localhost:5678/webhook-test/weather -ContentType "application/json" -Body '{"name":"Luca"}'`

## Limits
Fundamentals only: no credentials, error handling or LLM steps yet. Those come in the Gmail triage project.
