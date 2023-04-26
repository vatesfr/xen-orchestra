#!/bin/sh

# This script must be executed at the start of the machine.
#
# It must run as root to be able to use xenstore-read and xenstore-write

# fail in case of error or undefined variable
set -eu

# stop there if a health check is not in progress
if [ "$(xenstore-read vm-data/xo-backup-health-check 2>&1)" != planned ]
then
  exit
fi

# not necessary, but informs XO that this script has started which helps diagnose issues
xenstore-write vm-data/xo-backup-health-check running

# put your test here
#
# in this example, the command `sqlite3` is used to validate the health of a database
# and its output is captured and passed to XO via the XenStore in case of error
if output=$(sqlite3 ~/my-database.sqlite3 .table 2>&1)
then
  # inform XO everything is ok
  xenstore-write vm-data/xo-backup-health-check success
else
  # inform XO there is an issue
  xenstore-write vm-data/xo-backup-health-check failure

  # more info about the issue can be written to `vm-data/health-check-error`
  #
  # it will be shown in XO
  xenstore-write vm-data/xo-backup-health-check-error "$output"
fi
