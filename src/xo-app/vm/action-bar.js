import ActionBar from 'action-bar'
import React from 'react'
import {
  cloneVm,
  restartVm,
  resumeVm,
  snapshotVm,
  startVm,
  stopVm
} from 'xo'

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-stop',
          label: 'stopVmLabel',
          handler: () => stopVm(vm)
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: () => restartVm(vm)
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => snapshotVm(vm, vm.name_label)
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: () => {}
        }
      ]}
      display='icon'
    />
  ),
  Halted: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'startVmLabel',
          handler: () => startVm(vm)
        },
        {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: () => cloneVm(vm)
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: () => snapshotVm(vm)
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: () => {}
        }
      ]}
      display='icon'
    />
  ),
  Suspended: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'resumeVmLabel',
          handler: () => resumeVm(vm)
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => snapshotVm(vm)
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: () => {}
        }
      ]}
      display='icon'
    />
  )
}

const VmActionBar = ({
  vm,
  handlers
}) => {
  const ActionBar = vmActionBarByState[vm.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} handlers={handlers} />
}
export default VmActionBar
