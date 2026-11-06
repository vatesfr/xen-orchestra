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
