import _ from 'intl'
import ActionBar, { Action } from 'action-bar'
import React from 'react'
import { addSubscriptions, connectStore } from 'utils'
import { find, includes } from 'lodash'
import { createSelector, getCheckPermissions, getUser } from 'selectors'
import { cloneVm, copyVm, exportVm, migrateVm, restartVm, snapshotVm, startVm, stopVm, subscribeResourceSets } from 'xo'

const vmActionBarByState = {
  Running: ({ vm, isSelfUser, canAdministrate }) => (
    <ActionBar display='icon' handlerParam={vm}>
      <Action
        handler={stopVm}
        icon='vm-stop'
        label={_('stopVmLabel')}
        pending={includes(vm.current_operations, 'clean_shutdown')}
      />
      <Action
        handler={restartVm}
        icon='vm-reboot'
        label={_('rebootVmLabel')}
        pending={includes(vm.current_operations, 'clean_reboot')}
      />
      {!isSelfUser && (
        <Action
          handler={migrateVm}
          icon='vm-migrate'
          label={_('migrateVmLabel')}
          pending={includes(vm.current_operations, 'migrate_send') || includes(vm.current_operations, 'pool_migrate')}
        />
      )}
      <Action
        handler={snapshotVm}
        icon='vm-snapshot'
        label={_('snapshotVmLabel')}
        pending={includes(vm.current_operations, 'snapshot')}
      />
      {!isSelfUser && canAdministrate && (
        <Action
          handler={exportVm}
          icon='export'
          label={_('exportVmLabel')}
          pending={includes(vm.current_operations, 'export')}
        />
      )}
      {!isSelfUser && canAdministrate && (
        <Action
          handler={copyVm}
          icon='vm-copy'
          label={_('copyVmLabel')}
          pending={includes(vm.current_operations, 'copy')}
        />
      )}
    </ActionBar>
  ),
  Halted: ({ vm, isSelfUser, canAdministrate }) => (
    <ActionBar display='icon' handlerParam={vm}>
      <Action
        handler={startVm}
        icon='vm-start'
        label={_('startVmLabel')}
        pending={includes(vm.current_operations, 'start')}
      />
      {!isSelfUser && canAdministrate && (
        <Action
          handler={cloneVm}
          icon='vm-fast-clone'
          label={_('fastCloneVmLabel')}
          pending={includes(vm.current_operations, 'clone')}
        />
      )}
      {!isSelfUser && (
        <Action
          handler={migrateVm}
          icon='vm-migrate'
          label={_('migrateVmLabel')}
          pending={includes(vm.current_operations, 'migrate_send') || includes(vm.current_operations, 'pool_migrate')}
        />
      )}
      {!isSelfUser && (
        <Action
          handler={snapshotVm}
          icon='vm-snapshot'
          label={_('snapshotVmLabel')}
          pending={includes(vm.current_operations, 'snapshot')}
        />
      )}
      {!isSelfUser && canAdministrate && (
        <Action
          handler={exportVm}
          icon='export'
          label={_('exportVmLabel')}
          pending={includes(vm.current_operations, 'export')}
        />
      )}
      {!isSelfUser && canAdministrate && (
        <Action
          handler={copyVm}
          icon='vm-copy'
          label={_('copyVmLabel')}
          pending={includes(vm.current_operations, 'copy')}
        />
      )}
    </ActionBar>
  ),
  Suspended: ({ vm, isSelfUser, canAdministrate }) => (
    <ActionBar display='icon' handlerParam={vm}>
      <Action
        handler={startVm}
        icon='vm-start'
        label={_('resumeVmLabel')}
        pending={includes(vm.current_operations, 'start')}
      />
      {!isSelfUser && (
        <Action
          handler={snapshotVm}
          icon='vm-snapshot'
          label={_('snapshotVmLabel')}
          pending={includes(vm.current_operations, 'snapshot')}
        />
      )}
      {!isSelfUser && canAdministrate && (
        <Action
          handler={exportVm}
          icon='export'
          label={_('exportVmLabel')}
          pending={includes(vm.current_operations, 'export')}
        />
      )}
      {!isSelfUser && canAdministrate && (
        <Action
          handler={copyVm}
          icon='vm-copy'
          label={_('copyVmLabel')}
          pending={includes(vm.current_operations, 'copy')}
        />
      )}
    </ActionBar>
  ),
  Paused: ({ vm, isSelfUser }) => (
    <ActionBar display='icon' handlerParam={vm}>
      <Action
        handler={startVm}
        icon='vm-start'
        label={_('resumeVmLabel')}
        pending={includes(vm.current_operations, 'unpause')}
      />
      {!isSelfUser && (
        <Action
          handler={snapshotVm}
          icon='vm-snapshot'
          label={_('snapshotVmLabel')}
          pending={includes(vm.current_operations, 'snapshot')}
        />
      )}
    </ActionBar>
  ),
}

const VmActionBar = addSubscriptions(() => ({
  resourceSets: subscribeResourceSets,
}))(
  connectStore(() => ({
    checkPermissions: getCheckPermissions,
    user: getUser,
  }))(({ checkPermissions, vm, user, resourceSets }) => {
    // Is the user in the same resource set as the VM
    const _getIsSelfUser = createSelector(
      () => resourceSets,
      resourceSets => {
        const vmResourceSet = vm.resourceSet && find(resourceSets, { id: vm.resourceSet })

        return (
          vmResourceSet &&
          (includes(vmResourceSet.subjects, user.id) ||
            user.groups.some(groupId => includes(vmResourceSet.subjects, groupId)))
        )
      }
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
  })
)
export default VmActionBar
