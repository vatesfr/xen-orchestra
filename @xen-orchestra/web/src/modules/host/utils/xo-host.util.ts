import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmsPendingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE, VM_OPERATIONS } from '@vates/types'
import { type HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE } from '@vates/types'
import { castArray } from 'lodash-es'

export type XoHostState = 'running' | 'disabled' | 'halted' | 'unknown'

const RUNNING_CHANGING_STATE_OPERATIONS: Partial<HOST_ALLOWED_OPERATIONS>[] = [
  HOST_ALLOWED_OPERATIONS.SHUTDOWN,
  HOST_ALLOWED_OPERATIONS.REBOOT,
  HOST_ALLOWED_OPERATIONS.EVACUATE,
  HOST_ALLOWED_OPERATIONS.ENABLE,
]

const NOT_RUNNING_CHANGING_STATE_OPERATIONS: Partial<HOST_ALLOWED_OPERATIONS>[] = [HOST_ALLOWED_OPERATIONS.POWER_ON]

const SMART_REBOOT_SUSPENDING_VM_OPERATIONS: Partial<VM_OPERATIONS>[] = [
  VM_OPERATIONS.SUSPEND,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_SHUTDOWN,
]

export function isHostOperationPending(
  host: FrontXoHost,
  operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS
) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getHostPendingOperation(
  host: FrontXoHost,
  operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS
) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).find(operation => currentOperations.includes(operation))
}

export function getHostPendingStateOperation(host: FrontXoHost) {
  return getHostPendingOperation(
    host,
    host.power_state === HOST_POWER_STATE.RUNNING
      ? RUNNING_CHANGING_STATE_OPERATIONS
      : NOT_RUNNING_CHANGING_STATE_OPERATIONS
  )
}

export function getHostSmartRebootVmOperation(host: FrontXoHost, residentVms: FrontXoVm[]) {
  if (host.enabled) {
    return undefined
  }
  return getVmsPendingOperation(residentVms, SMART_REBOOT_SUSPENDING_VM_OPERATIONS)
}

export function getHostInfo(host: FrontXoHost | undefined): VtsLinkCellProps & { label: string } {
  return host ? { label: host.name_label, to: `/host/${host.id}/dashboard` } : { label: '' }
}

export function getHostState(host: FrontXoHost | undefined): XoHostState {
  if (!host || host.power_state === HOST_POWER_STATE.UNKNOWN) {
    return 'unknown'
  }

  if (host.power_state === HOST_POWER_STATE.HALTED) {
    return 'halted'
  }

  return host.enabled ? 'running' : 'disabled'
}
