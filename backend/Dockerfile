FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (separate layer — only rebuilds when requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source (excludes .env, __pycache__, media/ — see .dockerignore)
COPY . .

# Collect static files at build time using a throwaway secret key.
# Real SECRET_KEY is injected at runtime via env_file; this value is never used in production.
RUN SECRET_KEY=build-collect-static-only python manage.py collectstatic --noinput

# Ensure media directory exists
RUN mkdir -p /app/media

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
