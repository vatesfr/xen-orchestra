import ActionBar from 'action-bar'
import React from 'react'

const SrActionBar = ({ sr }) => (
  <ActionBar
    actions={[
      {
        icon: 'refresh',
        label: 'srRescan',
        handler: () => null // TODO add sr
      },
      {
        icon: 'sr-reconnect-all',
        label: 'srReconnectAll',
        handler: () => null // TODO add VM
      },
      {
        icon: 'sr-disconnect-all',
        label: 'srDisconnectAll',
        handler: () => null // TODO add host
      },
      {
        icon: 'sr-forget',
        label: 'srForget',
        handler: () => null // TODO disconnect server
      }
    ]}
    display='icon'
  />
)
export default SrActionBar
