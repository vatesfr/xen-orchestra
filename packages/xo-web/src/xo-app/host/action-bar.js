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

const _restartHostAgent = ({ host, fetchStats }) => {
  //  Don't fetch host stats because there is no connection to the host during restart toolstack.
  fetchStats(null)
  setTimeout(fetchStats, 300e3)

  return restartHostAgent(host)
}

const hostActionBarByState = {
  Running: props => (
    <ActionBar display='icon' handlerParam={props}>
      <Action handler={stopHost} icon='host-stop' label={_('stopHostLabel')} />
      <Action handler={_restartHostAgent} icon='host-restart-agent' label={_('restartHostAgent')} />
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

const HostActionBar = ({ host, fetchStats }) => {
  const ActionBar = hostActionBarByState[host.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {host.power_state}</p>
  }

  return <ActionBar host={host} fetchStats={fetchStats} />
}
export default HostActionBar
