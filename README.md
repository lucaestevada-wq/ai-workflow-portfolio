# AI Workflow Portfolio — Luca Estevada

Automation and AI pipeline engineering. Focus: creative-ops workflows (video, content, media) + business-process automation.

## Stack
- **Orchestration**: n8n, Python, ffmpeg
- **AI/LLM**: Claude API (vision + text), OpenAI API (file_search, vector stores), Whisper (local)
- **Motion/Video**: Remotion (React-based), ffmpeg pipelines
- **Other**: RAG, JSON schema validation, Discord.py, structured LLM output

---

## Projects

### 1. [Shorts Caption Pipeline](./shorts-caption-pipeline/)
Automated vertical-video captioning pipeline. Audio-onset timing via RMS energy detection, Whisper transcript alignment, dynamic programming word assignment, ffmpeg render with styled captions. Zero manual timing adjustments.

**Proves**: local model integration, audio signal processing, pipeline automation, Python orchestration.

### 2. [ArtForge — Case Study](./artforge-case-study.md)
Production Discord bot delivering AI-powered art critique grounded in a 300+ book library via RAG. Multi-model pipeline, schema-validated structured output, tiered credit economy, live beta users.

**Proves**: RAG design, multi-model orchestration, structured LLM output, stateful service architecture.

### 3. Remotion Motion Graphics Pipeline *(coming soon)*
Code-based motion graphics using React/Remotion. Programmatic animation, brand-consistent asset generation.

---

## In Progress
- n8n automation workflows (Phase 1)
- Content repurposing pipeline: video → transcript → shorts (Phase 2)
- Business ops automation: email triage → CRM → human review loop (Phase 3)
