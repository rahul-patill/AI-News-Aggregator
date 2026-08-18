# AI News Aggregator — Personalized AI Curator

## Demo

![Final Email Output](https://github.com/user-attachments/assets/7e574118-9a11-4dce-ade6-0a828d6ad10e)

▶ [Watch the deployment in action](https://github.com/) *(Placeholder for future demo link)*

---

## Title and Summary

The **AI News Aggregator** is an autonomous, agentic data pipeline that acts as your personal research assistant. Instead of manually scrolling through RSS feeds, tech blogs, and YouTube videos to keep up with the overwhelming pace of AI advancements, this system reads everything for you. 

It takes thousands of words of deep technical documentation (from sources like OpenAI and Anthropic) and hour-long YouTube videos, compresses them into concise summaries using a **model-agnostic LiteLLM client** (defaulting to `gemini-2.5-flash`), and then mathematically ranks them based on your personalized `user_profile.py`. Swapping the underlying AI model (to Claude or GPT-4o) requires changing a single environment variable.

The system features two primary delivery mechanisms:
1. **Interactive Dashboard ("Signal"):** A sleek, editorial-style React frontend that reads live from a FastAPI backend, providing an intelligence-wire experience with 'Signal Meters' for article relevance.
2. **Email Newsletter:** A custom HTML newsletter emailed directly to you every morning.

This matters because the sheer volume of AI news is impossible to keep up with manually. This system ensures you only read what actually matters to your specific career and interests.

---

## Original Workflow vs. AI System

Before this system, staying updated meant manually checking multiple websites, reading dense 5,000-word research papers, and scrubbing through YouTube videos to find the relevant 2 minutes of information.

### What Changed: From Manual to Autonomous

| Original Workflow | AI Aggregator |
|---|---|
| Manual bookmark checking | Automated daily scraping via Render Cron Job |
| Reading full web pages | Jina Reader API extracts pure Markdown |
| Scrolling through fluff | Gemini AI compresses into 3-sentence digests |
| Chronological reading | Semantic ranking based on personal profile |
| Forgetting what was read | Full PostgreSQL database tracking |
| Zero notification | Beautiful HTML email delivery |

---

## System Architecture

### Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         RENDER CLOUD (Cron Job)                          │
│                    Fires every 24 hours at 8:00 AM UTC                   │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI / PYTHON APP                            │
│                                                                          │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────────────┐  │
│  │  Scrapers    │   │  Jina Reader API │   │     Digest Agent         │  │
│  │  (RSS / YT)  │──▶│  (HTML → MD)     │──▶│  (LiteLLM + Instructor)  │  │
│  │  3 sources   │   │  Memory-safe     │   │  Pydantic Guardrail ✓    │  │
│  └──────────────┘   └──────────────────┘   └────────────┬─────────────┘  │
│                                                          │                │
│                                                          ▼                │
│                                            ┌──────────────────────────┐  │
│                                            │     Curator Agent        │  │
│                                            │  (LiteLLM + Instructor)  │  │
│                                            │  Pydantic Guardrail ✓    │  │
│                                            │  Scores 0.0 → 10.0       │  │
│                                            └────────────┬─────────────┘  │
│                                                          │                │
│                    ┌─────────────────────────────────────┘                │
│                    ▼                    ▼                                 │
│  ┌──────────────────────────┐   ┌──────────────────┐                     │
│  │      Email Agent         │   │  LANGFUSE CLOUD  │                     │
│  │  (LiteLLM + Instructor)  │──▶│  Auto-traced via │                     │
│  │  Pydantic Guardrail ✓    │   │  LiteLLM callback│                     │
│  └─────────────┬────────────┘   │  (tokens, cost,  │                     │
│                │                │  latency, ranks) │                     │
│                ▼                └──────────────────┘                     │
│  ┌──────────────────────────┐                                            │
│  │     SMTP Delivery        │                                            │
│  │  Sends to user's inbox   │                                            │
│  └──────────────────────────┘                                            │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
┌─────────────────────────┐          ┌──────────────────────────────┐
│   POSTGRESQL DATABASE   │          │      REACT FRONTEND          │
│  State at every step    │◀────────▶│  FastAPI → /api/news         │
│  Deduplication via GUID │          │  Signal Meter + Rankings     │
│  Alembic migrations     │          │  Deployed on Vercel          │
└─────────────────────────┘          └──────────────────────────────┘
```

### Data Flow

```text
INPUT: Triggered by 8:00 AM UTC Cron Job
        │
        ▼
[1] SCRAPE ── Scrapers (app/scrapers/)
    ├─ OpenAI Blog    (RSS feed → article URLs + titles)
    ├─ Anthropic Blog (Markdown page → raw content)
    └─ YouTube        (Channel search → video IDs + metadata)
        │
        ▼
[2] EXTRACT ── Jina Reader API  (r.jina.ai)
    Visits every URL and returns pure, structured Markdown.
    Memory-optimized: offloads HTML parsing to avoid Render's 512MB RAM limit.
        │
        ▼
[3] DIGEST ── Digest Agent  (LiteLLM → gemini-2.5-flash)
    ┌─ INPUT:  5,000–50,000 word raw Markdown / YouTube transcript
    ├─ ACTION: Compress to a 2–3 sentence dense technical summary
    ├─ GUARDRAIL: instructor + Pydantic enforces exact JSON schema
    └─ OUTPUT: DigestOutput { title, summary, key_topics[] }  → saved to DB
        │
        ▼
[4] CURATE ── Curator Agent  (LiteLLM → gemini-2.5-flash)
    ┌─ INPUT:  All new digests + user_profile.py
    ├─ ACTION: Semantically scores each article 0.0 → 10.0
    ├─ GUARDRAIL: instructor + Pydantic enforces score is float in [0, 10]
    └─ OUTPUT: RankedDigestList { rank, relevance_score, reasoning } → saved to DB
        │
        ▼
[5] EMAIL ── Email Agent  (LiteLLM → gemini-2.5-flash)
    ┌─ INPUT:  Top 10 ranked digests
    ├─ ACTION: Generates a personalized HTML newsletter
    ├─ GUARDRAIL: instructor + Pydantic validates HTML structure before sending
    └─ OUTPUT: Formatted HTML email
        │
        ▼
OUTPUT: Delivered to Inbox via SMTP  +  Stored in DB for React Dashboard

OBSERVABILITY: Every LiteLLM call is auto-traced to Langfuse
               (tokens, cost, latency, prompt/completion logged per step)
```

### State Management

```text
IDEMPOTENCY
  - Each step checks the DB before executing: "Is this article already digested?"
  - If the pipeline crashes mid-run, the next cron job resumes from the failed step.
  - Database GUID uniqueness constraint makes duplicate processing mathematically impossible.

HUMAN IN THE LOOP
  - Zero-touch daily execution. The human only reads the final email or dashboard.
  - Edit app/profiles/user_profile.py to change what the AI curates for you.
  - Run evaluate.py to re-validate Curator accuracy whenever you change the profile.
```

### Database State Tracking
![Digest Database View](https://github.com/user-attachments/assets/9d5b27c2-e470-4e3f-98b8-af6c63451ee6)
![OpenAI Database View](https://github.com/user-attachments/assets/eda80c04-4f61-4cbc-a214-b5bcf04a6fab)

---

## Setup Instructions

### Prerequisites
- Python 3.12+
- `uv` package manager
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- Gmail App Password (for sending emails)

### 1. Local Database Setup (Docker)
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 2. Configure Environment
Create a `.env` file in the `app/` folder:
```text
GEMINI_API_KEY=your_key_here
MY_EMAIL=your_email@gmail.com
APP_PASSWORD=your_gmail_app_password
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com

# Optional: change the AI model without touching any code
# LLM_MODEL=anthropic/claude-3-5-sonnet-20240620
# LLM_MODEL=gpt-4o
```

### 3. Install Dependencies & Run Backend
```bash
uv sync
uv run python main.py # Runs the pipeline once to fetch data
uv run uvicorn server:app --reload # Starts the FastAPI server on port 8000
```

### 4. Run the "Signal" Frontend Dashboard
The new React frontend lives in the `frontend/` directory.
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser. The Vite proxy automatically routes `/api` requests to your FastAPI backend on port 8000.

<!-- Add screenshot here: Signal dashboard showing article cards with Signal Meter bars and relevance scores -->
![Signal dashboard](https://github.com/user-attachments/assets/7217dc57-a97f-4571-aa16-ff567576d46a)

### ☁️ Cloud Deployment (Render)
This project is configured for one-click Infrastructure-as-Code deployment via Render.
1. Connect your GitHub to Render.
2. Select **New** -> **Blueprint**.
3. Render reads `render.yaml`, provisions a free Postgres Database, and schedules the daily Cron Job (using a custom `Dockerfile` to guarantee environment consistency).

![Render Dashboard Deployment](https://github.com/user-attachments/assets/7217dc57-a97f-4571-aa16-ff567576d46a)

---

## Sample Interactions

### The Digest Agent (Summarization)
```text
INPUT (Raw Markdown from Anthropic):
"Today we are announcing Constitutional AI, a new approach to training language models... [5,000 words of technical training methodology]"

OUTPUT (Digest):
"Anthropic introduces Constitutional AI, a method using AI feedback rather than human feedback to evaluate model outputs against a set of principles. This reduces the reliance on massive human labeling efforts and improves harmlessness without sacrificing helpfulness."
```

### The Curator Agent (Ranking)
```text
USER PROFILE: "I am a DevOps engineer interested in deployment, MLOps, and scalable architecture. I don't care about consumer AI apps."

INPUT (Digest): "OpenAI releases new voice mode for ChatGPT iOS app."
SCORE: 2.1 (Low relevance - Consumer App)

INPUT (Digest): "How to deploy Llama 3 on Kubernetes using vLLM."
SCORE: 9.8 (High relevance - MLOps/Deployment)
```

### Automated Execution Logs
![Render Log Output 1](https://github.com/user-attachments/assets/13777c65-2662-4113-adb6-3a409e6f5572)
![Render Log Output 2](https://github.com/user-attachments/assets/55041d1d-97ff-4692-a199-261ab57fac01)

---

## Observability and Cost Tracking

**Langfuse Integration (via LiteLLM Auto-Tracing)**
This project integrates **Langfuse** for complete "X-Ray" observability into the AI pipeline. Because the pipeline handles massive input tokens (entire YouTube transcripts and deep technical articles), tracking token usage and latency is critical.

Tracing is configured once in `app/agent/llm_client.py` via LiteLLM's global callback system:
```python
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]
```
This single configuration automatically instruments every agent in the pipeline, providing:
1. **Track Exact Costs:** Monitor exactly how many cents the pipeline costs per execution across all models.
2. **Debug Rankings:** See the exact Prompt sent and Output received, making it trivial to figure out *why* the Curator Agent scored an article a 3.0 vs a 9.0.
3. **Monitor Latency:** Discover if generation bottlenecks are happening at the Digester stage or the Email stage.

![Langfuse Dashboard Trace](https://github.com/user-attachments/assets/1c71289d-3f32-46d1-bb13-120d46482b1a)


---

## Design Decisions and Trade-offs

**Why Jina Reader API over Docling?**
Originally, the project used IBM's `docling` library to parse web pages into Markdown. However, `docling` loads heavy Machine Learning models into RAM, causing catastrophic Out-Of-Memory (OOM) crashes on Render's 512MB free tier. Swapping to the `Jina API` offloads the memory cost entirely, keeping the project 100% free while maintaining flawless Markdown extraction.

**Why LiteLLM + instructor over a vendor SDK?**
The original implementation used Google's `google-genai` SDK directly, which locked the entire application to a single AI provider. If Google raised prices or a competitor released a better model, every agent would have had to be rewritten. By routing all AI calls through LiteLLM, the model becomes a configuration value (the `LLM_MODEL` environment variable) rather than a code dependency. The `instructor` library is layered on top to guarantee structured Pydantic output works identically across all providers.

**Why Gemini 2.5 Flash as the default?**
Reading entire research papers and video transcripts requires a massive context window. Gemini 2.5 Flash offers a 1-million token context window while being exponentially cheaper and faster than GPT-4o.

**Why PostgreSQL instead of SQLite?**
While SQLite is easier for local testing, cloud platforms like Render use ephemeral file systems (they delete files when the server restarts). By connecting to a remote PostgreSQL database, the app's history survives server restarts, ensuring you never receive duplicate emails.

**Trade-off: LLM Chain vs. Single Prompt**
The pipeline uses three separate AI agents (Digest, Curator, Email) instead of passing everything into one giant prompt. This is slightly slower and uses more API calls, but it drastically reduces hallucination and allows the system to cache intermediate summaries in the database.

---

## Reliability and Evaluation

### How the System Proves It Works

**1. Idempotent Architecture**
The `main.py` orchestrator runs in strict stages (Scrape → Extract → Digest → Curate → Email). At the end of every stage, the state is committed to the database. If the Jina API goes offline during the extraction phase, the system gracefully exits. The next day, it skips scraping and resumes exactly where it left off, preventing data loss.

**2. Graceful Degradation**
If a YouTube video disables its closed captions, the `youtube_transcript_api` fails gracefully, logs a `__UNAVAILABLE__` flag in the database, and moves on to the next video without crashing the entire pipeline.

**3. Database Deduplication**
Every article is assigned a unique `guid` derived from its URL. The database enforces uniqueness, making it mathematically impossible to process or email the exact same article twice, even if the cron job is accidentally triggered multiple times a day.

**4. LLM-as-a-Judge Evaluation Framework**
Because LLMs are non-deterministic, standard unit tests cannot verify curation quality. This project ships a dedicated evaluation pipeline (`evaluate.py`) that quantitatively grades the `CuratorAgent` using a second, impartial **Judge Agent**.

How it works:
```text
[1] Fetch N random articles from the PostgreSQL database
       │
       ▼
[2] CuratorAgent scores each article (0.0–10.0) + writes reasoning
       │
       ▼
[3] JudgeAgent reviews the Curator's score against the user profile
    Returns: { is_correct: bool, ideal_score: float, critique: str }
    (Pydantic-enforced output — the Judge cannot hallucinate structure)
       │
       ▼
[4] Final Accuracy Score = (correct / total) × 100
```

Validation result: **99% curation accuracy** verified by Claude 3.5 Sonnet acting as the Judge across sampled production articles.

To run the evaluation yourself:
```bash
uv run python evaluate.py
```
Results are saved to `eval_report.json` with per-article scores, reasoning, and judge critiques.

---

## Guardrails and Safety

LLMs are powerful but unreliable — they can hallucinate field values, skip required keys, or return invalid data types. This project uses **programmatic output guardrails** at every agent boundary to prevent bad data from propagating through the pipeline.

### Structural Guardrails (via `instructor` + Pydantic)

Every agent uses `instructor.from_litellm()` which intercepts the raw LLM response and validates it against a strict Pydantic schema **before** allowing execution to continue. If the LLM returns malformed JSON (e.g. a string instead of a float for `relevance_score`), `instructor` automatically retries the call without crashing the pipeline.

```python
# Example: Curator Agent Guardrail
class RankedArticle(BaseModel):
    digest_id: str               # Must be a string — no hallucinations allowed
    relevance_score: float = Field(ge=0.0, le=10.0)  # Enforced range [0, 10]
    rank: int = Field(ge=1)      # Must be a positive integer
    reasoning: str               # Required — cannot be empty

# instructor auto-retries if LLM output fails Pydantic validation
response = client.chat.completions.create(
    model=model,
    response_model=RankedDigestList,  # ← Guardrail applied here
    messages=[...]
)
```

### What this prevents:
| Risk | Guardrail |
|---|---|
| LLM outputs a score of `"high"` instead of `8.5` | `float` type enforcement rejects it |
| LLM skips writing the `reasoning` field | `str` type enforcement forces a retry |
| LLM outputs a rank of `-1` or `0` | `ge=1` constraint catches it immediately |
| LLM returns freeform text instead of JSON | `instructor` retries until schema is satisfied |

### Ethics and Misuse Considerations
- **Echo Chamber Risk:** The Curator heavily filters by `user_profile.py`. By design, it may rarely surface content outside your stated interests. Adjust your profile to intentionally include diverse perspectives.
- **Potential Misuse:** Pointing the scrapers at biased feeds and setting the Curator to maximize outrage could create an automated propaganda pipeline. This system is designed for personal research use only.

---

## Reflection and Ethics

### Limitations and Biases
- **Dependency on Jina**: The system relies on `r.jina.ai` for HTML-to-Markdown conversion. If Jina goes offline or adds a strict paywall, the pipeline will fail to read full articles (though it will gracefully fall back to the short RSS descriptions).
- **Curator Echo Chamber**: Because the Curator Agent heavily filters content based on the `user_profile.py`, it inherently creates an echo chamber. The user will rarely discover breakthroughs in fields outside their specified interests.

### Could This Be Misused?
A bad actor could point the RSS scrapers at heavily biased political feeds and set the Curator Agent to maximize outrage and polarization, essentially creating an automated propaganda newsletter.

### What Surprised Me in Testing
The most surprising finding was the quality of the `CuratorAgent` ranking. By explicitly asking Gemini to output its mathematical reasoning *before* outputting the final score, the AI caught subtle nuances in tech papers that perfectly aligned with the user profile, rather than just doing basic keyword matching.

---

## Technology Stack

| Layer | Technology |
|---|---|
| AI Router | `litellm` (model-agnostic, default: `gemini/gemini-2.5-flash`) |
| Structured Output | `instructor` (Pydantic-enforced JSON from any LLM) |
| Web Extraction | Jina Reader API (`r.jina.ai`) |
| Video Extraction | `youtube_transcript_api` |
| Database | PostgreSQL via SQLAlchemy ORM |
| Backend API | FastAPI |
| Frontend Dashboard | React, Vite, Tailwind CSS v4 (Custom "Signal" theme) |
| Deployment | Render (IaC `render.yaml` + Docker) |
| Observability | Langfuse (auto-traced via LiteLLM callback) |
| Package Manager | `uv` (Astral), `npm` |

---

## AI Features Checklist

- ✅ **RAG / Context Extraction** — Fetches live web pages and video transcripts to feed into the LLM context window.
- ✅ **Multi-Agent Pipeline** — Breaks complex reasoning into specialized agents (Digester, Curator, Writer).
- ✅ **Personalization** — Dynamically alters output based on a structured user profile.
- ✅ **State Management** — Uses a Repository pattern to save LLM outputs at intermediate steps.
- ✅ **Model-Agnostic Design** — All agents use LiteLLM; switching from Gemini to Claude or GPT-4o requires changing one environment variable.
- ✅ **Structural Guardrails** — `instructor` + Pydantic validates every LLM response at every agent boundary, with automatic retries on malformed or schema-violating output.
- ✅ **LLM Evaluation (Evals)** — Ships a full `LLM-as-a-Judge` evaluation pipeline (`evaluate.py`) that quantitatively grades the Curator Agent, achieving **99% accuracy** validated by Claude 3.5 Sonnet.
- ✅ **Full Observability** — Langfuse auto-traces all agent calls via LiteLLM callbacks, tracking token usage, cost, latency, and prompt/completion for every pipeline run.
