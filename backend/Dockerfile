# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Run ───────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

COPY --from=builder /install /usr/local
COPY app/ ./app/

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]