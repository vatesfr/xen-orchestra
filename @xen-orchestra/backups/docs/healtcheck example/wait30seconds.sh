#!/bin/bash

# must be executed as root


IS_HEALTHCHECK=$(xenstore-read vm-data/xo-backup-health-check 2>&1)

#execute the check only during a healthcheck, not during a normal boot
if [[ $IS_HEALTHCHECK == "planned" ]]; then

  # not necessary, but can help to diagnose an error
  xenstore-write vm-data/xo-backup-health-check running

  # execute your check here, remember that there is no network on this VM
  sleep 30

  # mandatory to inform XO everything is ok
  xenstore-write vm-data/xo-backup-health-check success


else
  # in case of error , you can write a message to `vm-data/health-check-error`
  # that will show in the health check log in XO
  xenstore-write vm-data/xo-backup-health-check failure
  xenstore-write vm-data/xo-backup-health-check-error "$IS_HEALTHCHECK"
fi
