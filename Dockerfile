ARG PYTHON_VERSION=3.11.13-slim-bookworm
FROM python:${PYTHON_VERSION}

ARG APP_VERSION=1.0.0

LABEL org.opencontainers.image.title="WebDocTo" \
      org.opencontainers.image.description="PDF OCR Preprocessor" \
      org.opencontainers.image.version="${APP_VERSION}"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_VERSION=${APP_VERSION}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-tha \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt VERSION ./
RUN python -m pip install --upgrade pip==25.1.1 && \
    pip install -r requirements.txt

COPY app ./app
COPY ocr_preprocess.py ./

RUN useradd --create-home --shell /bin/bash appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl --fail http://127.0.0.1:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
