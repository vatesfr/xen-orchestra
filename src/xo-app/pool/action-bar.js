import ActionBar from 'action-bar'
import React from 'react'

const NOT_IMPLEMENTED = () => {
  throw new Error('not implemented')
}

const PoolActionBar = ({ pool }) => (
  <ActionBar
    actions={[
      {
        icon: 'add-sr',
        label: 'addSrLabel',
        handler: NOT_IMPLEMENTED // TODO add sr
      },
      {
        icon: 'add-vm',
        label: 'addVmLabel',
        redirectOnSuccess: `vms/new?pool=${pool.id}`
      },
      {
        icon: 'add-host',
        label: 'addHostLabel',
        handler: NOT_IMPLEMENTED // TODO add host
      },
      {
        icon: 'disconnect',
        label: 'disconnectServer',
        handler: NOT_IMPLEMENTED // TODO disconnect server
      }
    ]}
    display='icon'
    param={pool}
  />
)
export default PoolActionBar
