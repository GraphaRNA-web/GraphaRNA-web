#!/usr/bin/bash
set -euo pipefail

NAMESPACE="grapharna"
RELEASE="grapharna-web"
CHART_PATH="./GraphaRNA-web"
VALUES_FILE="$CHART_PATH/values.yaml"

echo "[INFO] Restart: performs a HARD restart of the application."
echo "[WARNING] All persistent data will be LOST. Images will be reset to 'latest'."
read -p "Continue? (Y/N): " confirm && [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]] || exit 1

# --- Basic checks ---
command -v microk8s >/dev/null 2>&1 || { echo "[ERROR] microk8s not found"; exit 1; }

if [ ! -d "$CHART_PATH" ]; then
  echo "[ERROR] Chart path not found: $CHART_PATH"
  echo "       Run script from repo root or adjust CHART_PATH."
  exit 1
fi

echo "[INFO] Starting MicroK8s..."
microk8s start
echo "[INFO] Waiting for MicroK8s to be ready..."
microk8s status --wait-ready

echo "[INFO] Ensuring required addons are enabled..."
microk8s enable dns helm3 storage ingress cert-manager >/dev/null || true

# --- Check if release exists ---
if ! microk8s helm3 status "$RELEASE" -n "$NAMESPACE" >/dev/null 2>&1; then
  echo "[ERROR] Release '$RELEASE' does not exist!"
  echo "        Run start_app.sh instead."
  exit 1
fi

# --- Get release status ---
STATUS_LINE="$(microk8s helm3 status "$RELEASE" -n "$NAMESPACE" 2>/dev/null | awk -F': ' '/^STATUS:/{print $2}')"
STATUS="$(echo "${STATUS_LINE:-unknown}" | tr '[:upper:]' '[:lower:]')"

if [ "$STATUS" != "deployed" ]; then
  echo "[ERROR] Release exists but status is '$STATUS'."
  echo "        Restart requires state: DEPLOYED."
  echo "        Investigate or repair manually:"
  echo "          microk8s helm3 status $RELEASE -n $NAMESPACE"
  echo "          microk8s kubectl get pods -n $NAMESPACE -o wide"
  exit 1
fi

echo "[INFO] Release '$RELEASE' is DEPLOYED. Proceeding with HARD restart."

# --- Uninstall release ---
echo "[INFO] Uninstalling release..."
microk8s helm3 uninstall "$RELEASE" -n "$NAMESPACE"

# --- Wait until namespace becomes empty ---
echo "[INFO] Waiting for all resources in namespace '$NAMESPACE' to terminate..."

while true; do
  COUNT="$(microk8s kubectl get all -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || true)"
  if [ "$COUNT" -eq 0 ]; then
    echo "[INFO] Namespace is empty."
    break
  fi
  echo "[INFO] Resources still terminating... ($COUNT remaining)"
  sleep 2
done

# --- Install fresh release ---
echo "[INFO] Reinstalling release..."

microk8s helm3 install "$RELEASE" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values "$VALUES_FILE" \
  --wait --timeout 10m

echo "[INFO] Restart completed successfully!"
microk8s kubectl get pods -n "$NAMESPACE" -o wide

echo "[INFO] Watch pod readiness with:"
echo "      microk8s kubectl get pods -n $NAMESPACE -w"
