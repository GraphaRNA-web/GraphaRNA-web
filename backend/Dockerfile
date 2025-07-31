FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y \
        gcc libpq-dev \
        r-base r-base-dev \
        libcurl4-openssl-dev libssl-dev libxml2-dev \
        libpng-dev \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/root/.cache/R \
    R -e "install.packages(c('Biostrings', 'data.table', 'knitr', 'rmarkdown'), repos='https://cloud.r-project.org')"

COPY ./webapp/tools/R4RNA_2.0.8.tar.gz /app/R4RNA_2.0.8.tar.gz
RUN --mount=type=cache,target=/root/.cache/R \
    R -e "install.packages('/app/R4RNA_2.0.8.tar.gz', repos = NULL, type = 'source')"

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel build \
    && pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
