# Technical Interview Preparation — AI News Aggregator

> All answers are grounded in actual implementation. File paths, function names, class names, and environment variables referenced below are exactly as they exist in this repository.

---

## Section 1: High-Level Architecture & System Design

---

### Q1. Describe this system end-to-end. What problem does it solve, and what is the overall architecture?

**Problem:**
The AI news landscape produces hundreds of articles, research papers, and YouTube videos daily. Manually filtering these down to the 10 most relevant items for a specific professional profile (e.g., an AI Engineer focused on LLMs, RAG, and production systems) takes 1-2 hours per day. This system reduces that to zero manual effort.

**Architecture:**
The system is a two-plane architecture:

**Plane 1 - The Data Pipeline (batch, runs once daily):**
```
Cron Trigger (Render, 8:00 AM UTC)
  -> run_scrapers()                 [app/runner.py]
  -> process_anthropic_markdown()   [app/services/process_anthropic.py]
  -> process_youtube_transcripts()  [app/services/process_youtube.py]
  -> process_digests()              [app/services/process_digest.py]
  -> send_digest_email()            [app/services/process_email.py]
```

**Plane 2 - The Read API (stateless, always-on):**
```
FastAPI server [server.py]
  GET /api/news    -> Repository.get_top_curated_digests()
  GET /api/profile -> returns USER_PROFILE dict
React Frontend (Vercel) -> calls /api/news
```

The two planes share exactly one thing: a PostgreSQL database on Render. The pipeline writes; the API reads. They never directly communicate with each other.

---

### Q2. Walk through each module, service, and layer. What are the data and control flow boundaries?

**Entry Points:**
- `main.py` — Thin wrapper. Parses optional CLI args (hours, top_n), calls run_daily_pipeline(), exits with code 0/1 based on result.
- `server.py` — FastAPI app. Exposes two GET routes. Uses SQLAlchemy Depends pattern for session injection.

**Orchestration:**
- `app/daily_runner.py` — The pipeline coordinator. Calls each service in strict sequential order. Wraps everything in a try/except. Tracks a results dict with timestamps and per-stage counts.

**Scrapers (app/scrapers/):**
- `youtube.py` — YouTubeScraper reads YouTube RSS feeds at https://www.youtube.com/feeds/videos.xml?channel_id={id}. Filters by hours cutoff. Skips Shorts (/shorts/ in URL). Calls youtube_transcript_api for each video.
- `openai.py` — OpenAIScraper reads https://openai.com/news/rss.xml. Filters by time.
- `anthropic.py` — AnthropicScraper reads 3 third-party GitHub-hosted RSS mirrors. Uses in-memory seen_guids set to deduplicate across feeds.

**Services (app/services/):**
- `process_anthropic.py` — Fetches articles from DB where markdown IS NULL. Calls Jina Reader API. Updates DB.
- `process_youtube.py` — Fetches videos from DB where transcript IS NULL. Calls get_transcript(). If disabled, writes __UNAVAILABLE__ sentinel so it is never retried.
- `process_digest.py` — Fetches all articles without a Digest row. Calls DigestAgent.generate_digest(). Saves to DB.
- `process_email.py` — Fetches recent digests. Calls CuratorAgent.rank_digests(). Writes scores/ranks to DB. Sends email.

**Agents (app/agent/):**
- `llm_client.py` — Single shared factory. Returns instructor.from_litellm(litellm.completion). DEFAULT_MODEL reads LLM_MODEL env var.
- `digest_agent.py` — Truncates content to 8,000 chars. Returns DigestOutput(title, summary).
- `curator_agent.py` — Takes full USER_PROFILE dict in constructor. Builds system prompt at init. Returns RankedDigestList.
- `email_agent.py` — Generates greeting/introduction via LLM. Has hard-coded fallback if LLM fails.
- `judge_agent.py` — Used only by evaluate.py. Returns JudgeEvaluation(is_correct, ideal_score, critique).

**Database (app/database/):**
- `connection.py` — Checks for DATABASE_URL env var first (Render injects this). Falls back to POSTGRES_* vars for local dev.
- `models.py` — 4 SQLAlchemy models: YouTubeVideo, OpenAIArticle, AnthropicArticle, Digest.
- `repository.py` — Repository class. All DB reads/writes go through here. 16 public methods.

---

### Q3. Why were these specific frameworks and libraries chosen over alternatives?

