# AI News Aggregator - Live Build Repository

This repository accompanies my 3-hour live coding session where I build a complete AI-powered news aggregator from scratch. This is a **private repository** containing valuable implementation details and deployment strategies used in production environments.

## Project Structure

This project is organized across three branches, each corresponding to a different phase of the build:

- **`master`** - Part 1: Local setup and core functionality
- **`deployment`** - Part 2: Deployment configuration and infrastructure
- **`deployment-final`** - Part 3: Final optimizations and production-ready changes

Each branch serves as an intermediate checkpoint, allowing you to reference the exact state of the codebase at any point during the video.

## How This Video Works

This is a **live coding build**, not a traditional step-by-step tutorial. Here's what to expect:

- **Fast-paced development** - I code at my natural pace, leveraging AI tools extensively
- **AI-assisted workflow** - You won't see every code snippet or file generation in real-time
- **Real-world approach** - This condenses 20-40 hours of learning into a single session
- **Not cookie-cutter** - Unlike structured tutorials, this reflects how coding actually happens in practice

## How to Follow Along

### Recommended Approach (Maximum Learning)

1. **Clone this repository** before starting the video
2. **Keep a local copy ready** on your system as you code along
3. **Use intermediate checkpoints** - When I make major updates or run tests, pause and:
   - Reference the corresponding branch in this repository
   - Copy relevant code snippets into your project
   - Use AI coding assistants to help you reach the same checkpoint
4. **Iterate step-by-step** - Don't rush ahead. Ensure each phase works before moving forward
5. **Expect confusion** - Some parts will move fast and may not be immediately clear. This is where real learning happens

### Alternative Approach (Not Recommended)

You can skip ahead to the `deployment-final` branch and try to get everything working, but you'll miss the iterative problem-solving process that makes this valuable.

## Why This Approach?

Traditional tutorials show you the "right way" to do things. This video shows you the **real way** - with AI assistance, rapid iteration, debugging, and adapting on the fly. By following along and hitting the same checkpoints, you'll:

- Learn how to effectively leverage AI coding tools
- Understand the thought process behind architectural decisions
- Experience real-world development workflows
- Build muscle memory through hands-on practice

**The most valuable learning happens when you struggle, reference the code, and push through to the next checkpoint.**

---

## Application Data Flow (How It Works)

If you are trying to understand the exact sequence of events when the application runs, here is the complete top-to-bottom pipeline:

### 1. The Trigger (`main.py`)
This is the entry point. You run `python main.py`, and it immediately hands control over to the orchestrator.

### 2. The Orchestrator (`app/daily_runner.py`)
This file is the manager. It doesn't do the heavy lifting itself, but it calls the following steps in perfect order, ensuring each one finishes before moving on.

### 3. Step 1: Scraping (`app/runner.py` & `app/scrapers/`)
The app reaches out to the RSS feeds (OpenAI, Anthropic) and YouTube channels. It grabs the raw URLs, titles, and basic descriptions, and saves them to the database.

### 4. Step 2 & 3: Deep Extraction (`app/services/process_anthropic.py` & `app/services/process_youtube.py`)
Because the RSS feeds only gave us tiny snippets, these services visit the actual web pages. They download the massive full-text Markdown for articles and the hidden Closed Captions for YouTube videos.

### 5. Step 4: AI Summarization (`app/services/process_digest.py` & `app/agent/digest_agent.py`)
Now that we have massive walls of text, we hand them to the Gemini AI (the **DigestAgent**). The AI acts as an analyst, reading thousands of words and compressing them into 2-3 sentence summaries (Digests).

### 6. Step 5: Curation & Ranking (`app/services/process_curator.py` & `app/agent/curator_agent.py`)
We don't want to spam the user with 50 articles. The **CuratorAgent** reads your personal `app/profiles/user_profile.py`, looks at all the summaries generated today, and ranks them by assigning a relevance score from 0.0 to 10.0.

### 7. Step 6: Final Delivery (`app/services/process_email.py` & `app/agent/email_agent.py`)
The **EmailAgent** takes the Top 10 highest-ranked articles, writes a warm, personalized introduction, formats everything into a beautiful HTML newsletter, and fires it off to your inbox using `app/services/email.py`.

### 🗄️ The Backbone (`app/database/repository.py`)
Throughout every single step above, the code constantly talks to the Repository. The repository acts as a librarian, saving state at every micro-step so that if the power goes out, the app picks up exactly where it left off!
