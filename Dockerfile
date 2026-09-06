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

# Expose the port Northflank expects
EXPOSE 8000

# When Northflank turns on this container, start the FastAPI web server
CMD ["uv", "run", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
