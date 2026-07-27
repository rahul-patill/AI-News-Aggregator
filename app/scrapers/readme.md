# YouTube Scraper Documentation

The `youtube.py` file contains the logic for scraping data from YouTube channels, specifically retrieving recently uploaded videos and their transcripts. It relies on parsing YouTube's RSS feeds for video metadata and using an unofficial API for retrieving video transcripts.

## Core Components

The file defines two Pydantic models to structure the scraped data:
- `Transcript`: Represents the full text of a video transcript.
- `ChannelVideo`: Represents a video's metadata including its title, URL, video ID, publication date, description, and an optional transcript.

## `YouTubeScraper` Class

This is the main class responsible for the scraping operations. 

### Functions / Methods:

- **`__init__()`**: Initializes the scraper. It checks for proxy credentials in the environment variables (`PROXY_USERNAME`, `PROXY_PASSWORD`) and configures the `YouTubeTranscriptApi` to use Webshare proxies if they exist, helping avoid rate limits.
- **`_get_rss_url(channel_id)`**: A helper function that returns the RSS feed URL for a given YouTube channel ID.
- **`_extract_video_id(video_url)`**: A helper function that extracts the unique video ID from various formats of YouTube URLs (standard watch URLs, Shorts, and shortened `youtu.be` links).
- **`get_transcript(video_id)`**: Fetches the transcript for a specific video ID. It handles exceptions like disabled or missing transcripts and returns the text joined into a single string.
- **`get_latest_videos(channel_id, hours)`**: Fetches the latest videos from a channel's RSS feed that were published within the specified number of `hours`. It automatically filters out YouTube Shorts and returns a list of `ChannelVideo` objects without transcripts.
- **`scrape_channel(channel_id, hours)`**: The primary high-level method. It first retrieves the latest videos using `get_latest_videos()`, then iterates through them to fetch and attach their corresponding transcripts using `get_transcript()`. It returns the complete list of populated `ChannelVideo` objects.

---

# OpenAI Scraper Documentation

The `openai.py` file is responsible for scraping recent news articles from the official OpenAI news RSS feed.

## Core Components

The file defines the `OpenAIArticle` Pydantic model to structure the scraped data. It represents an article's metadata including its title, description, URL, GUID, publication date, and an optional category.

## `OpenAIScraper` Class

This class manages the operations to fetch news from OpenAI. 

### Functions / Methods:

- **`__init__()`**: Initializes the scraper by setting the target RSS feed URL (`https://openai.com/news/rss.xml`). It also initializes a `DocumentConverter` from the `docling` library, suggesting potential functionality to parse or convert document contents.
- **`get_articles(hours)`**: Fetches the latest articles from the OpenAI RSS feed that were published within the specified number of `hours`. It parses the feed using `feedparser`, filters the entries by their publication time against the given time window, and returns a list of populated `OpenAIArticle` objects.

---

# Anthropic Scraper Documentation

The `anthropic.py` file is responsible for scraping recent news, research, and engineering articles from unofficial Anthropic RSS feeds hosted on GitHub.

## Core Components

The file defines the `AnthropicArticle` Pydantic model to structure the scraped data. It represents an article's metadata including its title, description, URL, GUID, publication date, and an optional category.

## `AnthropicScraper` Class

This class manages the operations to fetch news from Anthropic-related feeds and retrieve article content.

### Functions / Methods:

- **`__init__()`**: Initializes the scraper by setting target RSS feed URLs for Anthropic's news, research, and engineering. It also initializes a `DocumentConverter` from the `docling` library to facilitate converting web articles into markdown.
- **`get_articles(hours)`**: Iterates over the predefined RSS feeds and fetches the latest articles that were published within the specified number of `hours`. It uses `feedparser` to read the feeds, tracks seen GUIDs to prevent duplicates across feeds, filters entries by publication time, and returns a list of populated `AnthropicArticle` objects.
- **`url_to_markdown(url)`**: A helper method that takes an article URL and converts its webpage content into formatted Markdown using the `docling` library. This is crucial for retrieving the full textual content of the articles beyond just the summaries provided in the RSS feeds.
