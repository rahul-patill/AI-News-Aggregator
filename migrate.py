from sqlalchemy import text
from app.database.connection import engine

queries = [
    "ALTER TABLE digests ADD COLUMN relevance_score FLOAT;",
    "ALTER TABLE digests ADD COLUMN rank INTEGER;",
    "ALTER TABLE digests ADD COLUMN reasoning TEXT;"
]

for query in queries:
    try:
        with engine.begin() as conn:
            conn.execute(text(query))
        print(f"Success: {query}")
    except Exception as e:
        print(f"Skipped (probably already exists): {query}")

