import ActionBar from 'action-bar'
import React from 'react'
import { forgetSr, rescanSr, reconnectAllHostsSr, disconnectAllHostsSr } from 'xo'

const SrActionBar = ({ sr }) => (
  <ActionBar
    actions={[
      {
        icon: 'refresh',
        label: 'srRescan',
        handler: rescanSr
      },
      {
        icon: 'sr-reconnect-all',
        label: 'srReconnectAll',
        handler: reconnectAllHostsSr
      },
      {
        icon: 'sr-disconnect-all',
        label: 'srDisconnectAll',
        handler: disconnectAllHostsSr
      },
      {
        icon: 'sr-forget',
        label: 'srForget',
        handler: forgetSr
      }
    ]}
    display='icon'
    param={sr}
  />
)
export default SrActionBar
