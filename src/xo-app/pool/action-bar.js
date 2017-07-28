import _ from 'intl'
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
      label={_('addSrLabel')}
      redirectOnSuccess={`new/sr?host=${pool.master}`}
    />
    <Action
      handler={NOT_IMPLEMENTED}
      icon='add-vm'
      label={_('addVmLabel')}
      redirectOnSuccess={`vms/new?pool=${pool.id}`}
    />
    <Action
      handler={addHostToPool}
      icon='add-host'
      label={_('addHostLabel')}
    />
    <Action
      handler={NOT_IMPLEMENTED} // TODO disconnect server
      icon='disconnect'
      label={_('disconnectServer')}
    />
  </ActionBar>
)
export default PoolActionBar
