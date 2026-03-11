import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { isDisk, openDisk } from '@xen-orchestra/backups/disks/openDisk.mjs'
import { formatBytes, renderTable } from '../utils.mjs'
import {asyncEach} from '@vates/async-each'
const HEADERS = ['File', 'UID', 'Size on disk', 'Virtual size', 'Differencing', 'Parent UID']

export type OkDiskInfo = {
  ok: true
  filename: string
  uid: string
  sizeOnDisk: string
  virtualSize: string
  differencing: boolean
  parentUid: string | null
}

export type ErrDiskInfo = { ok: false; filename: string; error: string }

export type DiskInfo = OkDiskInfo | ErrDiskInfo

// Topological sort: each child appears directly after its parent.
// Disks whose parent is absent from the list are treated as roots.
// Errored disks are appended at the end.
export function sortDisks(disks: DiskInfo[]): DiskInfo[] {
  const okDisks = disks.filter((d): d is OkDiskInfo => d.ok)
  const errDisks = disks.filter((d): d is ErrDiskInfo => !d.ok)

  const byUid = new Map(okDisks.map(d => [d.uid, d]))
  const childOf = new Map(okDisks.filter(d => d.differencing && d.parentUid !== null).map(d => [d.parentUid!, d]))

  const sorted: OkDiskInfo[] = []
  const visited = new Set<string>()

  // Roots: base disks or differencing disks whose parent is not in the list
  const roots = okDisks.filter(d => !d.differencing || d.parentUid === null || !byUid.has(d.parentUid))

  for (const root of roots) {
    let current: OkDiskInfo | undefined = root
    while (current !== undefined && !visited.has(current.uid)) {
      sorted.push(current)
      visited.add(current.uid)
      current = childOf.get(current.uid)
    }
  }

  // Append any orphaned differencing disks not reachable from a root
  for (const disk of okDisks) {
    if (!visited.has(disk.uid)) {
      sorted.push(disk)
    }
  }

  return [...sorted, ...errDisks]
}

export function toTableRow(disk: DiskInfo, prevDisk: DiskInfo | undefined): string[] {
  if (!disk.ok) {
    return [disk.filename, `(error: ${disk.error})`, '-', '-', '-', '-']
  }

  const parentIsAbove = disk.differencing && prevDisk?.ok && prevDisk.uid === disk.parentUid

  return [
    disk.filename,
    disk.uid,
    disk.sizeOnDisk,
    disk.virtualSize,
    disk.differencing ? 'yes' : 'no',
    disk.differencing ? (parentIsAbove ? '↑' : (disk.parentUid ?? '')) : '(none)',
  ]
}

export async function listCommand(handlerUrl: string, dirPath: string, _extraArgs: string[]): Promise<void> {
  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    const entries = await handler.list(dirPath, { prependDir: true })
    const diskPaths = entries.filter(entry => isDisk(handler, entry))

    if (diskPaths.length === 0) {
      console.log(`No disks found at ${dirPath}`)
      return
    }

    const disks: DiskInfo[] = []
    await asyncEach(diskPaths, async (diskPath:string) => {
      const filename = diskPath.slice(diskPath.lastIndexOf('/') + 1)
      try {
        const disk = await Disposable.use(openDisk(handler, diskPath), async disk => {
          const differencing = disk.isDifferencing()
          return {
            ok: true as const,
            filename,
            uid: disk.getUuid(),
            sizeOnDisk: formatBytes(disk.getSizeOnDisk()),
            virtualSize: formatBytes(disk.getVirtualSize()),
            differencing,
            parentUid: differencing ? disk.getParentUuid() : null,
          }
        })
        disks.push(disk)
      } catch (err) {
        disks.push({ ok: false as const, filename, error: err instanceof Error ? err.message : String(err) })
      }
    }, { concurrency: 4 })

    const sorted = sortDisks(disks)
    const rows = sorted.map((disk, i) => toTableRow(disk, sorted[i - 1]))
    console.log(renderTable(HEADERS, rows))
  })
}
