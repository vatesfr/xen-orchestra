import ActionBar from 'action-bar'
import React from 'react'
import {
  // disableHost,
  emergencyShutdownHost,
  enableHost,
  restartHost,
  restartHostAgent,
  startHost,
  stopHost
} from 'xo'

const hostActionBarByState = {
  Running: ({ handlers, host }) => (
    <ActionBar
      actions={[
        {
          icon: 'host-stop',
          label: 'stopHostLabel',
          handler: () => stopHost(host)
        },
        {
          icon: 'host-restart-agent',
          label: 'restartHostAgent',
          handler: () => restartHostAgent(host)
        },
        {
          icon: 'host-enable',
          label: 'enableHostLabel',
          handler: () => enableHost(host)
        },
        {
          icon: 'host-emergency-shutdown',
          label: 'emergencyModeLabel',
          handler: () => emergencyShutdownHost(host)
        },
        {
          icon: 'host-reboot',
          label: 'rebootHostLabel',
          handler: () => restartHost(host),
          dropdownItems: [
            {
              icon: 'host-force-reboot',
              label: 'forceRebootHostLabel',
              handler: () => restartHost(host, true)
            }
          ]
        }
      ]}
      display='icon'
    />
  ),
  Halted: ({ handlers, host }) => (
    <ActionBar
      actions={[
        {
          icon: 'host-start',
          label: 'startHostLabel',
          handler: () => startHost(host)
        }
      ]}
      display='icon'
    />
  )
}

const HostActionBar = ({
  host,
  handlers
}) => {
  const ActionBar = hostActionBarByState[host.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {host.power_state}</p>
  }

  return <ActionBar host={host} handlers={handlers} />
}
export default HostActionBar
