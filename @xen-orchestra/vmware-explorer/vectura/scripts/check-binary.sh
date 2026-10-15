#!/usr/bin/env bash
# Checks the vectura binary given as the only argument. It links against
# glibc only and uses no glibc symbol newer than 2.31, the version build.sh
# links against and the glibc of Debian 11, the oldest system it supports:
# another library or a newer glibc fails here instead of on a user's machine.
# Before glibc 2.34, libpthread and libdl are libraries of their own, part
# of glibc all the same. Then it runs the binary: without a subcommand vectura exits
# 2 with a `vectura: ` line on standard error and nothing on standard output,
# which proves it runs and links. The Vectura workflow runs it.
set -euo pipefail
export LC_ALL=C
# a path with a slash, or running it would look it up in PATH
binary=$(realpath "$1")

test -x "$binary"

readelf --dynamic "$binary" | sed -n 's/.*(NEEDED).*\[\(.*\)\]$/\1/p' | while read -r library; do
  case $library in
    libc.so.6 | libm.so.6 | libpthread.so.0 | libdl.so.2 | ld-linux-x86-64.so.2) ;;
    *)
      echo "$binary needs $library" >&2
      exit 1
      ;;
  esac
done

newest=$(objdump -T "$binary" | grep -o 'GLIBC_[0-9.]*' | sort -u -V | tail -n 1)
if [ "$(printf '%s\n' "$newest" GLIBC_2.31 | sort -V | tail -n 1)" != GLIBC_2.31 ]; then
  echo "$binary needs $newest" >&2
  exit 1
fi

tmp=$(mktemp -d)
code=0
"$binary" > "$tmp/out" 2> "$tmp/err" || code=$?
test "$code" -eq 2
test ! -s "$tmp/out"
grep --quiet '^vectura: ' "$tmp/err"
