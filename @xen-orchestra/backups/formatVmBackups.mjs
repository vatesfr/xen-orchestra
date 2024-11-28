import mapValues from 'lodash/mapValues.js'
import { dirname } from 'node:path'

function formatVmBackup(backup) {
  const { isVhdDifferencing, vmSnapshot } = backup

  let differencingVhds
  let dynamicVhds
  // some backups don't use snapshots, therefore cannot be with memory
  const withMemory = vmSnapshot !== undefined && vmSnapshot.suspend_VDI !== 'OpaqueRef:NULL'
  // isVhdDifferencing is either undefined or an object
  if (isVhdDifferencing !== undefined) {
    differencingVhds = Object.values(isVhdDifferencing).filter(t => t).length
    dynamicVhds = Object.values(isVhdDifferencing).filter(t => !t).length
    if (withMemory) {
      // the suspend VDI (memory) is always a dynamic
      dynamicVhds -= 1
    }
  }
  return {
    disks:
      backup.vhds === undefined
        ? []
        : Object.keys(backup.vhds).map(vdiId => {
            const vdi = backup.vdis[vdiId]
            return {
              id: `${dirname(backup._filename)}/${backup.vhds[vdiId]}`,
              name: vdi.name_label,
              uuid: vdi.uuid,
            }
          }),

    id: backup.id,
    isImmutable: backup.isImmutable,
    dedup: backup.dedup,
    jobId: backup.jobId,
    mode: backup.mode,
    scheduleId: backup.scheduleId,
    size: backup.size,
    timestamp: backup.timestamp,
    vm: {
      name_description: backup.vm.name_description,
      name_label: backup.vm.name_label,
    },

    differencingVhds,
    dynamicVhds,
    withMemory,
  }
}

// format all backups as returned by RemoteAdapter#listAllVmBackups()
export function formatVmBackups(backupsByVM) {
  return mapValues(backupsByVM, backups => backups.map(formatVmBackup))
}
