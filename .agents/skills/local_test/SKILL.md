---
name: Local Pipeline Test
description: Use this skill when the user asks to run a local test, wipe the database for testing, or run the pipeline safely in development.
---

# Instructions for Local Pipeline Testing

When the user asks to test the pipeline locally, you must ensure that no production side-effects occur. Follow these steps:

1. **Database Reset**: 
   - Ask the user for permission to wipe the local PostgreSQL database tables (or specific testing tables).
   - Only execute `TRUNCATE` or `DELETE` commands if the user explicitly confirms, or if running against a dedicated test database.
2. **Mocking External Services**:
   - Do NOT send real emails during local tests. 
   - Temporarily patch or mock the SMTP logic in `app/services/process_email.py` (or equivalent) to simply `print()` the final HTML output to the console instead of sending it via Gmail.
3. **Execution**:
   - Provide the user with the command to run the pipeline, usually: `python -m app.services.process_email` or `python main.py`.
   - Remind the user to ensure their `.env` file is pointing to `localhost` for the database to prevent accidental production wipes.
