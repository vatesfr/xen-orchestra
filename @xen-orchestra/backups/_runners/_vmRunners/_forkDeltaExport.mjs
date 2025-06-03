import { SynchronizedDisk } from '@xen-orchestra/disk-transform'
import cloneDeep from 'lodash/cloneDeep.js'

export function forkDeltaExport(deltaExport, label) {
  const { disks, ...rest } = deltaExport
  const fork = cloneDeep(rest)
  fork.disks = {}
  for (const key in deltaExport.disks) {
    const disk = deltaExport.disks[key]
    if (!(disk instanceof SynchronizedDisk)) {
      throw new Error('Can only fork synchronized disks ')
    }
    fork.disks[key] = disk.fork(label)
  }
  return fork
}
