import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_OPERATIONS } from '@vates/types'

function mountVmOperationLabel() {
  return mountComposable(() => useXoVmOperationLabel()).wrapper.vm
}

describe('getVmOperationLabel', () => {
  it('maps a VM operation to its in-progress label', () => {
    expect(mountVmOperationLabel().getVmOperationLabel(VM_OPERATIONS.SNAPSHOT)).toBe(
      t('operation-in-progress', { operation: t('operation:snapshot') })
    )
  })

  it('returns an empty label for an unknown operation', () => {
    expect(mountVmOperationLabel().getVmOperationLabel('some_unknown_op')).toBe('')
  })
})

describe('getVmIconTooltip', () => {
  it('shows the operation changing the power state, even when another operation is listed first', () => {
    const vm = createVm({
      current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT, 'task-2': VM_OPERATIONS.HARD_REBOOT },
    })

    expect(mountVmOperationLabel().getVmIconTooltip(vm)).toBe(
      t('operation-in-progress', { operation: t('operation:force-reboot') })
    )
  })

  it('returns an empty tooltip while no operation changes the power state', () => {
    const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.SNAPSHOT } })

    expect(mountVmOperationLabel().getVmIconTooltip(vm)).toBe('')
  })

  it('returns an empty tooltip when no VM is provided', () => {
    expect(mountVmOperationLabel().getVmIconTooltip(undefined)).toBe('')
  })
})
