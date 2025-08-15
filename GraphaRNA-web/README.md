# GraphaRNA-web — Deploy na Kubernetes

This docs explains how to install GraphaRNA-web in Kubernetes cluster using Helm, Linkerd and Ingress NGINX.
---

## Requirements

- Kubernetes cluster (np. Minikube, Kind, AKS, GKE, Docker)
- Helm v3+
- kubectl
- Linkerd CLI (`linkerd`) [repo adress](https://github.com/linkerd/linkerd2/releases/tag/edge-25.7.4)
- Docker
- step

---

## Commands
In /GraphaRNA-web subfolder. Requires having built Docker images of backend frontend and engine.
```bash
# Add repos
helm repo add linkerd https://helm.linkerd.io/stable
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create linkerd certificates
step certificate create root.linkerd.cluster.local ca.crt ca.key --profile root-ca --no-password --insecure
step certificate create identity.linkerd.cluster.local issuer.crt issuer.key --profile intermediate-ca --not-after 8760h --no-password --insecure --ca ca.crt --ca-key ca.key

# Install linkerd
helm install linkerd-crds linkerd/linkerd-crds -n linkerd --create-namespace
helm install linkerd-control-plane -n linkerd --set-file identityTrustAnchorsPEM=ca.crt --set-file identity.issuer.tls.crtPEM=issuer.crt --set-file identity.issuer.tls.keyPEM=issuer.key linkerd/linkerd-control-plane
# Install linkerd observation pane (OPTIONAL)
helm install linkerd-viz linkerd/linkerd-viz -n linkerd

# Install monitoring tools (and set the password)
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace --set grafana.adminPassword='admin' --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Install the GraphaRNA-web app
helm upgrade --install grapharna-web . -n grapharna
```
To check if the app works use `kubectl get all`

Later to install certificates it will be necessery to get:
`helm install cert-manager oci://quay.io/jetstack/charts/cert-manager --version v1.18.2 --namespace cert-manager --create-namespace --set crds.enabled=true`

## Example Secrets & Configmap files
### Backend
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  DEBUG: "True"
  DJANGO_ALLOWED_HOSTS: "*"
  DATABASE_ENGINE: "django.db.backends.postgresql"
  DATABASE_NAME: "dockerdjango"
  DATABASE_HOST: "db-svc"
  DATABASE_PORT: "5432"
  JOB_EXPIRATION_WEEKS: "2"
  MODEL_NAME: "model_800.h5"
  MODEL_EPOCHS: "800"
  CELERY_BROKER_URL: "amqp://guest:guest@rabbitmq-svc:5672//"
```
```
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
type: Opaque
stringData:
  DJANGO_SECRET_KEY: "django-insecure-l_nyz6vaakzlajt&vp+6vh727b2baq=o(!z34rbzmx!r%i9b3_"
  DATABASE_USERNAME: "dbuser"
  DATABASE_PASSWORD: "dbpassword"
```

### Postgres
```
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_DB: dockerdjango
  POSTGRES_USER: dbuser
  POSTGRES_PASSWORD: dbpassword
```

### RabbitMQ
```
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-secret
type: Opaque
stringData:
  USER: guest
  PASSWORD: guest
```