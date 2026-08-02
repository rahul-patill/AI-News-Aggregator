from sqlalchemy import text
from app.database.connection import engine

# 1. Kill any dangling connections that might be holding a lock on the table
try:
    with engine.begin() as conn:
        conn.execute(text("""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = current_database() AND pid <> pg_backend_pid();
        """))
    print("Cleared hanging database connections.")
except Exception as e:
    print(f"Note on clearing connections: {e}")

# 2. Run migrations
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