| Decision | Chosen | Alternative Rejected | Reason |
|---|---|---|---|
| LLM Router | litellm | Native google-genai SDK | Provider lock-in. Switching model requires one env var change, not rewriting every agent |
| Structured Output | instructor | Raw JSON parsing | LLMs routinely hallucinate JSON. instructor wraps every call in Pydantic validation with auto-retry |
| Default Model | gemini/gemini-2.5-flash | gpt-4o, claude-3-5-sonnet | 1M token context window needed for 50,000-word transcripts. Exponentially cheaper for daily batch use |
| HTML->Markdown | Jina Reader API | docling, BeautifulSoup | docling loads local ML models consuming 2-4GB RAM, crashing Render 512MB free tier |
| Web Framework | FastAPI | Flask, Django | Auto-generated OpenAPI docs. Built-in Depends() for DB session injection |
| Database | PostgreSQL | SQLite | Render uses ephemeral filesystems. SQLite files disappear on restart |
| Package Manager | uv | pip, poetry | 10-100x faster installs. Deterministic lockfile (uv.lock). First-class Docker integration |
| RSS for YouTube | feedparser + YouTube RSS | YouTube Data API v3 | YouTube RSS feed is free, no quota, no API key required |

---

## Section 2: Deep Dive - Core Logic & Workflows

---

### Q4. How is application state modeled and passed between stages?

There is no in-memory state passed between stages. The database IS the state machine. Each stage reads from DB using a NULL-checking pattern:

```
Stage 1 (Scrape):  Writes YouTubeVideo(transcript=None), OpenAIArticle, AnthropicArticle
Stage 2 (Markdown): SELECT * FROM anthropic_articles WHERE markdown IS NULL -> updates markdown
Stage 3 (Transcript): SELECT * FROM youtube_videos WHERE transcript IS NULL -> updates transcript
Stage 4 (Digest): Python set of existing digest IDs -> filters all 3 source tables -> writes Digest rows
Stage 5 (Email): SELECT * FROM digests WHERE created_at >= NOW() - INTERVAL N hours
                 -> ranks -> writes relevance_score/rank/reasoning -> sends email
```

If the pipeline crashes at Stage 3, the next execution automatically resumes at Stage 3 (Stage 1 and 2 data is already committed). This is idempotency by database-state, not by retry logic.

---

### Q5. Walk through the lifecycle of a single YouTube video from scrape to email.

```
1. YouTubeScraper.get_latest_videos(channel_id, hours=24)
   -> HTTP GET YouTube RSS feed
   -> feedparser.parse() -> List[ChannelVideo]
   -> Filters: published_at >= NOW() - 24h, skips /shorts/ URLs

2. runner.run_scrapers() -> repo.bulk_create_youtube_videos(video_dicts)
   -> Checks: SELECT * FROM youtube_videos WHERE video_id = ?
   -> If not found, INSERT. transcript=None at this point.

3. process_youtube_transcripts() -> repo.get_youtube_videos_without_transcript()
   -> SELECT * FROM youtube_videos WHERE transcript IS NULL
   -> YouTubeTranscriptApi.fetch(video_id) -> joins snippet.text values
   -> UPDATE youtube_videos SET transcript = ? WHERE video_id = ?

4. process_digests() -> repo.get_articles_without_digest()
   -> Loads ALL existing digest IDs into Python set()
   -> Queries videos WHERE transcript IS NOT NULL AND transcript != "__UNAVAILABLE__"
   -> DigestAgent.generate_digest(title, content[:8000], "youtube")
   -> repo.create_digest() with Digest.id = "youtube:{video_id}"

5. send_digest_email() -> repo.get_recent_digests(hours=72)
   -> CuratorAgent.rank_digests(all_digests) - single LLM call for all articles
   -> repo.update_digest_curation(digest_id, score, rank, reasoning)
   -> EmailAgent.generate_introduction(top_10_articles)
   -> digest_to_html(email_digest) -> HTML string
   -> smtplib.SMTP_SSL("smtp.gmail.com", 465).sendmail(...)
```

---

### Q6. How are external services authenticated and managed?

| Service | Auth Method | Code Location |
|---|---|---|
| Gemini API | GEMINI_API_KEY env var, read by litellm automatically | .env |
| Jina Reader API | None (public at basic tier) | anthropic.py:url_to_markdown() |
| YouTube Transcript API | Optional proxy via PROXY_USERNAME / PROXY_PASSWORD | youtube.py:__init__() |
| Gmail SMTP | MY_EMAIL + APP_PASSWORD (Gmail App Password) | email.py:send_email() |
| PostgreSQL | DATABASE_URL (Render-injected) or POSTGRES_* vars | connection.py:get_database_url() |
| Langfuse | LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST | .env |

