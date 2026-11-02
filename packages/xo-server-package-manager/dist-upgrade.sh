#!/bin/bash
#
# Upgrade the appliance to the next Debian release
#
# Started by the package-manager plugin in its own systemd unit, so that it survives the restart of xo-server.
# The full output is in the journal of the unit, the step is written to the state file (JSON) and the raw apt progress
# (APT::Status-Fd) to `<state file>.status-fd`, both read by the plugin.
#
# xo-server keeps running during the upgrade, to report the progress, and is restarted at the end, once the plugin has
# recorded it (`<state file>.ack`).
#
# Usage: dist-upgrade.sh <from version> <from codename> <to version> <to codename> <state file> [<xo-server unit>]

set -eu -o pipefail

if [ $# -lt 5 ]; then
  echo "usage: $0 <from version> <from codename> <to version> <to codename> <state file> [<xo-server unit>]" >&2
  exit 1
fi

FROM_VERSION=$1
FROM_CODENAME=$2
TO_VERSION=$3
TO_CODENAME=$4
STATE_FILE=$5
XO_SERVER_UNIT=${6:-}

# the codenames are used in a sed expression
for value in "$FROM_VERSION" "$TO_VERSION"; do
  [[ $value =~ ^[0-9]+$ ]] || { echo "invalid version: $value" >&2; exit 1; }
done
for value in "$FROM_CODENAME" "$TO_CODENAME"; do
  [[ $value =~ ^[a-z]+$ ]] || { echo "invalid codename: $value" >&2; exit 1; }
done

export DEBIAN_FRONTEND=noninteractive LC_ALL=C
# never prompt or restart services on our behalf, xo-server is restarted by this script
export APT_LISTCHANGES_FRONTEND=none NEEDRESTART_MODE=l UCF_FORCE_CONFFOLD=1

# keep the local version of modified config files instead of prompting, same as the package upgrades, and wait for
# the dpkg lock, e.g. held by unattended-upgrades
APT_GET=(apt-get -y -q -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o DPkg::Lock::Timeout=300)

SOURCES_BACKUP_DIR=/var/backups/xo-dist-upgrade-$FROM_CODENAME-$(date +%Y%m%d%H%M%S)
STARTED_AT=$(date +%s%3N)
STATUS_FD_FILE=$STATE_FILE.status-fd
ACK_FILE=$STATE_FILE.ack
# if xo-server does not acknowledge the end, e.g. it is dead, it is restarted anyway
ACK_TIMEOUT=30

step=starting
is_xo_server_restart_needed=false

write_state() {
  local status=$1 extra=${2:-}
  printf '{"status":"%s","step":"%s","from":{"versionId":%s,"codename":"%s"},"to":{"versionId":%s,"codename":"%s"},"startedAt":%s%s}\n' \
    "$status" "$step" "$FROM_VERSION" "$FROM_CODENAME" "$TO_VERSION" "$TO_CODENAME" "$STARTED_AT" "$extra" \
    >"$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

set_step() {
  step=$1
  echo "=== $step"
  # the progress of the previous step is not the one of this step
  : >"$STATUS_FD_FILE"
  write_state running
}

restore_sources() {
  echo "restoring the apt sources from $SOURCES_BACKUP_DIR"
  cp -a "$SOURCES_BACKUP_DIR/sources.list" /etc/apt/ 2>/dev/null || true
  rm -rf /etc/apt/sources.list.d
  cp -a "$SOURCES_BACKUP_DIR/sources.list.d" /etc/apt/
  apt_get_update || true
}

on_exit() {
  local exit_code=$?
  set +e

  if [ $exit_code -ne 0 ]; then
    # nothing has been installed from the next release yet: go back to a consistent state
    if [ $step = rewrite-sources ] || [ $step = update-next-release ]; then
      restore_sources
    fi
    write_state failure ",\"endedAt\":$(date +%s%3N),\"exitCode\":$exit_code"
  fi

  # even after a failure, so that it runs on the new libraries and the user can see what happened
  if [ $is_xo_server_restart_needed = true ] && [ -n "$XO_SERVER_UNIT" ]; then
    for _ in $(seq $ACK_TIMEOUT); do
      [ ! -e "$ACK_FILE" ] || break
      sleep 1
    done
    systemctl restart "$XO_SERVER_UNIT"
  fi
}

# `DPkg::Lock::Timeout` does not apply to the lists lock, e.g. held by the apt-daily timer or the background refresh of
# the plugin
apt_get_update() {
  local stderr_file=$STATE_FILE.stderr status
  for _ in $(seq 60); do
    status=0
    "${APT_GET[@]}" update 2>"$stderr_file" || status=$?
    cat "$stderr_file" >&2
    if [ $status -eq 0 ] || ! grep -q 'Unable to lock directory /var/lib/apt/lists' "$stderr_file"; then
      return $status
    fi
    sleep 5
  done
  return $status
}

# install with the progress written to the status-fd file, truncated for each command
apt_get_with_progress() {
  "${APT_GET[@]}" -o APT::Status-Fd=3 "$@" 3>"$STATUS_FD_FILE"
}
trap on_exit EXIT

set_step upgrade-current-release
apt_get_update
apt_get_with_progress upgrade

set_step backup-sources
mkdir -p "$SOURCES_BACKUP_DIR"
[ ! -e /etc/apt/sources.list ] || cp -a /etc/apt/sources.list "$SOURCES_BACKUP_DIR/"
cp -a /etc/apt/sources.list.d "$SOURCES_BACKUP_DIR/"

set_step rewrite-sources
# `bookworm`, `bookworm-updates`, `bookworm-security`… in the one-line (.list) and deb822 (.sources) formats
shopt -s nullglob
sources_files=(/etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources)
[ ! -e /etc/apt/sources.list ] || sources_files+=(/etc/apt/sources.list)
[ ${#sources_files[@]} -eq 0 ] || sed -i -E "s/\\b$FROM_CODENAME\\b/$TO_CODENAME/g" "${sources_files[@]}"

# fails if a source has no next release, before anything is installed from it
set_step update-next-release
apt_get_update

# recommended by the Debian release notes: minimal upgrade first, then the full one
set_step upgrade-next-release
is_xo_server_restart_needed=true
apt_get_with_progress upgrade --without-new-pkgs

set_step full-upgrade-next-release
apt_get_with_progress full-upgrade

step=done
write_state success ",\"endedAt\":$(date +%s%3N)"
