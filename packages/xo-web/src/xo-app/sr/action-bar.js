import _ from 'intl'
import ActionBar, { Action } from 'action-bar'
import React from 'react'
import { forgetSr, rescanSr, reconnectAllHostsSr, disconnectAllHostsSr } from 'xo'

const SrActionBar = ({ sr }) => (
  <ActionBar display='icon' handlerParam={sr}>
    <Action handler={rescanSr} label={_('srRescan')} icon='refresh' />
    <Action handler={reconnectAllHostsSr} label={_('srReconnectAll')} icon='sr-reconnect-all' />
    <Action handler={disconnectAllHostsSr} label={_('srDisconnectAll')} icon='sr-disconnect-all' />
    <Action handler={forgetSr} label={_('srForget')} icon='sr-forget' />
  </ActionBar>
)
export default SrActionBar
