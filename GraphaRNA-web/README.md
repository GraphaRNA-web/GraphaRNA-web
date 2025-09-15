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
helm repo add linkerd-edge https://helm.linkerd.io/edge
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Create linkerd certificates
step certificate create root.linkerd.cluster.local ca.crt ca.key --profile root-ca --no-password --insecure
step certificate create identity.linkerd.cluster.local issuer.crt issuer.key --profile intermediate-ca --not-after 8760h --no-password --insecure --ca ca.crt --ca-key ca.key

# Install linkerd
linkerd check --pre
helm upgrade --install linkerd-crds linkerd-edge/linkerd-crds -n linkerd --create-namespace --force
helm upgrade --install linkerd-control-plane linkerd-edge/linkerd-control-plane -n linkerd --set-file identityTrustAnchorsPEM=ca.crt --set-file identity.issuer.tls.crtPEM=issuer.crt --set-file identity.issuer.tls.keyPEM=issuer.key --set proxyInit.runAsRoot=true
# Install linkerd observation pane (OPTIONAL)
helm upgrade --install linkerd-viz linkerd-edge/linkerd-viz -n linkerd
linkerd check
# (optional if errors)
linkerd upgrade --crds | kubectl apply -f -

# Install monitoring tools (and set the password) kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace --set grafana.adminPassword='admin' --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Loki + promtail (agent to get logs from pods): you can add it in dashboard and set http://loki-stack.monitoring.svc.cluster.local:3100
helm upgrade --install loki-stack grafana/loki-stack -n monitoring --set grafana.enabled=false

# Install the GraphaRNA-web app
helm upgrade --install grapharna-web . -n grapharna --create-namespace

# To insert linkerd:
kubectl annotate namespace grapharna linkerd.io/inject=enabled --overwrite
kubectl rollout restart deployment -n grapharna
```
To check if the app works use `kubectl get all`, `linkerd check`

To uninstall linkered use: `linkerd uninstall | kubectl delete -f - `, `kubectl delete namespace linkerd`

Remember to apply migrations in backend: `kubectl exec -n grapharna -it backend-6778d7c699-4vnzs -c backend -- bash`

When having service mesh enabled remember to add the `-c <container_name>` arg

Later to install certificates it will be necessery to get:
`helm install cert-manager oci://quay.io/jetstack/charts/cert-manager --version v1.18.2 --namespace cert-manager --create-namespace --set crds.enabled=true`

To access grafana: `kubectl --namespace monitoring port-forward $POD_NAME 3000` after checking pod name or use
`export POD_NAME=$(kubectl get pods --namespace meta -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=grafana" -o jsonpath="{.items[0].metadata.name}") && kubectl --namespace meta port-forward $POD_NAME 3000 --address 0.0.0.0` 


To integrate Loki with grafana use a dedicated dashboard and put in `http://loki:3100`


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
``````