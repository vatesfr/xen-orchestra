import ActionBar from 'action-bar'
import React from 'react'
import { connectStore } from 'utils'
import { includes } from 'lodash'
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
          handler: stopVm,
          pending: includes(vm.current_operations, 'clean_shutdown')
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: restartVm,
          pending: includes(vm.current_operations, 'clean_reboot')
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm,
          pending:
            includes(vm.current_operations, 'migrate_send') ||
            includes(vm.current_operations, 'pool_migrate')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy')
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
          handler: startVm,
          pending: includes(vm.current_operations, 'start')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: cloneVm,
          pending: includes(vm.current_operations, 'clone')
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm,
          pending: includes(vm.current_operations, 'pool_migrate')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy')
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
          handler: resumeVm,
          pending: includes(vm.current_operations, 'start')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export')
        },
        (isAdmin || !vm.resourceSet) && {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy')
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
