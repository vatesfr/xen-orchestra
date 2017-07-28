import ActionBar, { Action } from 'action-bar'
import React from 'react'
import {
  addHostToPool
} from 'xo'

const NOT_IMPLEMENTED = () => {
  throw new Error('not implemented')
}

const PoolActionBar = ({ pool }) => (
  <ActionBar
    display='icon'
    param={pool}
  >
    <Action
      handler={NOT_IMPLEMENTED}
      icon='add-sr'
      label='addSrLabel'
      redirectOnSuccess={`new/sr?host=${pool.master}`}
    />
    <Action
      handler={NOT_IMPLEMENTED}
      icon='add-vm'
      label='addVmLabel'
      redirectOnSuccess={`vms/new?pool=${pool.id}`}
    />
    <Action
      handler={addHostToPool}
      icon='add-host'
      label='addHostLabel'
    />
    <Action
      handler={NOT_IMPLEMENTED} // TODO disconnect server
      icon='disconnect'
      label='disconnectServer'
    />
  </ActionBar>
)
export default PoolActionBar
