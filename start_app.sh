#!/usr/bin/bash
set -euo pipefail

NAMESPACE="grapharna"
RELEASE="grapharna-web"
CHART_PATH="./GraphaRNA-web"
VALUES_FILE="$CHART_PATH/values.yaml"

echo "[INFO] Startup: starts the app. This script is idempotent. If the app is in a DEPLOYED state nothing will change."

# --- Basic checks ---
command -v microk8s >/dev/null 2>&1 || { echo "[ERROR] microk8s not found"; exit 1; }

if [ ! -d "$CHART_PATH" ]; then
  echo "[ERROR] Chart path not found: $CHART_PATH"
  echo "       Run script from repo root or adjust CHART_PATH."
  exit 1
fi

# --- Start MicroK8s ---
echo "[INFO] Starting MicroK8s..."
microk8s start
echo "[INFO] Waiting for MicroK8s to be ready..."
microk8s status --wait-ready

# --- Ensure addons ---
echo "[INFO] Ensuring required addons are enabled..."
microk8s enable dns helm3 storage ingress cert-manager >/dev/null || true

# --- Check if release exists ---
if microk8s helm3 status "$RELEASE" -n "$NAMESPACE" >/dev/null 2>&1; then
  # Release exists -> check its STATUS
  STATUS_LINE="$(microk8s helm3 status "$RELEASE" -n "$NAMESPACE" 2>/dev/null | awk -F': ' '/^STATUS:/{print $2}')"
  STATUS="$(echo "${STATUS_LINE:-unknown}" | tr '[:upper:]' '[:lower:]')"

  if [ "$STATUS" = "deployed" ]; then
    echo "[INFO] Release '$RELEASE' is already DEPLOYED in namespace '$NAMESPACE'."
    echo "[INFO] Skipping any install/upgrade to avoid changing image tags."
    echo "[INFO] Current pods:"
    microk8s kubectl get pods -n "$NAMESPACE" -o wide
    exit 0
  else
    echo "[ERROR] Release '$RELEASE' exists but status is '$STATUS'."
    echo "        Not making changes in startup mode."
    echo "        Suggested: run a dedicated reset/repair script or investigate:"
    echo "          microk8s helm3 status $RELEASE -n $NAMESPACE"
    echo "          microk8s kubectl get pods -n $NAMESPACE -o wide"
    exit 1
  fi
fi

echo "[INFO] Release '$RELEASE' not found. Installing..."

microk8s helm3 install "$RELEASE" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --values "$VALUES_FILE" \
  --wait --timeout 10m

echo "[INFO] Installation completed."
microk8s kubectl get pods -n "$NAMESPACE" -o wide
echo "[INFO] Tip: watch readiness:"
echo "      microk8s kubectl get pods -n $NAMESPACE -w"
