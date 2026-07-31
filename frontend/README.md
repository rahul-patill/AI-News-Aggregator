# Signal — AI News Aggregator Frontend

A curated-intelligence dashboard for your FastAPI news backend, built with React + Vite + Tailwind CSS v4.

## Setup

```bash
npm install
npm run dev
```

This starts the Vite dev server (default: http://localhost:5173) and proxies any request to
`/api/*` to your FastAPI backend at `http://localhost:8000`. Make sure your FastAPI server is
running before starting the frontend.

## What it expects from your API

`GET /api/news` should return either a plain array, or an object with an `articles` array, of
objects shaped like:

```json
{
  "title": "string",
  "summary": "string",
  "url": "string",
  "relevance_score": 0.0,
  "article_type": "string"
}
```

`relevance_score` can be either 0–1 or 0–100 — it's normalized automatically.

## Design concept

"Wire & Signal" — the AI plays wire-service editor, so the UI reads like a field report rather
than a typical dark-mode dashboard: warm paper background, editorial serif (Fraunces) for
headlines, monospace (IBM Plex Mono) for scores and metadata, and a seismograph-style "Signal
Meter" gauge (instead of a generic score badge) as the one signature element per card.

## Structure

```
src/
  index.css              Design tokens (Tailwind v4 @theme block)
  App.jsx                Layout + data fetching
  components/
    Header.jsx            Masthead
    CuratorLog.jsx         Left pane "field notes" panel
    Feed.jsx               Loading / error / empty / list states
    ArticleCard.jsx        Individual article row
    SignalMeter.jsx        Signature relevance gauge
```

## Build for production

```bash
npm run build
```

Outputs to `dist/`. Note: the dev proxy to localhost:8000 only applies to `npm run dev` — for a
production deployment you'll need to serve this behind the same origin as your API, or point
fetch calls at your API's real URL.