No API keys are hardcoded anywhere. All secrets are env vars loaded via python-dotenv.

---

## Section 3: Edge Cases, Failure Handling & Reliability

---

### Q7. What happens if the Jina Reader API returns a non-200 status code?

In app/scrapers/anthropic.py, url_to_markdown():

```python
def url_to_markdown(self, url: str) -> Optional[str]:
    try:
        response = requests.get(f"https://r.jina.ai/{url}")
        if response.status_code == 200:
            return response.text
        return None          # silently returns None on any non-200
    except Exception as e:
        print(f"Error fetching markdown from Jina: {e}")
        return None
```

In process_anthropic.py, the caller handles None:

```python
markdown = scraper.url_to_markdown(article.url)
if markdown:
    repo.update_anthropic_article_markdown(article.guid, markdown)
    processed += 1
else:
    failed += 1   # article stays with markdown=None in DB
```

Result: The article remains with markdown IS NULL. The next cron job will retry it automatically since get_anthropic_articles_without_markdown() will pick it up again. Jina failures self-heal on the next day without any explicit retry logic.

Weakness: No exponential backoff, no retry on transient failures (502, 503), no alerting on extended Jina failure.

---

### Q8. What happens if a YouTube video has transcripts disabled?

In app/services/process_youtube.py:

```python
TRANSCRIPT_UNAVAILABLE_MARKER = "__UNAVAILABLE__"

for video in videos:
    try:
        transcript_result = scraper.get_transcript(video.video_id)
        if transcript_result:
            repo.update_youtube_video_transcript(video.video_id, transcript_result.text)
        else:
            repo.update_youtube_video_transcript(video.video_id, TRANSCRIPT_UNAVAILABLE_MARKER)
    except Exception as e:
        repo.update_youtube_video_transcript(video.video_id, TRANSCRIPT_UNAVAILABLE_MARKER)
```

The video gets transcript = "__UNAVAILABLE__" written to DB. The get_articles_without_digest() query explicitly filters these:

```python
YouTubeVideo.transcript.isnot(None),      # excludes NULL (unprocessed)
YouTubeVideo.transcript != "__UNAVAILABLE__"  # excludes permanent failures
```

And get_youtube_videos_without_transcript() uses is_(None) which matches only SQL NULL, not the string value. So marked videos are permanently excluded and never retried. This is intentional since transcripts are disabled at the channel owner level.

---

### Q9. What happens if the LLM returns malformed JSON or a schema-violating response?

The instructor library handles this. When response_model=RankedDigestList is passed:

1. instructor sends the request to the LLM.
2. Attempts to parse the raw response as JSON and validate it against RankedDigestList.
3. If validation fails (e.g., relevance_score is "high" instead of a float), instructor automatically retries the LLM call with the validation error appended to the message.
4. After max retries (instructor default: 3), it raises an exception.

The exception is caught at service layer:

```python
# curator_agent.py
except Exception as e:
    print(f"Error ranking digests: {e}")
    return []    # returns empty list, not None

# process_email.py
if not ranked_articles:
    raise ValueError("Failed to rank articles")  # propagates up

# daily_runner.py
except Exception as e:
    logger.error(f"Pipeline failed with error: {e}", exc_info=True)
    results["error"] = str(e)
    # results["success"] stays False -> main.py exits with code 1
```

Pydantic constraints enforced at schema level:

```python
class RankedArticle(BaseModel):
    relevance_score: float = Field(ge=0.0, le=10.0)  # Must be in [0, 10]
    rank: int = Field(ge=1)                            # Must be positive
    reasoning: str                                     # Cannot be omitted
```

---

### Q10. How does the system prevent duplicate emails or duplicate article processing?

Three layers of deduplication:

**Layer 1 - Primary Key Uniqueness (database-enforced):**
- youtube_videos.video_id is the primary key
- openai_articles.guid is the primary key
- anthropic_articles.guid is the primary key
- digests.id is the primary key, computed as f"{article_type}:{article_id}"

```python
def create_youtube_video(self, video_id, ...) -> Optional[YouTubeVideo]:
    existing = self.session.query(YouTubeVideo).filter_by(video_id=video_id).first()
    if existing:
        return None  # silently skip duplicate
```

