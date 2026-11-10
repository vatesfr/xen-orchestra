#!/bin/bash

# Starts an empty XO from the checkout mounted in /opt/xen-orchestra, then loads the support bundle given as
# arguments (see load-cli.mjs)
#
# The container stops as soon as XO or the loader (which serves the XAPI objects) exits.

set -euo pipefail

if [ ! -f /opt/xen-orchestra/packages/xo-server/dist/cli.mjs ]; then
  echo 'mount a built Xen Orchestra checkout in /opt/xen-orchestra' >&2
  exit 1
fi

redis-server --save '' --appendonly no --daemonize yes

cd /opt/xen-orchestra/packages/xo-server
node dist/cli.mjs &
xoServer=$!

until curl --silent --fail --output /dev/null http://localhost/rest/v0/ping; do
  if ! kill -0 "$xoServer" 2>/dev/null; then
    echo 'xo-server exited before being ready' >&2
    exit 1
  fi
  sleep 1
done

node /opt/xen-orchestra/@xen-orchestra/virtual-support-twin/load-cli.mjs "$@" &

wait -n
