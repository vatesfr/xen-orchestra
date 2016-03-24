import ActionBar from 'action-bar'
import React from 'react'

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-stop',
          label: 'stopVmLabel',
          handler: () => handlers.stopVm(vm.id)
        },
        {
          icon: 'suspend',
          label: 'suspendVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: () => {}
        },
        {
          icon: 'migrate',
          label: 'migrateVmLabel',
          handler: () => {}
        },
        {
          icon: 'force-reboot',
          label: 'forceRebootVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-delete',
          label: 'deleteVmLabel',
          handler: () => {}
        },
        {
          icon: 'force-shutdown',
          label: 'forceShutdownVmLabel',
          handler: () => {}
        },
        {
          icon: 'snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
        },
        {
          icon: 'export',
          label: 'exportVmLabel',
          handler: () => {}
        },
        {
          icon: 'copy',
          label: 'copyVmLabel',
          handler: () => {}
        },
        {
          icon: 'console',
          label: 'vmConsoleLabel',
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
          handler: () => handlers.startVm(vm.id)
        },
        {
          icon: 'recovery-mode',
          label: 'recoveryModeLabel',
          handler: () => {}
        },
        {
          icon: 'vm-delete',
          label: 'deleteVmLabel',
          handler: () => {}
        },
        {
          icon: 'clone',
          label: 'cloneVmLabel',
          handler: () => {}
        },
        {
          icon: 'create-template',
          label: 'convertToTemplateLabel',
          handler: () => {}
        },
        {
          icon: 'snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
        },
        {
          icon: 'export',
          label: 'exportVmLabel',
          handler: () => {}
        },
        {
          icon: 'copy',
          label: 'copyVmLabel',
          handler: () => {}
        },
        {
          icon: 'console',
          label: 'vmConsoleLabel',
          handler: () => {}
        }
      ]}
      display='icon'
    />
  )
}

export default ({
  vm,
  handlers
}) => {
  const ActionBar = vmActionBarByState[vm.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} handlers={handlers} />
}