**Layer 2 - In-memory set during digest generation:**

```python
seen_ids = set()
digests = self.session.query(Digest).all()
for d in digests:
    seen_ids.add(f"{d.article_type}:{d.article_id}")
# Only yields articles not in seen_ids
```

**Layer 3 - Unique digest ID:**

```python
def create_digest(self, article_type, article_id, ...) -> Optional[Digest]:
    digest_id = f"{article_type}:{article_id}"
    existing = self.session.query(Digest).filter_by(id=digest_id).first()
    if existing:
        return None
```

Weakness: Layer 2 is O(N) - loads all digest IDs into Python memory on every run.

---

### Q11. How are database connection leaks prevented?

In server.py, the FastAPI dependency uses a try/finally pattern:

```python
def get_db():
    session = get_session()
    try:
        yield session
    finally:
        session.close()   # Guaranteed close, even on exception
```

In the pipeline, Repository() can create its own session with no explicit close. For short-lived cron jobs, the session closes when the process exits. This is acceptable for batch workloads. The migrate.py script runs pg_terminate_backend() to kill all other DB connections on startup - an aggressive approach unsuitable for production shared databases.

---

## Section 4: Performance, Latency & Resource Optimization

---

### Q12. Where are the primary bottlenecks?

**Bottleneck 1 - YouTube Transcript API (sequential I/O):**
process_youtube_transcripts() calls get_transcript(video_id) one by one. Each is a synchronous HTTP request to YouTube. For 10 videos, this is 10-30 seconds of sequential blocking I/O.

**Bottleneck 2 - Jina Reader API (sequential I/O):**
process_anthropic_markdown() calls requests.get(f"https://r.jina.ai/{url}") for each article, one at a time.

**Bottleneck 3 - LLM API latency (N calls for digest generation):**
process_digests() calls DigestAgent.generate_digest() once per article sequentially. For 20 articles at 1.7s average latency = 34 seconds minimum.

**Bottleneck 4 - get_articles_without_digest() O(N) scan:**
Loads every digest row from DB into Python memory on every pipeline run.

**Bottleneck 5 - Single giant LLM call for curation:**
curator.rank_digests(digests) sends all recent digests (potentially 50+) in one prompt. Large prompts can timeout on free tier.

---

### Q13. What optimizations currently exist in the codebase?

**1. Content truncation in digest_agent.py:**

```python
user_prompt = f"Create a digest for this {article_type}: \n Title: {title} \n Content: {content[:8000]}"
```

Hard-truncated to 8,000 characters. Prevents runaway token costs on 50,000-word transcripts.

**2. Layered deduplication prevents re-processing:**
Already-processed articles are never re-sent to the LLM - cost and latency optimization.

**3. Batch bulk inserts:**

```python
def bulk_create_youtube_videos(self, videos: List[dict]) -> int:
    new_videos = []
    ...
    self.session.add_all(new_videos)
    self.session.commit()  # Single commit for all new videos
```

add_all() + single commit avoids N round-trips to PostgreSQL.

**4. YouTube Shorts filtering at scrape time:**

```python
if "/shorts/" in entry.link:
    continue
```

Prevents wasted transcript fetch attempts on non-content videos.

**5. Docker layer caching:**

```dockerfile
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen        # Dependencies cached unless lockfile changes
COPY . .                    # Application code copied AFTER dependencies
```

---

### Q14. If traffic grew by 50x, what breaks first?

**Breaks immediately:**

1. **Single-LLM-call curation.** curator.rank_digests(digests) with 1,500+ articles would exceed model context limits.
   - Fix: Batch digests into groups of 30-50. Run multiple ranking calls in parallel. Merge by score.

2. **Sequential I/O.** 500 transcript API calls done sequentially would take 8+ minutes.
   - Fix: asyncio.gather() or ThreadPoolExecutor for parallel I/O.

3. **get_articles_without_digest() full table scan.** Loading 50,000 digest IDs into Python memory every run.
   - Fix: SQL NOT EXISTS subquery instead of Python set.

4. **Render free-tier PostgreSQL (1GB storage limit).** 50x data exhausts storage quickly.
   - Fix: Paid managed PostgreSQL, data retention policy for old digests.

5. **No database indexes.** Queries on created_at and article_type would slow to a crawl without indexes.
   - Fix: CREATE INDEX idx_digests_created_at ON digests(created_at); etc.

