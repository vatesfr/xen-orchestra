import ActionBar from 'action-bar'
import React from 'react'

const NOT_IMPLEMENTED = () => {
  throw new Error('not implemented')
}

const SrActionBar = ({ sr }) => (
  <ActionBar
    actions={[
      {
        icon: 'refresh',
        label: 'srRescan',
        handler: NOT_IMPLEMENTED // TODO add sr
      },
      {
        icon: 'sr-reconnect-all',
        label: 'srReconnectAll',
        handler: NOT_IMPLEMENTED // TODO add VM
      },
      {
        icon: 'sr-disconnect-all',
        label: 'srDisconnectAll',
        handler: NOT_IMPLEMENTED // TODO add host
      },
      {
        icon: 'sr-forget',
        label: 'srForget',
        handler: NOT_IMPLEMENTED // TODO disconnect server
      }
    ]}
    display='icon'
    param={sr}
  />
)
export default SrActionBar
