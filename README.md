# AI News Aggregator — Personalized AI Curator

## Demo

![Final Email Output](https://github.com/user-attachments/assets/7e574118-9a11-4dce-ade6-0a828d6ad10e)

▶ [Watch the deployment in action](https://github.com/) *(Placeholder for future demo link)*

---

## Title and Summary

The **AI News Aggregator** is an autonomous, agentic data pipeline that acts as your personal research assistant. Instead of manually scrolling through RSS feeds, tech blogs, and YouTube videos to keep up with the overwhelming pace of AI advancements, this system reads everything for you. 

It takes thousands of words of deep technical documentation (from sources like OpenAI and Anthropic) and hour-long YouTube videos, compresses them into concise summaries using **Gemini-2.5-Flash**, and then mathematically ranks them based on your personalized `user_profile.py`. 

The system now features two primary delivery mechanisms:
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
┌─────────────────────────────────────────────────────────────────┐
│                     RENDER CLOUD (Cron Job)                     │
│               Fires every 24 hours at 8:00 AM UTC               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FASTAPI / PYTHON APP                      │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │ Scrapers    │    │ Extraction   │    │  Digest Agent    │──┐ │
│  │ (RSS / YT)  │    │ (Jina API)   │    │  (Gemini LLM)    │  │ │
│  │ fetch URLs  │    │ HTML → MD    │    │ MD → Summary     │  │ │
│  └──────┬──────┘    └──────┬───────┘    └────────┬─────────┘  │ │
│         └──────────────────┴─────────────────────┘            │ │
│                            │                                  │ │
│                            ▼                                  │ │
│                  ┌─────────────────┐                          │ │
│                  │  Curator Agent  │──┐                       │ │
│                  │  (Gemini LLM)   │  │                       │ │
│                  └────────┬────────┘  │                       │ │
│                           ▼           │  ┌──────────────────┐ │ │
│                  ┌─────────────────┐  │  │ LANGFUSE CLOUD   │ │ │
│                  │   Email Agent   │──┼─▶│ Traces prompts,  │◀┘ │
│                  │  (Gemini LLM)   │  │  │ tokens, latency, │   │
│                  └────────┬────────┘  │  │ & total costs    │   │
│                           ▼           │  └──────────────────┘   │
│          ┌────────────────────────────────┐                     │
│          │  SMTP Delivery                 │                     │
│          │  Sends to user's inbox         │                     │
│          └────────────────────────────────┘                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                          │
│  Tracks state at every micro-step to prevent duplicate emails   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```text
INPUT: Triggered by 8:00 AM Cron Job
        │
        ▼
[1] Scrapers (app/scrapers/) ───────────────── RSS & YouTube APIs
    Fetches raw URLs, Titles, and Metadata
        │
        ▼
[2] Deep Extraction (app/services/) ────────── Jina Reader API
    Visits the URL and extracts pure, clean Markdown text.
    (Memory optimized to bypass Render's 512MB RAM limits)
        │
        ▼
[3] Digest Agent (app/agent/digest_agent.py) ─ Gemini-2.5-Flash
    Reads 5,000+ word technical papers.
    Compresses into a 2-3 sentence dense summary.
    (Async: Streams prompt & tokens to Langfuse)
        │
        ▼
[4] Curator Agent (app/agent/curator_agent.py) Gemini-2.5-Flash
    Cross-references the summary against user_profile.py.
    Scores relevance from 0.0 to 10.0.
    (Async: Streams prompt & tokens to Langfuse)
        │
        ▼
[5] Email Agent (app/agent/email_agent.py) ─── Gemini-2.5-Flash
    Generates a personalized introduction.
    Formats the Top 10 highest-ranked articles into HTML.
    (Async: Streams prompt & tokens to Langfuse)
        │
        ▼
OUTPUT: Delivered to Inbox via SMTP
```

### Where Humans and Testing Are Involved

```text
HUMAN IN THE LOOP
  - Zero-touch daily execution. The human only interacts by reading the final email.
  - The human can edit `app/profiles/user_profile.py` to change what the AI curates.

STATE MANAGEMENT
  - The Repository (`app/database/repository.py`) saves state at every single step.
  - If the API crashes on step 3, the next cron job resumes exactly at step 3.
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

**Langfuse Integration**
This project integrates the **Langfuse V4 SDK** to provide complete "X-Ray" observability into the AI pipeline. Because the pipeline handles massive input tokens (entire YouTube transcripts and deep technical articles), tracking token usage and latency is critical.

Every AI Agent is wrapped in a Langfuse Context Manager (`langfuse.start_as_current_observation`), which allows you to:
1. **Track Exact Costs:** Monitor exactly how many cents the pipeline costs per execution by extracting native Gemini token metrics.
2. **Debug Rankings:** See the exact Prompt sent and Output received, making it trivial to figure out *why* the Curator Agent scored an article a 3.0 vs a 9.0.
3. **Monitor Latency:** Discover if generation bottlenecks are happening at the Digester stage or the Email stage.

![Langfuse Dashboard Trace](https://github.com/user-attachments/assets/1c71289d-3f32-46d1-bb13-120d46482b1a)

---

## Design Decisions and Trade-offs

**Why Jina Reader API over Docling?**
Originally, the project used IBM's `docling` library to parse web pages into Markdown. However, `docling` loads heavy Machine Learning models into RAM, causing catastrophic Out-Of-Memory (OOM) crashes on Render's 512MB free tier. Swapping to the `Jina API` offloads the memory cost entirely, keeping the project 100% free while maintaining flawless Markdown extraction.

**Why Gemini 2.5 Flash?**
Reading entire research papers and video transcripts requires a massive context window. Gemini 2.5 Flash offers a 1-million token context window while being exponentially cheaper and faster than GPT-4o. 

**Why PostgreSQL instead of SQLite?**
While SQLite is easier for local testing, cloud platforms like Render use ephemeral file systems (they delete files when the server restarts). By connecting to a remote PostgreSQL database, the app's history survives server restarts, ensuring you never receive duplicate emails.

**Trade-off: LLM Chain vs. Single Prompt**
The pipeline uses three separate AI agents (Digest, Curator, Email) instead of passing everything into one giant prompt. This is slightly slower and uses more API calls, but it drastically reduces hallucination and allows the system to cache intermediate summaries in the database.

---

## Reliability and Evaluation

### How the System Proves It Works

**1. Idempotent Architecture**
The `main.py` orchestrator runs in strict stages (Scrape -> Extract -> Digest -> Curate -> Email). At the end of every stage, the state is committed to the database. If the Jina API goes offline during the extraction phase, the system gracefully exits. The next day, it skips scraping and resumes exactly where it left off, preventing data loss.

**2. Graceful Degradation**
If a YouTube video disables its closed captions, the `youtube_transcript_api` fails gracefully, logs a `__UNAVAILABLE__` flag in the database, and moves on to the next video without crashing the entire pipeline.

**3. Database Deduplication**
Every article is assigned a unique `guid` derived from its URL. The database enforces uniqueness, making it mathematically impossible to process or email the exact same article twice, even if the cron job is accidentally triggered multiple times a day.

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
| AI Engine | Gemini-2.5-Flash (via `google-genai` SDK) |
| Web Extraction | Jina Reader API (`r.jina.ai`) |
| Video Extraction | `youtube_transcript_api` |
| Database | PostgreSQL via SQLAlchemy ORM |
| Backend API | FastAPI |
| Frontend Dashboard | React, Vite, Tailwind CSS v4 (Custom "Signal" theme) |
| Deployment | Render (IaC `render.yaml` + Docker) |
| Observability | Langfuse (V4 SDK) |
| Package Manager | `uv` (Astral), `npm` |

---

## AI Features Checklist

- ✅ **RAG / Context Extraction** — Fetches live web pages and video transcripts to feed into the LLM context window.
- ✅ **Multi-Agent Pipeline** — Breaks complex reasoning into specialized agents (Digester, Curator, Writer).
- ✅ **Personalization** — Dynamically alters output based on a structured user profile.
- ✅ **State Management** — Uses a Repository pattern to save LLM outputs at intermediate steps.
