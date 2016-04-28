import ActionBar from 'action-bar'
import React from 'react'
import {
  cloneVm,
  restartVm,
  resumeVm,
  snapshotVm,
  startVm,
  stopVm,
  suspendVm
} from 'xo'

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          icon: 'vm-stop',
          label: 'stopVmLabel',
          handler: () => stopVm(vm.id),
          dropdownItems: [
            {
              icon: 'vm-suspend',
              label: 'suspendVmLabel',
              handler: () => suspendVm(vm.id)
            },
            {
              icon: 'vm-force-shutdown',
              label: 'forceShutdownVmLabel',
              handler: () => stopVm(vm.id, true)
            }
          ]
        },
        {
          icon: 'vm-reboot',
          label: 'rebootVmLabel',
          handler: () => restartVm(vm.id),
          dropdownItems: [
            {
              icon: 'vm-force-reboot',
              label: 'forceRebootVmLabel',
              handler: () => restartVm(vm.id, true)
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
          handler: () => snapshotVm(vm.id, vm.name_label)
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
          handler: () => startVm(vm.id),
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
          handler: () => cloneVm(vm.id),
          dropdownItems: [
            {
              icon: 'vm-clone',
              label: 'cloneVmLabel',
              handler: () => cloneVm(vm.id, true)
            }
          ]
        },
        {
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: () => snapshotVm(vm.id)
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
          handler: () => resumeVm(vm.id)
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
          icon: 'vm-snapshot',
          label: 'snapshotVmLabel',
          handler: () => {}
        },
        {
          icon: 'vm-export',
          label: 'exportVmLabel',
          handler: () => snapshotVm(vm.id)
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
