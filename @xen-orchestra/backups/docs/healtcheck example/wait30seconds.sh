#!/bin/bash

# must be executed as root


IS_HEALTHCHECK=$(xenstore-read vm-data/health-check 2>&1)

#execute the check only during a healthcheck, not during a normal boot
if [[ $IS_HEALTHCHECK == "planned" ]]; then

  # not necessary, but can help to diagnose an error
  xenstore-write vm-data/health-check running

  # execute your check here, remember that there is no network on this VM
  sleep 30

  # mandatory to infom XO everything is ok
  xenstore-write vm-data/health-check success


else
  # in case of error , you can write a message to `vm-data/health-check-error`
  # that will show in the health check log on XO
  xenstore-write vm-data/health-check failure
  xenstore-write vm-data/health-check-error "$IS_HEALTHCHECK"
fi
