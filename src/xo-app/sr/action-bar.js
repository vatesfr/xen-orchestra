import ActionBar, { Action } from 'action-bar'
import React from 'react'
import { forgetSr, rescanSr, reconnectAllHostsSr, disconnectAllHostsSr } from 'xo'

const SrActionBar = ({ sr }) => (
  <ActionBar
    display='icon'
    param={sr}
  >
    <Action
      handler={rescanSr}
      label='srRescan'
      icon='refresh'
    />
    <Action
      handler={reconnectAllHostsSr}
      label='srReconnectAll'
      icon='sr-reconnect-all'
    />
    <Action
      handler={disconnectAllHostsSr}
      label='srDisconnectAll'
      icon='sr-disconnect-all'
    />
    <Action
      handler={forgetSr}
      label='srForget'
      icon='sr-forget'
    />
  </ActionBar>
)
export default SrActionBar
