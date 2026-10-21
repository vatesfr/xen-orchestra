import type { V2vUnsupportedCheck, V2vVmCheck } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import type { V2vUnsupportedReason } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { V2V_DISK_MODE, type XoV2vDisk, type XoV2vVm } from '@vates/types'

const INDEPENDENT_DISK_MODES: V2V_DISK_MODE[] = [
  V2V_DISK_MODE.INDEPENDENT_PERSISTENT,
  V2V_DISK_MODE.INDEPENDENT_NON_PERSISTENT,
]

// Ordered by precedence: a VM shows only the first reason any of its disks meets
const UNSUPPORTED_DISK_CHECKS: [V2vUnsupportedReason, (disk: XoV2vDisk) => boolean][] = [
  ['rdm', disk => disk.isRdm],
  ['independent', disk => INDEPENDENT_DISK_MODES.includes(disk.mode)],
  ['encrypted', disk => disk.isEncrypted],
]

export function getV2vUnsupportedReason(vm: Pick<XoV2vVm, 'disks'>): V2vUnsupportedReason | undefined {
  return UNSUPPORTED_DISK_CHECKS.find(([, isUnsupportedDisk]) => vm.disks.some(isUnsupportedDisk))?.[0]
}

export function getV2vUnsupportedCheck(reason: V2vUnsupportedReason): V2vUnsupportedCheck {
  return { type: 'unsupported', level: 'blocking', reason }
}

export function getV2vVmChecks(vm: Pick<XoV2vVm, 'disks' | 'snapshotCount'>): V2vVmCheck[] {
  const unsupportedReason = getV2vUnsupportedReason(vm)

  return [
    unsupportedReason === undefined
      ? { type: 'no-unsupported-disk', level: 'ready' }
      : getV2vUnsupportedCheck(unsupportedReason),
    vm.snapshotCount === 0
      ? { type: 'no-snapshot', level: 'ready' }
      : { type: 'snapshots', level: 'warning', count: vm.snapshotCount },
  ]
}
