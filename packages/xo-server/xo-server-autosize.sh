#!/usr/bin/env bash
#
# Computes a Node heap size (--max-old-space-size) from the VM's total RAM and
# writes it as NODE_MAX_OLD_SPACE to an ephemeral env file in /run, read by
# xo-server.service. Runs once at boot, before xo-server (see the .service unit).
#
# It NEVER touches /etc/default/xo-server: that file belongs to the admin and,
# being loaded last by xo-server.service, always overrides this computed value.
#
# Env overrides (testing): MEMINFO_PATH, XO_AUTOSIZE_OUT

set -euo pipefail

MEMINFO_PATH="${MEMINFO_PATH:-/proc/meminfo}"
XO_AUTOSIZE_OUT="${XO_AUTOSIZE_OUT:-/run/xo-server-autosize.env}"

detect_total_mem_mb() {
  local mb
  mb=$(awk '/^MemTotal:/ {print int($2/1024); found=1; exit} END {exit !found}' "$MEMINFO_PATH") || return 1
  [[ "$mb" =~ ^[0-9]+$ ]] && (( mb > 0 )) || return 1
  printf '%s\n' "$mb"
}

# headroom = clamp(512 + total*3%, 0, 4096) ; target = total - headroom
compute_target_mb() {
  local total_mb="$1" headroom_mb
  headroom_mb=$(( 512 + (total_mb * 3) / 100 ))
  (( headroom_mb > 4096 )) && headroom_mb=4096
  printf '%s\n' "$(( total_mb - headroom_mb ))"
}

main() {
  local total_mb target
  total_mb=$(detect_total_mem_mb) || { echo "xo-server-autosize: cannot read MemTotal from ${MEMINFO_PATH}" >&2; return 1; }
  target=$(compute_target_mb "$total_mb")
  printf 'NODE_MAX_OLD_SPACE=%s\n' "$target" > "$XO_AUTOSIZE_OUT"
  echo "xo-server-autosize: NODE_MAX_OLD_SPACE=${target} (total ${total_mb} MiB)"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
