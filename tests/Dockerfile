FROM mcr.microsoft.com/playwright:v1.49.0-jammy

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /tests

RUN pip3 install --no-cache-dir locust

COPY tests/playwright/package.json tests/playwright/package-lock.json ./playwright/

WORKDIR /tests/playwright
RUN npm ci

WORKDIR /tests
COPY tests/load_tests/ ./load_tests/
COPY tests/playwright/ ./playwright/

CMD ["echo", "Test image ready."]