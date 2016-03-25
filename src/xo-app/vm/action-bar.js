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
        // {
        //   icon: 'suspend',
        //   label: 'suspendVmLabel',
        //   handler: () => {}
        // },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          items: [
            {
              icon: 'vm-reboot',
              label: 'rebootVmLabel',
              handler: () => {}
            },
            {
              icon: 'force-reboot',
              label: 'forceRebootVmLabel',
              handler: () => {}
            }
          ]
        },
        {
          icon: 'migrate',
          label: 'migrateVmLabel',
          handler: () => {}
        },
<<<<<<< 796d4f5b08c5c9d56b36928e0fa6c87b9b7da1bc
        // {
        //   icon: 'force-reboot',
        //   label: 'forceRebootVmLabel',
        //   handler: () => {}
        // },
        // {
        //   icon: 'force-shutdown',
        //   label: 'forceShutdownVmLabel',
        //   handler: () => {}
        // },
=======
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
>>>>>>> ERR action-bar: `DropdownButton` incompatible with React 15
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
        }
      ]}
      display='both'
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
