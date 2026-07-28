# 🤖 AI News Aggregator

![Python Version](https://img.shields.io/badge/python-3.12+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange)

An intelligent, fully-automated news aggregation pipeline that scrapes the web for the latest AI research and news, summarizes it using Google's Gemini models, and delivers a highly personalized daily newsletter directly to your inbox.

---

## ✨ Features

- **Multi-Source Scraping**: Automatically monitors RSS feeds (OpenAI, Anthropic) and YouTube channels.
- **Deep Content Extraction**: Uses `docling` to strip away web clutter and extract pure Markdown from articles, and `youtube_transcript_api` to securely fetch hidden closed captions from videos.
- **AI Summarization**: Leverages `gemini-2.5-flash` to read thousands of words of technical documentation and compress them into actionable 2-3 sentence summaries.
- **Personalized Curation**: Analyzes your specific user profile (background, expertise, and interests) to rank articles from 1 to 10 based on how relevant they are to *you*.
- **Automated Newsletter**: Assembles the top-ranked articles into a beautiful HTML email with an AI-generated personalized greeting.
- **Resilient Architecture**: Uses the Repository Pattern with PostgreSQL to save state at every micro-step, ensuring no API calls are wasted if the pipeline crashes.

---

## 🛠️ Tech Stack

- **Core**: Python 3.12+
- **AI Models**: Google GenAI SDK (`gemini-2.5-flash`)
- **Database**: PostgreSQL (containerized via Docker) & SQLAlchemy (ORM)
- **Data Extraction**: BeautifulSoup4, Docling, YouTube Transcript API
- **Package Management**: `uv`

---

## 🏗️ Application Data Flow (How It Works)

If you are trying to understand the exact sequence of events when the application runs, here is the complete top-to-bottom pipeline:

1. **The Trigger (`main.py`)**: The entry point. You run `python main.py`, and it hands control to the orchestrator.
2. **The Orchestrator (`app/daily_runner.py`)**: Manages the 6 sequential steps so they run in perfect order.
3. **Step 1 (Scraping)**: Reaches out to RSS feeds and YouTube to grab raw URLs and basic metadata.
4. **Step 2 & 3 (Deep Extraction)**: Visits actual web pages and APIs to download massive full-text Markdown and video transcripts.
5. **Step 4 (AI Summarization)**: The Gemini AI acts as an analyst, compressing the massive text into 2-3 sentence summaries.
6. **Step 5 (Curation & Ranking)**: The Curator Agent reads your personal profile and ranks all the daily summaries by assigning a relevance score (0.0 to 10.0).
7. **Step 6 (Final Delivery)**: The Email Agent takes the Top 10 highest-ranked articles, writes a warm introduction, formats everything into HTML, and fires it off via SMTP.

> 🗄️ **The Backbone**: Throughout every single step above, the code constantly talks to `app/database/repository.py`. The repository acts as a librarian, saving state at every micro-step (Idempotency) so that if the power goes out, the app picks up exactly where it left off!

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (for blazing fast dependency management)
- Docker Desktop (for the PostgreSQL database)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd ai-news-aggregator
uv sync
```

### 3. Environment Setup
Copy the example environment file and fill in your secrets:
```bash
cp app/example.env .env
```
Ensure you have the following filled out in your `.env`:
- `GEMINI_API_KEY`: Get this from Google AI Studio.
- `MY_EMAIL` / `APP_PASSWORD`: For the SMTP newsletter delivery.

### 4. Database Setup
Spin up the PostgreSQL database using Docker:
```bash
cd docker
docker-compose up -d
```
Then, generate the database tables:
```bash
python -m app.database.create_tables
```

---

## 💻 Usage

To run the full daily pipeline (Scrape -> Extract -> Summarize -> Rank -> Email):
```bash
python main.py
```

To run individual services for testing:
```bash
# Only run the scrapers
python -m app.runner

# Only run the AI summarizer
python -m app.services.process_digest

# Only run the personalized curator
python -m app.services.process_curator
```

---

## ☁️ Cloud Deployment (Render)

This project includes a `render.yaml` file for zero-touch cloud deployment using [Render](https://render.com). It spins up a free-tier Managed PostgreSQL database and a Cron Job that executes the pipeline automatically every 24 hours.

1. Create a free account on [Render](https://render.com).
2. Go to your Render Dashboard and click **New** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file.
5. In the Render Dashboard, you will be prompted to fill in your 3 environment variables: `GEMINI_API_KEY`, `MY_EMAIL`, and `APP_PASSWORD`.
6. Click **Apply**. 

Render will instantly build your database and schedule the `main.py` task to run daily!
