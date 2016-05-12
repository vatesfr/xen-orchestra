import ActionBar from 'action-bar'
import React from 'react'

const poolActionBarByState = {
  Default: ({ handlers, pool }) => (
    <ActionBar
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
  )
}

const PoolActionBar = ({
  pool,
  handlers
}) => {
  const ActionBar = poolActionBarByState['Default']

  if (!ActionBar) {
    return <p>No action bar for the pool</p>
  }

  return <ActionBar pool={pool} handlers={handlers} />
}
export default PoolActionBar