---

## Section 5: Line-by-Line Technical Defense & Code Walkthrough

---

### Q15. Walk through the most complex function in the codebase.

**Repository.get_articles_without_digest() - app/database/repository.py:147-202**

This function solves a cross-table JOIN problem in pure Python because the data lives in 3 unrelated tables with different schemas.

```python
def get_articles_without_digest(self, limit=None) -> List[Dict]:
    articles = []
    seen_ids = set()

    # Step 1: Build set of all IDs that already have a digest
    # Format: "youtube:abc123", "openai:https://...", "anthropic:https://..."
    digests = self.session.query(Digest).all()
    for d in digests:
        seen_ids.add(f"{d.article_type}:{d.article_id}")

    # Step 2: YouTube - only include videos with actual transcript text
    # Excludes NULL (not yet fetched) and "__UNAVAILABLE__" (permanently failed)
    youtube_videos = self.session.query(YouTubeVideo).filter(
        YouTubeVideo.transcript.isnot(None),
        YouTubeVideo.transcript != "__UNAVAILABLE__"
    ).all()
    for video in youtube_videos:
        key = f"youtube:{video.video_id}"
        if key not in seen_ids:
            articles.append({
                "content": video.transcript or video.description or "",
                ...
            })

    # Step 3: OpenAI - RSS description is good enough for digesting
    openai_articles = self.session.query(OpenAIArticle).all()
    for article in openai_articles:
        key = f"openai:{article.guid}"
        if key not in seen_ids:
            articles.append({"content": article.description or "", ...})

    # Step 4: Anthropic - MUST have markdown (Jina-fetched full content)
    # Anthropic RSS description is too short for a useful digest
    anthropic_articles = self.session.query(AnthropicArticle).filter(
        AnthropicArticle.markdown.isnot(None)
    ).all()
    for article in anthropic_articles:
        key = f"anthropic:{article.guid}"
        if key not in seen_ids:
            articles.append({
                "content": article.markdown or article.description or "",
                ...
            })

    if limit:
        articles = articles[:limit]  # Python slice, not SQL LIMIT
    return articles
```

Why written this way: The 3 source tables have no foreign key relationships to Digest. A SQL UNION JOIN would work but is harder to maintain as sources change. The Python set approach is simple and correct at current scale. The content fallback chain ensures DigestAgent always receives a non-empty string.

---

### Q16. Walk through the Curator Agent ranking logic.

**CuratorAgent.rank_digests() - app/agent/curator_agent.py:66-95**

```python
def rank_digests(self, digests: List[dict]) -> List[RankedArticle]:
    if not digests:
        return []  # Guard clause prevents empty LLM call

    # Build structured user message: all N articles in one formatted block
    digest_list = "\n\n".join([
        f"ID: {d['id']}\nTitle: {d['title']}\nSummary: {d['summary']}\nType: {d['article_type']}"
        for d in digests
    ])

    user_prompt = f"""Rank these {len(digests)} AI news digests based on the user profile:
{digest_list}
Provide a relevance score (0.0-10.0) and rank (1-{len(digests)}) for each article..."""

    response = self.client.chat.completions.create(
        model=self.model,
        messages=[
            {"role": "system", "content": self.system_prompt},  # Full user profile here
            {"role": "user", "content": user_prompt}
        ],
        response_model=RankedDigestList,   # instructor enforces Pydantic output
        temperature=0.3,   # Low temperature for deterministic, consistent ranking
    )
    return response.articles if response else []
```

Key design choices:
- temperature=0.3 vs DigestAgent's 0.7: Curation is a scoring task that must be consistent. Digests are creative summarization that benefits from variation.
- System prompt built ONCE in __init__ via _build_system_prompt(), not on every call.
- All N articles sent in ONE LLM call rather than N calls - more cost-efficient but requires model to keep all in context simultaneously.

---

### Q17. Walk through the database connection bootstrapping.

**app/database/connection.py**

