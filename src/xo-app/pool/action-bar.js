import ActionBar from 'action-bar'
import React from 'react'

const PoolActionBar = ({
  pool,
  handlers
}) => {
  return <ActionBar
    actions={[
      {
        icon: 'add-sr',
        label: 'addSrLabel',
        handler: () => null // TODO add sr
      },
      {
        icon: 'add-vm',
        label: 'addVmLabel',
        handler: () => null // TODO add VM
      },
      {
        icon: 'add-host',
        label: 'addHostLabel',
        handler: () => null // TODO add host
      },
      {
        icon: 'disconnect',
        label: 'disconnectServer',
        handler: () => null // TODO disconnect server
      }
    ]}
    display='icon'
  />
}
export default PoolActionBar
