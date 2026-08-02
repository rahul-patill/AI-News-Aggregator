FROM python:3.12-slim

# Install curl (required to download uv)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install uv (our lightning fast package manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to the system path
ENV PATH="/root/.local/bin:${PATH}"

# Set the working directory inside our container
WORKDIR /app

# Copy our lockfile and project settings first
# (Doing this first makes building the container much faster next time if we only change our python code)
COPY pyproject.toml uv.lock ./

# Install our dependencies
RUN uv sync --frozen

# Copy the rest of our application code into the container
COPY . .

# When Render turns on this container, run the database table creation, run migrations, then the main pipeline
CMD ["bash", "-c", "uv run python -m app.database.create_tables && uv run python migrate.py && uv run python main.py"]
