# Runner Documentation

The `runner.py` file serves as the main orchestrator for the AI News Aggregator application. It is responsible for coordinating the various web scrapers, collecting their data, and saving it to the database.

## Core Components

### `run_scrapers(hours: int = 24)`
This function is the primary driver of the data pipeline. When executed, it performs the following steps:

1. **Initialization**: It initializes all the individual scrapers (`YouTubeScraper`, `OpenAIScraper`, `AnthropicScraper`) and the database `Repository`.
2. **YouTube Scraping**: It iterates over a predefined list of `YOUTUBE_CHANNELS` (imported from `config.py`), fetching the latest videos published in the given timeframe (`hours`).
3. **Blog Scraping**: It calls the OpenAI and Anthropic scrapers to fetch the latest articles published in the given timeframe.
4. **Database Insertion**: It formats the scraped data (videos and articles) into dictionaries and uses the repository's bulk create methods (`bulk_create_youtube_videos`, `bulk_create_openai_articles`, `bulk_create_anthropic_articles`) to insert the new records efficiently into the database.
5. **Returns**: It returns a dictionary containing the raw populated objects from all scrapers for further use or debugging.

### Execution Block
When run directly as a script (via `python -m app.runner`), it executes the `run_scrapers` function with a default timeframe of the last 24 hours and prints a summary of how many new items were scraped for each source.
