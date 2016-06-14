import ActionBar from 'action-bar'
import React from 'react'
import {
  cloneVm,
  exportVm,
  migrateVm,
  restartVm,
  resumeVm,
  snapshotVm,
  startVm,
  stopVm
} from 'xo'

const NOT_IMPLEMENTED = () => {
  throw new Error('not implemented')
}

const vmActionBarByState = {
  Running: ({ vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-stop',
          label: 'stopVmLabel',
          handler: stopVm
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: restartVm
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: NOT_IMPLEMENTED
        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Halted: ({ vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'startVmLabel',
          handler: startVm
        },
        {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: cloneVm
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: NOT_IMPLEMENTED
        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Suspended: ({ vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'resumeVmLabel',
          handler: resumeVm
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: NOT_IMPLEMENTED
        }
      ]}
      display='icon'
      param={vm}
    />
  )
}

const VmActionBar = ({ vm }) => {
  const ActionBar = vmActionBarByState[vm.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} />
}
export default VmActionBar
