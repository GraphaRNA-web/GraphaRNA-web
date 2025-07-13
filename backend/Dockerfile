# źródło: https://www.docker.com/blog/how-to-dockerize-django-app/

# Dockerfile

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalacja zależności systemowych (jeśli potrzeba np. dla psycopg2)
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Kopiuj tylko requirements i zainstaluj wcześniej (lepsze cache'owanie)
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Potem dopiero kopiuj cały kod
COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]