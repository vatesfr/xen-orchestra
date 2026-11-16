import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { COMMON_TAG, VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { castArray, toLower } from 'lodash-es'

const CHANGING_POWER_STATE_OPERATIONS: Partial<VM_OPERATIONS>[] = [
  VM_OPERATIONS.START,
  VM_OPERATIONS.START_ON,
  VM_OPERATIONS.PAUSE,
  VM_OPERATIONS.UNPAUSE,
  VM_OPERATIONS.RESUME,
  VM_OPERATIONS.SUSPEND,
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.HARD_REBOOT,
  VM_OPERATIONS.SHUTDOWN,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_SHUTDOWN,
]

export const TRACKED_OPERATIONS: Partial<VM_OPERATIONS>[] = [
  ...CHANGING_POWER_STATE_OPERATIONS,
  VM_OPERATIONS.SNAPSHOT,
  VM_OPERATIONS.DESTROY,
  VM_OPERATIONS.CLONE,
  VM_OPERATIONS.COPY,
  VM_OPERATIONS.EXPORT,
  VM_OPERATIONS.IMPORT,
  VM_OPERATIONS.MIGRATE_SEND,
  VM_OPERATIONS.POOL_MIGRATE,
]

export const MIGRATION_OPERATIONS: VM_OPERATIONS[] = [VM_OPERATIONS.MIGRATE_SEND, VM_OPERATIONS.POOL_MIGRATE]

const POWER_STATES_BY_VM_OPERATION = {
  [VM_OPERATIONS.START]: [VM_POWER_STATE.HALTED],
  [VM_OPERATIONS.START_ON]: [VM_POWER_STATE.HALTED],
  [VM_OPERATIONS.PAUSE]: [VM_POWER_STATE.RUNNING],
  [VM_OPERATIONS.UNPAUSE]: [VM_POWER_STATE.PAUSED],
  [VM_OPERATIONS.RESUME]: [VM_POWER_STATE.SUSPENDED],
  [VM_OPERATIONS.SUSPEND]: [VM_POWER_STATE.RUNNING],
  [VM_OPERATIONS.CLEAN_REBOOT]: [VM_POWER_STATE.RUNNING, VM_POWER_STATE.PAUSED],
  [VM_OPERATIONS.HARD_REBOOT]: [VM_POWER_STATE.RUNNING, VM_POWER_STATE.PAUSED],
  [VM_OPERATIONS.CLEAN_SHUTDOWN]: [VM_POWER_STATE.RUNNING],
  [VM_OPERATIONS.HARD_SHUTDOWN]: [VM_POWER_STATE.RUNNING, VM_POWER_STATE.SUSPENDED, VM_POWER_STATE.PAUSED],
} satisfies Partial<Record<VM_OPERATIONS, VM_POWER_STATE[]>>

export type VmPowerStateOperation = keyof typeof POWER_STATES_BY_VM_OPERATION

const GUEST_TOOLS_OPERATIONS: VmPowerStateOperation[] = [
  VM_OPERATIONS.SUSPEND,
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
]

export function isVmMigrationBlocked(vm: FrontXoVm) {
  return MIGRATION_OPERATIONS.some(operation => vm.blockedOperations[operation] !== undefined)
}

export function isVmOperationPending(vm: FrontXoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getVmPendingPowerStateOperation(vm: FrontXoVm) {
  return getVmsPendingOperation([vm], CHANGING_POWER_STATE_OPERATIONS)
}

export function getVmIcon(vm: FrontXoVm | undefined) {
  if (vm === undefined) {
    return objectIcon('vm', 'unknown')
  }

  if (getVmPendingPowerStateOperation(vm) !== undefined) {
    return objectIcon('vm', 'busy')
  }

  return objectIcon('vm', toLower(vm.power_state))
}

export function areVmsOperationPending(vms: FrontXoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  return vms.some(vm => isVmOperationPending(vm, operations))
}

export function getVmsPendingOperation(vms: FrontXoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  for (const vm of vms) {
    const currentOperations = Object.values(vm.current_operations)
    const currentOperation = castArray(operations).find(operation => currentOperations.includes(operation))

    if (currentOperation !== undefined) {
      return currentOperation
    }
  }
}

export function isVmAllowingOperation(vm: FrontXoVm, operation: VmPowerStateOperation) {
  const powerStates: VM_POWER_STATE[] = POWER_STATES_BY_VM_OPERATION[operation]

  return powerStates.includes(vm.power_state)
}

export function areAllVmsAllowingOperation(vms: FrontXoVm[], operation: VmPowerStateOperation) {
  return vms.every(vm => isVmAllowingOperation(vm, operation))
}

export function notAllVmsAllowingOperation(vms: FrontXoVm[], operation: VmPowerStateOperation) {
  return !areAllVmsAllowingOperation(vms, operation)
}

export function getVmsAllowingOperation(vms: FrontXoVm[], operation: VmPowerStateOperation) {
  return vms.filter(vm => isVmAllowingOperation(vm, operation))
}

export function hasVmGuestTools(vm: FrontXoVm) {
  return vm.managementAgentDetected && vm.pvDriversDetected
}

export function isVmMissingGuestToolsFor(vm: FrontXoVm, operation: VmPowerStateOperation) {
  return GUEST_TOOLS_OPERATIONS.includes(operation) && !hasVmGuestTools(vm)
}

export function getVmIpAddresses(vm: FrontXoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}

export function extractVmHostId(vm: FrontXoVm) {
  return vm.$container === vm.$pool ? undefined : (vm.$container as FrontXoHost['id'])
}

export function vmContainsNoBakTag(vm: FrontXoVm) {
  return vm.tags.some(tag => tag.split('=', 1)[0] === COMMON_TAG.NOBAK)
}
