import ActionBar from 'action-bar'
import React from 'react'
import {
  // disableHost,
  emergencyShutdownHost,
  restartHost,
  restartHostAgent,
  startHost,
  stopHost
} from 'xo'

const hostActionBarByState = {
  Running: ({ host }) => (
    <ActionBar
      actions={[
        {
          icon: 'host-stop',
          label: 'stopHostLabel',
          handler: stopHost
        },
        {
          icon: 'host-restart-agent',
          label: 'restartHostAgent',
          handler: restartHostAgent
        },
        {
          icon: 'host-emergency-shutdown',
          label: 'emergencyModeLabel',
          handler: emergencyShutdownHost
        },
        {
          icon: 'host-reboot',
          label: 'rebootHostLabel',
          handler: restartHost
        }
      ]}
      display='icon'
      param={host}
    />
  ),
  Halted: ({ host }) => (
    <ActionBar
      actions={[
        {
          icon: 'host-start',
          label: 'startHostLabel',
          handler: startHost
        }
      ]}
      display='icon'
      param={host}
    />
  )
}

const HostActionBar = ({ host }) => {
  const ActionBar = hostActionBarByState[host.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {host.power_state}</p>
  }

  return <ActionBar host={host} />
}
export default HostActionBar
