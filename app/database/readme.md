# Database Module Documentation

This directory contains all the code responsible for interacting with the PostgreSQL database. Instead of writing raw SQL queries, this project uses **SQLAlchemy**.

---

## What is SQLAlchemy and Why Are We Using It?

**SQLAlchemy** is an Object-Relational Mapper (ORM) for Python. 

**What does that mean?**
Normally, to interact with a database, you have to write raw SQL string queries like:
`SELECT * FROM youtube_videos WHERE channel_id = '123';`

With an ORM like SQLAlchemy, tables are represented as standard Python classes, and rows are represented as Python objects. You interact with the database using normal Python code:
`session.query(YouTubeVideo).filter_by(channel_id='123').all()`

**Why we use it:**
1. **Security:** It automatically protects against SQL injection attacks by escaping data safely.
2. **Productivity:** It's much faster to write Python objects than to manually construct long, complex SQL strings, especially for inserting (bulk creating) large amounts of scraped data.
3. **Maintainability:** If we ever change a column name, we just update the Python class in one place. We also benefit from Python type-hinting and autocomplete in our editor.
4. **Database Agnostic:** If we ever wanted to switch from PostgreSQL to SQLite or MySQL, we wouldn't have to rewrite any SQL queries. SQLAlchemy translates our Python code into the correct SQL dialect automatically.

---

## File Breakdown

### 1. `connection.py`
This file handles the actual connection to the PostgreSQL database. It reads the database credentials from your `.env` file (like `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.), constructs the connection string, and creates the SQLAlchemy `engine` (the core interface to the database) and `SessionLocal` (the factory that generates database sessions for us to use).

### 2. `models.py`
This file defines the structure (schema) of our database. It contains Python classes (like `YouTubeVideo`, `OpenAIArticle`, etc.) that inherit from SQLAlchemy's declarative base. Each class maps to a specific table in the database, and the class attributes (like `id`, `title`, `url`) map directly to the columns of that table.

### 3. `create_tables.py`
This is a utility script. When run, it takes all the schemas defined in `models.py` and tells the SQLAlchemy engine to actually generate and run the `CREATE TABLE` SQL commands in the PostgreSQL database if those tables do not already exist.

### 4. `repository.py`
This file implements the Repository Pattern. It contains a `Repository` class that provides a clean, high-level API for the rest of the application to interact with the database. Instead of the scrapers dealing directly with database sessions and commits, they just pass Python dictionaries to methods like `bulk_create_youtube_videos()` inside this file, and this file handles the complex database logic safely.
