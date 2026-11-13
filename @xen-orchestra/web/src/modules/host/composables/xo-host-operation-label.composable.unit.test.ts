import { useXoHostOperationLabel } from '@/modules/host/composables/xo-host-operation-label.composable.ts'
import { createHost } from '@/test/create-host.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE } from '@vates/types'

function mountHostOperationLabel() {
  return mountComposable(() => useXoHostOperationLabel()).wrapper.vm
}

describe('getHostOperationLabel', () => {
  it('maps a host operation to its in-progress label', () => {
    expect(mountHostOperationLabel().getHostOperationLabel(HOST_ALLOWED_OPERATIONS.EVACUATE)).toBe(
      t('operation-in-progress', { operation: t('operation:evacuate') })
    )
  })

  it('returns an empty label for an unknown operation', () => {
    expect(mountHostOperationLabel().getHostOperationLabel('some_unknown_op')).toBe('')
  })
})

describe('getHostIconTooltip', () => {
  it('shows the operation changing the host state', () => {
    const host = createHost({
      power_state: HOST_POWER_STATE.RUNNING,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT },
    })

    expect(mountHostOperationLabel().getHostIconTooltip(host)).toBe(
      t('operation-in-progress', { operation: t('operation:clean-reboot') })
    )
  })

  it('returns an empty tooltip while only a VM operation is pending on the host', () => {
    const host = createHost({
      power_state: HOST_POWER_STATE.RUNNING,
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.VM_START },
    })

    expect(mountHostOperationLabel().getHostIconTooltip(host)).toBe('')
  })

  it('returns an empty tooltip when no host is provided', () => {
    expect(mountHostOperationLabel().getHostIconTooltip(undefined)).toBe('')
  })
})
