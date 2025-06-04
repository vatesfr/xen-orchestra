import { SynchronizedDisk } from '@xen-orchestra/disk-transform'
import cloneDeep from 'lodash/cloneDeep.js'

export function forkDeltaExport(deltaExport, label) {
  label += ' ' + Math.random()
  const { disks, ...rest } = deltaExport
  const fork = cloneDeep(rest)
  fork.disks = {}
  for (const [key, disk] of Object.entries(disks)) {
    if (!(disk instanceof SynchronizedDisk)) {
      throw new Error('Can only fork synchronized disks ')
    }
    fork.disks[key] = disk.fork(label)
  }
  return fork
}
