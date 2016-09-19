import ActionBar from 'action-bar'
import React from 'react'
import { connectStore } from 'utils'
import { isAdmin } from 'selectors'
import {
  cloneVm,
  copyVm,
  exportVm,
  migrateVm,
  restartVm,
  resumeVm,
  snapshotVm,
  startVm,
  stopVm
} from 'xo'

const vmActionBarByState = {
  Running: ({ isAdmin, vm }) => (
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
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm
        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Halted: ({ isAdmin, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'startVmLabel',
          handler: startVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: cloneVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm
        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Suspended: ({ isAdmin, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'resumeVmLabel',
          handler: resumeVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: exportVm
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm
        }
      ]}
      display='icon'
      param={vm}
    />
  )
}

const VmActionBar = connectStore({
  isAdmin
})(({ isAdmin, vm }) => {
  const ActionBar = vmActionBarByState[vm.power_state]
  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar isAdmin={isAdmin} vm={vm} />
})
export default VmActionBar
