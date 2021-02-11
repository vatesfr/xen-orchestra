import _ from 'intl'
import ActionBar, { Action } from 'action-bar'
import React from 'react'
import {
  // disableHost,
  emergencyShutdownHost,
  restartHost,
  restartHostAgent,
  startHost,
  stopHost,
} from 'xo'

const hostActionBarByState = {
  Running: ({ host }) => (
    <ActionBar display='icon' handlerParam={host}>
      <Action handler={stopHost} icon='host-stop' label={_('stopHostLabel')} />
      <Action handler={restartHostAgent} icon='host-restart-agent' label={_('restartHostAgent')} />
      <Action handler={emergencyShutdownHost} icon='host-emergency-shutdown' label={_('emergencyModeLabel')} />
      <Action handler={restartHost} icon='host-reboot' label={_('rebootHostLabel')} />
    </ActionBar>
  ),
  Halted: ({ host }) => (
    <ActionBar display='icon' handlerParam={host}>
      <Action handler={startHost} icon='host-start' label={_('startHostLabel')} />
    </ActionBar>
  ),
}

const HostActionBar = ({ host }) => {
  const ActionBar = hostActionBarByState[host.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {host.power_state}</p>
  }

  return <ActionBar host={host} />
}
export default HostActionBar
