# AI Agents Documentation

The `agent` folder contains the core Artificial Intelligence models that power the "brain" of the AI News Aggregator. 

We use the **Google Gemini SDK** (`google-genai`) paired with the **gemini-2.5-flash** model. This folder is structured around the concept of specific "Agents" — isolated AI models given very specific prompts, responsibilities, and data structures.

---

## The Agents

### 1. `digest_agent.py` (The Summarizer)
**Role**: Read massive walls of raw text and compress them.
**How it works**:
This agent receives the raw markdown text from an Anthropic article or the full transcript of a YouTube video (which can be thousands of words long). 
It is prompted to act as an expert AI news analyst. Its job is to cut through the fluff, ignore marketing speak, and return a clean, 2-3 sentence summary that highlights actionable insights.
**Output Structure**: It strictly returns a `DigestOutput` object containing exactly two things: a catchy `title` and a `summary`.

### 2. `curator_agent.py` (The Personalizer)
**Role**: Rank the summaries based on who you are.
**How it works**:
This agent receives a list of all the AI summaries generated in the last 72 hours. It also reads your `USER_PROFILE` (defined elsewhere in the app), which includes your name, background, expertise level, and interests.
It acts as your personal curator, assigning a score from 0.0 to 10.0 to every single article based on how much *you* specifically would care about it. 
**Output Structure**: It strictly returns a `RankedDigestList`, which is a sorted array containing the article ID, your personalized relevance score, its rank (1st, 2nd, 3rd, etc.), and a 1-sentence `reasoning` explaining *why* it thinks you will like it.

### 3. `email_agent.py` (The Communicator)
**Role**: Write a friendly newsletter introduction.
**How it works**:
This agent is handed the top 10 ranked articles produced by the Curator Agent. It doesn't write the summaries (those are already done), but rather it acts as a friendly email writer. It generates a warm, personalized greeting using your name and the current date, and writes a 2-3 sentence introduction previewing the common themes or most exciting news found in the top 10 articles.
**Output Structure**: It strictly returns an `EmailIntroduction` object containing the `greeting` and the `introduction` paragraphs.

---

## How we enforce structured data (Pydantic)
One of the biggest challenges with AI is that it usually just spits out a giant string of unstructured text. This is terrible for databases and software.

To solve this, these agents use **Pydantic** classes (like `BaseModel`). When we call the Gemini API, we pass our Pydantic classes into the `response_schema` parameter. This forces the AI to output its answer strictly formatted as JSON that matches our exact variables. This guarantees that our Python code can safely access variables like `response.title` or `response.relevance_score` without ever crashing!