```python
def get_database_url() -> str:
    # Priority 1: Render injects DATABASE_URL as a single connection string
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    # Priority 2: Manual local dev config via individual env vars
    user = os.getenv("POSTGRES_USER", "postgres")
    ...
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

# Module-level singletons - created ONCE on first import
engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

Critical: engine and SessionLocal are module-level singletons. SQLAlchemy internally manages a connection pool. All calls to get_session() throughout the pipeline share this single pool.

Risk: If env vars change after this module is imported, the engine does NOT pick up the changes. This is a standard Python module singleton limitation.

---

### Q18. Walk through the email sending and HTML generation.

**app/services/email.py:digest_to_html() and send_email()**

```python
def digest_to_html(digest_response) -> str:
    for article in digest_response.articles:
        # html.escape() prevents XSS if article title contains <script> tags
        html_parts.append(f'<h3>{html.escape(article.title)}</h3>')
        # markdown.markdown() converts LLM summary markdown to HTML
        summary_html = markdown.markdown(article.summary, extensions=['extra', 'nl2br'])
        # html.escape() on URLs prevents injection via malformed URLs
        html_parts.append(f'<p><a href="{html.escape(article.url)}">Read more</a></p>')

def send_email(subject, body_text, body_html, recipients=None):
    msg = MIMEMultipart("alternative")  # "alternative" = fallback plain-text + HTML
    part1 = MIMEText(body_text, "plain")
    msg.attach(part1)
    if body_html:
        part2 = MIMEText(body_html, "html")
        msg.attach(part2)  # HTML part is LAST per RFC 2046 - preferred by email clients

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(MY_EMAIL, APP_PASSWORD)
        smtp.sendmail(MY_EMAIL, recipients, msg.as_string())
```

Key details:
- MIMEMultipart("alternative"): email client chooses between plain-text and HTML. Last-attached MIME part is preferred per RFC 2046, so HTML is attached last.
- html.escape() applied to both titles and URLs to prevent XSS.
- Gmail App Password (APP_PASSWORD) is a 16-character application-specific password - NOT the user's Gmail password. It bypasses 2FA at the app level.

---

### Q19. What are the most significant technical debts?

**Tech Debt 1 - migrate.py instead of Alembic:**
Raw SQL in a Python script that catches exceptions if columns exist. No rollback capability, no versioning. Should be replaced with proper Alembic migration files.

**Tech Debt 2 - USER_PROFILE is hardcoded Python:**
Changing your profile requires editing source code and redeploying. A v2 would store profiles in the database with a CRUD API, enabling multiple users.

**Tech Debt 3 - CORS is wide open:**
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```
Permits any domain to call the API. Should be restricted to the Vercel deployment domain.

**Tech Debt 4 - No rate limiting or retry on LLM calls:**
If Gemini returns 429, the exception is caught and silently swallowed, returning []. No backoff, no retry, no alerting. Production would use tenacity for retry-with-backoff.

**Tech Debt 5 - Sequential I/O:**
All external HTTP calls are synchronous and sequential. Switching to asyncio with aiohttp and asyncio.gather() could reduce total pipeline time by 60-80%.

**Tech Debt 6 - Curation logic is duplicated:**
send_digest_email() calls CuratorAgent.rank_digests() and saves scores to DB. But process_curator.py is a standalone curation service that does the same thing. These two code paths are not coordinated.

**Tech Debt 7 - evaluate.py creates its own DB engine:**
```python
def get_db_session():
    db_url = f"postgresql://{os.getenv('POSTGRES_USER')}:..."
    engine = create_engine(db_url)  # Does NOT use shared connection.py
```
Does not support DATABASE_URL (Render env var). Would fail in cloud production.

---

### Q20. What would a v2 architecture look like?

1. **Queue-based pipeline:** Replace linear cron with message queue (Celery + Redis or AWS SQS). Each stage publishes events. Workers consume in parallel.

2. **Async I/O throughout:** Replace requests with httpx (async). Use asyncio.gather() for all scraping and transcript fetching.

3. **Proper curation batching:** Split large digest sets into batches of 30. Run curation in parallel. Merge by score.

4. **Multi-user support:** Move USER_PROFILE to a user_profiles database table. Add JWT-based auth to FastAPI. Each user gets their own curation results.

5. **Alembic migrations:** Replace migrate.py with versioned migration files managed by Alembic.

6. **Data retention policy:** Background job to archive digests older than 90 days to prevent unbounded table growth.

7. **Proper CORS configuration:** Replace allow_origins=["*"] with explicit origins list from env var.

8. **Retry-with-backoff:** Add tenacity decorators to all external API calls for resilient handling of transient failures.

9. **Database indexes:** Add indexes on digests.created_at, digests.rank, digests.article_type for query performance at scale.

---

*End of INTERVIEW_QA.md - All answers grounded in the actual repository implementation.*
