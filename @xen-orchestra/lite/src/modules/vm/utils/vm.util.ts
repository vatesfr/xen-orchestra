import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm, XenApiVmGuestMetrics } from '@/libs/xen-api/xen-api.types.ts'

export const CHANGING_STATE_OPERATIONS: VM_OPERATION[] = [
  VM_OPERATION.START,
  VM_OPERATION.START_ON,
  VM_OPERATION.PAUSE,
  VM_OPERATION.UNPAUSE,
  VM_OPERATION.RESUME,
  VM_OPERATION.SUSPEND,
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.SHUTDOWN,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.SNAPSHOT,
  VM_OPERATION.DESTROY,
  VM_OPERATION.CLONE,
  VM_OPERATION.COPY,
  VM_OPERATION.EXPORT,
  VM_OPERATION.IMPORT,
]

/**
 * Adapted from `getVmGuestToolsProps` in xo-server (`packages/xo-server/src/xapi-object-to-xo.mjs`),
 * which computes `managementAgentDetected` and `pvDriversDetected` on XO VM objects.
 *
 * The XS < 7 fallback (`PV_drivers_detected ?? hasPvVersion`) is intentionally not reproduced.
 *
 * @see https://github.com/vatesfr/xen-orchestra/blob/master/packages/xo-server/src/xapi-object-to-xo.mjs
 */
export function areVmToolsDetected(guestMetrics: XenApiVmGuestMetrics | undefined): boolean {
  if (guestMetrics === undefined) {
    return false
  }

  const { major, minor } = guestMetrics.PV_drivers_version
  const hasPvVersion = major !== undefined && minor !== undefined

  const pvDriversDetected = guestMetrics.PV_drivers_detected
  const managementAgentDetected = hasPvVersion || guestMetrics.other['feature-static-ip-setting'] === '1'

  return managementAgentDetected && pvDriversDetected
}

export type VmPowerStateAction =
  | 'start'
  | 'pause'
  | 'suspend'
  | 'resume'
  | 'reboot'
  | 'force-reboot'
  | 'shutdown'
  | 'force-shutdown'

type VmPowerStateQuickAction = Exclude<VmPowerStateAction, 'pause' | 'suspend'>

export type VmQuickAction = VmPowerStateQuickAction | 'migrate' | 'snapshot'

function getVmPowerStateQuickActions(vm: XenApiVm, areToolsDetected: boolean): VmPowerStateQuickAction[] {
  switch (vm.power_state) {
    case VM_POWER_STATE.RUNNING:
      return areToolsDetected ? ['shutdown', 'reboot'] : ['force-shutdown', 'force-reboot']
    case VM_POWER_STATE.HALTED:
      return ['start']
    case VM_POWER_STATE.PAUSED:
    case VM_POWER_STATE.SUSPENDED:
      return ['resume']
  }
}

export function getVmQuickActions(vm: XenApiVm, areToolsDetected: boolean): VmQuickAction[] {
  return [...getVmPowerStateQuickActions(vm, areToolsDetected), 'migrate', 'snapshot']
}
