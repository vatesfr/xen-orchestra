import ActionBar from 'action-bar'
import React from 'react'
import {
  addHostToPool
} from 'xo'

const NOT_IMPLEMENTED = () => {
  throw new Error('not implemented')
}

const PoolActionBar = ({ pool }) => (
  <ActionBar
    actions={[
      {
        icon: 'add-sr',
        label: 'addSrLabel',
        redirectOnSuccess: `new/sr?host=${pool.master}`
      },
      {
        icon: 'add-vm',
        label: 'addVmLabel',
        redirectOnSuccess: `vms/new?pool=${pool.id}`
      },
      {
        icon: 'add-host',
        label: 'addHostLabel',
        handler: addHostToPool
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
