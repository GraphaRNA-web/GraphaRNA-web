# GraphaRNA-web

Web application for RNA structure analysis using Graph Neural Networks. Project realized as part of an engineering thesis.

## Important Links

* **Production App:** [https://grapharna.cs.put.poznan.pl]

---

## System Requirements (Production)

To run the application in a production environment, the server must meet the following minimum requirements:

### Hardware
* **CPU:** min. 4 vCPU (recommended 16+ vCPU for smooth operation of the computational module).
* **RAM:** min. 16 GiB (recommended 24 GiB due to AI model requirements).
* **Disk:** min. 100 GB free space.
* **Network:** Static public IP address and domain (required for SSL certification).

### Software
* Operating System: Linux (recommended Ubuntu 24.04 LTS or newer).
* Containerization Environment: Docker or containerd.
* Orchestrator: Kubernetes (recommended distribution **MicroK8s**).

---

## Installation and Deployment (Production Environment)

The following instructions assume installation on a clean Ubuntu system using MicroK8s and Helm.

### 1. Prepare Kubernetes Environment

1.  Update the system and install MicroK8s:
    ```bash
    sudo apt update
    sudo apt install snapd -y
    sudo snap install microk8s --classic --channel=1.29/stable
    ```

2.  Grant permissions to the user and configure aliases:
    ```bash
    sudo usermod -a -G microk8s $USER
    sudo chown -f -R $USER ~/.kube
    newgrp microk8s
    
    # Optionally add aliases
    echo "alias kubectl='microk8s kubectl'" >> ~/.bashrc
    echo "alias helm='microk8s helm3'" >> ~/.bashrc
    source ~/.bashrc
    ```

3.  Enable required addons:
    ```bash
    microk8s enable dns helm3 storage ingress cert-manager
    ```
    *Ensure all system pods are in `Running` status (`kubectl get pods -A`).*

### 2. Download Code and Model
This step is unnecessary if you are using the default images. 
1.  Clone the main repository:
    ```bash
    git clone [https://github.com/GraphaRNA-web/GraphaRNA-web.git](https://github.com/GraphaRNA-web/GraphaRNA-web.git)
    cd GraphaRNA-web
    ```

2.  Download and configure dependencies (sub-repositories and AI model):
    Ensure the directories `./GraphaRNA`, `./GraphaRNA/RiNALMo`, and `./GraphaRNA/Arena` exist. If not, clone them manually and download the model weights:

    ```bash
    # Downloading the model (in directory ./GraphaRNA)
    cd GraphaRNA
    wget [https://zenodo.org/records/13750967/files/model_epoch_800.tar.gz?download=1](https://zenodo.org/records/13750967/files/model_epoch_800.tar.gz?download=1) -O model_epoch_800.tar.gz
    tar -xvzf model_epoch_800.tar.gz && mv model_800.h5 save/grapharna/
    cd ..
    ```

### 3. Configuration (values.yaml)

In the production environment, all configuration is handled via the `GraphaRNA-web/values.yaml` file. We do not use `.env` files there.

Before deployment, edit `values.yaml` and adjust the sections:
* **Global:** `networkPolicy.enabled`, `monitoring.enabled`.
* **Frontend:** `DOMAIN_URL` (must point to your domain).
* **Backend:** Database configuration, SMTP (email), and model parameters.
* **Resources:** Adjust `requests` and `limits` to your server's capabilities.

### 4. Launch (Helm)
This step can be achieved by using the `make run` command or simply running the `start_app.sh` script.
1.  Create a namespace:
    ```bash
    kubectl create namespace grapharna
    ```

2.  Install the application:
    ```bash
    helm install grapharna-web ./GraphaRNA-web --namespace grapharna
    ```

3.  Verification:
    ```bash
    kubectl get pods -n grapharna -w
    ```
    The application is ready when all pods have status `Running` and `1/1`.

### Maintenance 
1. If you want to perform a hard restart of the application, use the `make restart` command or run the `restart_app.sh` script.
2. Certificates used for internal communication within the cluster are (in most scenarios) valid for one year. 
If, after this approximate amount of time, the app stops working, you should refresh the certificates using `sudo microk8s refresh-certs`.
3. If the certificate for https gets outdated, the CSR should be automaticly regenerated. If there are any problems with this process, 
you should restart the cluster with the  global.networkPolicy.enabled should be set to `false` in the `GraphaRNA-web/values.yaml` file.
---

## Local Run (Docker Compose)

For development or testing purposes (without a Kubernetes cluster), the application can be run using Docker Compose.

### 1. Environment Variable Configuration (.env)

Create a `.env` file in the project's backend/ directory.
**Note:** The configuration below is intended for the local environment (Docker).

```ini
# --- Backend Settings ---
DJANGO_SECRET_KEY=change_me_to_random_string_in_production
DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

# --- Database ---
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=dockerdjango
DATABASE_USERNAME=dbuser
DATABASE_PASSWORD=dbpassword
DATABASE_HOST=db
DATABASE_PORT=5432

# --- Celery & RabbitMQ ---
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//

# --- Engine Configuration ---
ENGINE_TEST_URL=http://grapharna-engine:8080/test
ENGINE_URL=http://grapharna-engine:8080
ENGINE_TIMEOUT_SECONDS=60000
ENGINE_POLL_INTERVAL_SECONDS=60

# --- App Logic ---
JOB_EXPIRATION_WEEKS=2
UUID_HASH_LENGTH=5
MODEL_NAME=model_800.h5
MODEL_EPOCHS=800
EXAMPLE_JOB_NAME_PREFIX=example_job_
EXAMPLE_JOB_SEED=1
EXAMPLE_ALTERNATIVE_CONFORMATIONS=1

# --- Email (SMTP) ---
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=user@example.com
EMAIL_HOST_PASSWORD=secret
RESULT_BASE_URL=[http://127.0.0.1:3000/results](http://127.0.0.1:3000/results)

# --- Email Templates ---
TEMPLATE_PATH_JOB_CREATED=email_templates/template_job_created.html
TEMPLATE_PATH_JOB_FINISHED=email_templates/template_job_finished.html
TEMPLATE_PATH_JOB_NEAR_EXPIRATION=email_templates/template_job_near_expiration.html
EMAIL_TITLE_JOB_CREATED=Your job has been created!
EMAIL_TITLE_JOB_FINISHED=Your job is finished!
EMAIL_TITLE_JOB_NEAR_EXPIRATION=Your job is about to expire!

SETUP_BASE_DIR=/app
```

Create this .env in the root directory:
```ini
DATABASE_NAME=dockerdjango 
DATABASE_USERNAME=dbuser
DATABASE_PASSWORD=dbpassword
```

Create this .env in the frontend/ directory
```ini
BACKEND_URL=http://backend:8000
DOMAIN_URL=http://127.0.0.1:3000,http://localhost:3000
NODE_ENV=production
NEXT_PUBLIC_EXAMPLE_RNA_1=CCGAGUAGGUA\n((.....))..
NEXT_PUBLIC_EXAMPLE_RNA_2=GACUUAUAGAU UGAGUCC\n(((((..(... )))))).
NEXT_PUBLIC_EXAMPLE_RNA_3=UUAUGUGCC UGUUA AAUACAAUAG\n.....(... (.(.. ).....)..)
```

### 2. Running Containers

Ensure Docker Desktop is running, then execute:

```bash
docker compose build
docker compose up -d
```

The application should be available at `http://localhost:3000` (Frontend) and `http://localhost:8000` (Backend API).

---

## CI/CD (GitHub Actions)

The repository has configured CI/CD pipelines. For automatic deployments to work correctly, define the following in repository settings (Settings -> Secrets and variables -> Actions):

* `DOCKERHUB_TOKEN` – Access token for DockerHub.
* `DOCKERHUB_USERNAME` – DockerHub username.
* `SSH_IP` – Production server IP address.
* `SSH_USER` – SSH user on the server.
* `SSH_PASSWD` – SSH user password.

---

## Backend Development (No Docker)

If you want to run just the backend in isolation (e.g., for Python development):

1.  **Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    # venv\Scripts\activate   # Windows
    ```
2.  **Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Migrations and Run:**
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

### Code Audit
The project includes a `Makefile` to facilitate code quality maintenance:
* Formatting: `make format`
* Linting: `make lint`
