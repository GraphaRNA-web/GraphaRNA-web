FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc libpq-dev libcurl4-openssl-dev libssl-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.11-slim

RUN groupadd -g 3000 appgroup && \
    useradd -u 1000 -g appgroup -m -s /bin/bash appuser

WORKDIR /home/appuser/app

ENV XDG_CONFIG_HOME=/tmp
ENV XDG_CACHE_HOME=/tmp
ENV MPLCONFIGDIR=/tmp
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc libpq-dev \
    libpq5 \
    openjdk-21-jre-headless \
    libcurl4 \
    libxml2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

COPY --chown=appuser:appgroup . .

RUN SECRET_KEY=build_dummy_secret \
    DATABASE_ENGINE=django.db.backends.sqlite3 \
    DATABASE_NAME=":memory:" \
    python manage.py collectstatic --noinput

USER 1000

EXPOSE 8000

ENV GUNICORN_WORKERS=3
ENV GUNICORN_THREADS=2
ENV GUNICORN_TIMEOUT=120

CMD ["gunicorn", "GraphaRNA.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--threads", "2", \
     "--worker-class", "gthread", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]