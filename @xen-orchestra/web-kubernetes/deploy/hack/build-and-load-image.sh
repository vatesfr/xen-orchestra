#!/usr/bin/env bash

# Builds the Kubernetes UI plugin image, loads it on every node of the current Kubernetes context (no registry needed)
# and deploys `deploy/kubernetes.yaml`.
#
# Usage: build-and-load-image.sh [image] user@ip
#
# Environment:
#   NAMESPACE   namespace to deploy to (default: xo-web-kubernetes)
#   SKIP_BUILD  set to 1 to reuse the local image instead of rebuilding it
#   SSH_OPTS    options passed to ssh

set -Eeuo pipefail

IMAGE="${1:-xo-web-kubernetes:0.0.0}"
SSH_LOGIN="${2:-}"
NAMESPACE="${NAMESPACE:-xo-web-kubernetes}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SSH_OPTS="${SSH_OPTS:--o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new}"

PACKAGE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
REPOSITORY_DIR="$(cd -- "$PACKAGE_DIR/../.." && pwd)"
MANIFEST="$PACKAGE_DIR/deploy/kubernetes.yaml"

# Must match `deploy/kubernetes.yaml`
DEPLOYMENT=xo-web-kubernetes
NODE_PORT=30081

usage() {
  echo "Usage: $0 [image] user@ip" >&2
  echo "Example: $0 xo-web-kubernetes:0.0.0 ubuntu@10.0.0.1" >&2
}

if [[ ! "$SSH_LOGIN" =~ ^[^@]+@[^@]+$ ]]; then
  echo "The second argument must use the user@ip format." >&2
  usage
  exit 1
fi

SSH_USER="${SSH_LOGIN%%@*}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_command docker
require_command kubectl
require_command ssh

echo "Kubernetes context: $(kubectl config current-context), namespace: $NAMESPACE"

# TEMPORARY: ExternalIP is also collected because the Xen Orchestra cloud-controller-manager
# (v1.2.0) only publishes the VM IP as ExternalIP on Nodes, with no InternalIP, whereas the
# CAPI provider reports the same IP as InternalIP on Machines. Drop the ExternalIP fallback
# once the CCM publishes an InternalIP.
# Fields are separated by "|" rather than tabs so that `read` keeps empty fields.
mapfile -t NODE_HOSTS < <(
  kubectl get nodes \
    -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{range .status.addresses[?(@.type=="InternalIP")]}{.address}{end}{"|"}{range .status.addresses[?(@.type=="ExternalIP")]}{.address}{end}{"\n"}{end}'
)

if ((${#NODE_HOSTS[@]} == 0)); then
  echo "No nodes found in the current Kubernetes context." >&2
  exit 1
fi

# Returns the address to reach a node: InternalIP, then ExternalIP (see above), then its name
node_host() {
  local node_name node_internal_ip node_external_ip
  IFS='|' read -r node_name node_internal_ip node_external_ip <<<"$1"
  echo "${node_internal_ip:-${node_external_ip:-$node_name}}"
}

ARCHIVE="$(mktemp "${TMPDIR:-/tmp}/xo-web-kubernetes-image.XXXXXX.tar")"
trap 'rm -f -- "$ARCHIVE"' EXIT

if [[ "$SKIP_BUILD" != 1 ]]; then
  echo "Building $IMAGE..."
  # The plugin depends on the monorepo: the build context is the repository root
  docker build --tag "$IMAGE" --file "$PACKAGE_DIR/Dockerfile" "$REPOSITORY_DIR"
fi

echo "Exporting the image..."
docker image save --output "$ARCHIVE" "$IMAGE"

for node_entry in "${NODE_HOSTS[@]}"; do
  node_name="${node_entry%%|*}"
  ssh_target="${SSH_USER}@$(node_host "$node_entry")"

  echo "Loading the image on $node_name ($ssh_target)..."
  # shellcheck disable=SC2086
  ssh $SSH_OPTS "$ssh_target" 'sudo sh -eu -c '\''
    if command -v microk8s >/dev/null 2>&1; then
      microk8s ctr image import -
    elif [ -x /snap/bin/microk8s ]; then
      /snap/bin/microk8s ctr image import -
    elif command -v k3s >/dev/null 2>&1; then
      k3s ctr images import -
    elif command -v ctr >/dev/null 2>&1; then
      ctr --namespace k8s.io images import -
    elif command -v nerdctl >/dev/null 2>&1; then
      nerdctl --namespace k8s.io load
    elif command -v docker >/dev/null 2>&1; then
      docker load
    elif [ -x /var/lib/rancher/rke2/bin/ctr ]; then
      # RKE2 uses containerd, but the ctr binary is not in PATH by default.
      /var/lib/rancher/rke2/bin/ctr --namespace k8s.io -a /run/k3s/containerd/containerd.sock images import -
    else
      echo "No supported container runtime found (microk8s, k3s, ctr, nerdctl, or docker)." >&2
      exit 1
    fi
  '\''' <"$ARCHIVE"
done

echo "Image $IMAGE loaded on ${#NODE_HOSTS[@]} node(s)."

echo "Deploying in the $NAMESPACE namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client --output yaml | kubectl apply --filename -
# The image is only present on the nodes: use it and never pull it from a registry
RENDERED_MANIFEST="$(sed \
  -e "s|^\(\s*image:\s*\).*$|\1$IMAGE|" \
  -e "s|^\(\s*imagePullPolicy:\s*\).*$|\1Never|" \
  "$MANIFEST")"
if ! grep -q "image: $IMAGE$" <<<"$RENDERED_MANIFEST" || ! grep -q "imagePullPolicy: Never$" <<<"$RENDERED_MANIFEST"; then
  echo "Cannot set the image in $MANIFEST" >&2
  exit 1
fi
kubectl apply --namespace "$NAMESPACE" --filename - <<<"$RENDERED_MANIFEST"
# The tag may be unchanged while the image was rebuilt
kubectl rollout restart deployment "$DEPLOYMENT" --namespace "$NAMESPACE"
kubectl rollout status deployment "$DEPLOYMENT" --namespace "$NAMESPACE" --timeout=180s

ENTRY_URL="http://$(node_host "${NODE_HOSTS[0]}"):$NODE_PORT/remoteEntry.js"

echo "Checking $ENTRY_URL..."
if command -v curl >/dev/null 2>&1 && curl --silent --fail --max-time 10 --output /dev/null "$ENTRY_URL"; then
  echo "The plugin is served."
else
  echo "Warning: $ENTRY_URL is not reachable from this machine (firewall, security group…)." >&2
fi

echo
echo "Declare the plugin in XO 6 (@xen-orchestra/web/.env, or the environment of its build):"
echo "  VITE_XO_UI_PLUGINS=xo_kubernetes=$ENTRY_URL"
