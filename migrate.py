from sqlalchemy import text
from app.database.connection import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE digests ADD COLUMN relevance_score FLOAT;"))
        conn.execute(text("ALTER TABLE digests ADD COLUMN rank INTEGER;"))
        conn.execute(text("ALTER TABLE digests ADD COLUMN reasoning TEXT;"))
    print("Migration successful.")
except Exception as e:
    print(f"Migration error (columns might already exist): {e}")
