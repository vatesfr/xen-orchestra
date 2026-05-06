#!/bin/sh
# Example script for DNS-01 challenge automation with xo-server.
#
# Usage:
#   1. Copy this file: cp dns-challenge.example.sh dns-challenge.sh
#   2. Make it executable: chmod +x dns-challenge.sh
#   3. Edit the "TODO" section below to call your DNS provider's API
#   4. Run it before or alongside xo-server (it handles the case where
#      xo-server starts before the script)
#
# Requirements: inotify-tools, jq

CHALLENGE_FILE=/etc/xo-server/dns-challenge.json
DONE_FILE="${CHALLENGE_FILE}.done"
CHALLENGE_DIR="$(dirname "$CHALLENGE_FILE")"
CHALLENGE_BASENAME="^$(basename "$CHALLENGE_FILE")$"

# Wait for the challenge file to appear.
# Uses a polling loop so the script works even if xo-server writes the file
# before this script's watches are established.
until [ -f "$CHALLENGE_FILE" ]; do
  inotifywait -t 2 -e create,close_write --include "$CHALLENGE_BASENAME" "$CHALLENGE_DIR" 2>/dev/null || true
done

DOMAIN=$(jq -r '.domain' "$CHALLENGE_FILE")
VALUE=$(jq -r '.value' "$CHALLENGE_FILE")

# TODO: call your DNS provider's API to create the TXT record.
#
# The record to create:
#   Type:  TXT
#   Name:  $DOMAIN  (e.g. _acme-challenge.my.domain.net)
#   Value: $VALUE   (the ACME key authorization token)
#
# Example with a fictional provider:
#   curl --silent --fail --request POST \
#     --header "Authorization: Bearer YOUR_API_TOKEN" \
#     --data "{\"name\":\"${DOMAIN}\",\"value\":\"${VALUE}\"}" \
#     https://api.your-dns-provider.com/v1/txt-records

echo "TXT record created for ${DOMAIN} — waiting for propagation if needed"

# TODO (optional): sleep here if your DNS provider has slow propagation.
# Let's Encrypt may fail validation if the record hasn't propagated yet.
# sleep 60

# Signal xo-server that the DNS record is ready.
touch "$DONE_FILE"
