import ActionBar from 'action-bar'
import React from 'react'

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-stop',
          label: 'stopVmLabel',
          handler: () => handlers.stopVm(vm.id),
          dropdownItems: [
            {
              icon: 'vm-suspend',
              label: 'suspendVmLabel',
              handler: () => {}
            },
            {
              icon: 'vm-force-shutdown',
              label: 'forceShutdownVmLabel',
              handler: () => {}
            }
          ]
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: () => {},
          dropdownItems: [
            {
              icon: 'vm-force-reboot',
              label: 'forceRebootVmLabel',
              handler: () => {}
            }
          ]
        },
        {
          icon: 'vm-migrate',
          label: 'migrateVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
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
        },
        {
          icon: 'vm-delete',
          label: 'deleteVmLabel',
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
          handler: () => handlers.startVm(vm.id),
          dropdownItems: [
            {
              icon: 'vm-recovery-mode',
              label: 'recoveryModeLabel',
              handler: () => {}
            }
          ]
        },
        {
          icon: 'vm-fast-clone',
          label: 'fastCloneVmLabel',
          handler: () => {},
          dropdownItems: [
            {
              icon: 'vm-clone',
              label: 'cloneVmLabel',
              handler: () => {}
            }
          ]
        },
        {
          icon: 'vm-create-template',
          label: 'convertVmToTemplateLabel',
          handler: () => {}
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
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
        },
        {
          icon: 'vm-delete',
          label: 'deleteVmLabel',
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
