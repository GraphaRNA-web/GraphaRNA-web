FROM mcr.microsoft.com/playwright:v1.49.0-jammy

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir locust

WORKDIR /tests

COPY playwright/package.json playwright/package-lock.json ./playwright/

WORKDIR /tests/playwright
RUN npm ci

WORKDIR /tests
COPY load_tests/ ./load_tests/
COPY playwright/ ./playwright/

CMD ["echo", "Ready"]