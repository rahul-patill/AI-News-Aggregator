from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.repository import Repository
from app.database.connection import get_session
import uvicorn

app = FastAPI(title="AI News Aggregator API")

# Configure CORS to allow your future React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains (useful for local development)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],
)

@app.get("/api/news")
def get_news():
    """
    Fetches the top curated news from the PostgreSQL database.
    """
    repo = Repository(get_session())
    # Fetch top 10 curated digests
    digests = repo.get_top_curated_digests(limit=10)
    return {"status": "success", "articles": digests}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
