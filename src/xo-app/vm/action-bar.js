import ActionBar from 'action-bar'
import React from 'react'
import { addSubscriptions, connectStore } from 'utils'
import { find, includes } from 'lodash'
import { createSelector, getCheckPermissions, getUser } from 'selectors'
import {
  cloneVm,
  copyVm,
  exportVm,
  migrateVm,
  restartVm,
  resumeVm,
  snapshotVm,
  startVm,
  stopVm,
  subscribeResourceSets
} from 'xo'

const vmActionBarByState = {
  Running: ({ vm, isSelfUser, canAdministrate }) => (
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
            includes(vm.current_operations, 'pool_migrate'),
          show: !isSelfUser
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot'),
          show: !isSelfUser
        },
        {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export'),
          show: !isSelfUser && canAdministrate
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy'),
          show: !isSelfUser && canAdministrate
        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Halted: ({ vm, isSelfUser, canAdministrate }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'startVmLabel',
          handler: startVm,
          pending: includes(vm.current_operations, 'start')
        },
        {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: cloneVm,
          pending: includes(vm.current_operations, 'clone'),
          show: !isSelfUser && canAdministrate
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: migrateVm,
          pending: includes(vm.current_operations, 'pool_migrate'),
          show: !isSelfUser
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot'),
          show: !isSelfUser
        },
        {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export'),
          show: !isSelfUser && canAdministrate
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy'),
          show: !isSelfUser && canAdministrate

        }
      ]}
      display='icon'
      param={vm}
    />
  ),
  Suspended: ({ vm, isSelfUser, canAdministrate }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-start',
          label: 'resumeVmLabel',
          handler: resumeVm,
          pending: includes(vm.current_operations, 'start')
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: snapshotVm,
          pending: includes(vm.current_operations, 'snapshot'),
          show: !isSelfUser
        },
        {
          icon: 'export',
          label: 'exportVmLabel',
          handler: exportVm,
          pending: includes(vm.current_operations, 'export'),
          show: !isSelfUser && canAdministrate
        },
        {
          icon: 'vm-copy',
          label: 'copyVmLabel',
          handler: copyVm,
          pending: includes(vm.current_operations, 'copy'),
          show: !isSelfUser && canAdministrate
        }
      ]}
      display='icon'
      param={vm}
    />
  )
}

const VmActionBar = addSubscriptions(() => ({
  resourceSets: subscribeResourceSets
}))(connectStore(() => ({
  checkPermissions: getCheckPermissions,
  userId: createSelector(getUser, user => user.id)
}))(({ checkPermissions, vm, userId, resourceSets }) => {
  // Is the user in the same resource set as the VM
  const _getIsSelfUser = createSelector(
    () => resourceSets,
    resourceSets =>
      vm.resourceSet && includes(
        find(resourceSets, { id: vm.resourceSet }).subjects,
        userId
      )
  )

  const _getCanAdministrate = createSelector(
    () => checkPermissions,
    () => vm.id,
    (check, vmId) => check(vmId, 'administrate')
  )

  const ActionBar = vmActionBarByState[vm.power_state]
  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} isSelfUser={_getIsSelfUser()} canAdministrate={_getCanAdministrate()} />
}))
export default VmActionBar
