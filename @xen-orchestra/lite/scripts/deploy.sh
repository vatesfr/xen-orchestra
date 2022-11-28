#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]
then
  echo "Usage: ./deploy.sh <LDAP username>"
  exit 1
fi

USERNAME=$1
DIST="dist"
BASE="https://lite.xen-orchestra.com/dist"
SERVER="www-xo.gpn.vates.fr"

echo "Building XO Lite"

(cd ../.. && npm ci)
npm run build-only --base="$BASE"

echo "Deploying XO Lite from $DIST"

echo "\"use strict\";
(function () {
  const d = document;

  function js(file) {
    const s = d.createElement(\"script\");
    s.defer = \"defer\";
    s.type = \"module\";
    s.crossOrigin = \"anonymous\";
    s.src = file;
    d.body.appendChild(s);
  }
$(
  for filename in "$DIST"/assets/*.js; do
    echo "  js(\"$BASE/assets/$(basename $filename)\");"
  done
)

  function css(file) {
    const s = d.createElement(\"link\");
    s.rel = \"stylesheet\";
    s.href = file;
    d.head.appendChild(s);
  }
$(
  for filename in "$DIST"/assets/*.css; do
    echo "  css(\"$BASE/assets/$(basename $filename)\");"
  done
)
})();" > "$DIST/index.js"

rsync \
  -r --delete --delete-excluded --exclude=index.html \
  "$DIST"/ \
  "$USERNAME@$SERVER:xo-lite"

echo "XO Lite files sent to server"

echo "→ Connect to the server using:"
echo -e "\tssh $USERNAME@$SERVER"

echo "→ Log in as xo-lite using"
echo -e "\tsudo -su xo-lite"

echo "→ Then run the following command to move the files to the \`latest\` folder:"
echo -e "\trsync -r --delete --exclude=index.html /home/$USERNAME/xo-lite/ /home/xo-lite/public/latest"
