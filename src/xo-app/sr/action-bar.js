import ActionBar from 'action-bar'
import React from 'react'
import { srForget, srRescan, srReconnectAllHosts, srDisconnectAllHosts } from 'xo'

const SrActionBar = ({ sr }) => (
  <ActionBar
    actions={[
      {
        icon: 'refresh',
        label: 'srRescan',
        handler: srRescan
      },
      {
        icon: 'sr-reconnect-all',
        label: 'srReconnectAll',
        handler: srReconnectAllHosts
      },
      {
        icon: 'sr-disconnect-all',
        label: 'srDisconnectAll',
        handler: srDisconnectAllHosts
      },
      {
        icon: 'sr-forget',
        label: 'srForget',
        handler: srForget
      }
    ]}
    display='icon'
    param={sr}
  />
)
export default SrActionBar
