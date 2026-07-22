import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { isDisk, openDisposableDisk, RemoteDisk } from '@xen-orchestra/backup-archive/disks'
import { formatBytes, renderTable } from '../utils.mjs'
import { asyncEach } from '@vates/async-each'

// The "Size on disk" column is only shown with --size: computing it requires
// reading the block allocation table of every disk, which is costly.
function buildHeaders(showSize: boolean): string[] {
  return ['File', 'UID', ...(showSize ? ['Size on disk'] : []), 'Virtual size', 'Differencing', 'Parent UID']
}

export type OkDiskInfo = {
  ok: true
  filename: string
  uid: string
  sizeOnDisk?: string
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

export function toTableRow(disk: DiskInfo, prevDisk: DiskInfo | undefined, showSize: boolean): string[] {
  if (!disk.ok) {
    // filename + error message, then a placeholder for every remaining column.
    return [disk.filename, `(error: ${disk.error})`, ...Array(showSize ? 4 : 3).fill('-')]
  }

  const parentIsAbove = disk.differencing && prevDisk?.ok && prevDisk.uid === disk.parentUid

  return [
    disk.filename,
    disk.uid,
    ...(showSize ? [disk.sizeOnDisk ?? '-'] : []),
    disk.virtualSize,
    disk.differencing ? 'yes' : 'no',
    disk.differencing ? (parentIsAbove ? '↑' : (disk.parentUid ?? '')) : '(none)',
  ]
}

export async function listCommand(handlerUrl: string, dirPath: string, extraArgs: string[]): Promise<void> {
  const showSize = extraArgs.includes('--size')

  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    const entries = await handler.list(dirPath, { prependDir: true })
    const diskPaths = entries.filter(entry => isDisk(entry))

    if (diskPaths.length === 0) {
      console.log(`No disks found at ${dirPath}`)
      return
    }

    const disks: DiskInfo[] = []
    await asyncEach(
      diskPaths,
      async (diskPath: string) => {
        const filename = diskPath.slice(diskPath.lastIndexOf('/') + 1)
        try {
          const disk = await Disposable.use(
            openDisposableDisk({ handler, path: diskPath, ignoreBlockIndexes: !showSize }),
            async (disk: RemoteDisk) => {
              const differencing = disk.isDifferencing()
              return {
                ok: true as const,
                filename,
                uid: disk.getUuid(),
                sizeOnDisk: showSize ? formatBytes(disk.getSizeOnDisk()) : undefined,
                virtualSize: formatBytes(disk.getVirtualSize()),
                differencing,
                parentUid: differencing ? disk.getParentUuid() : null,
              }
            }
          )
          disks.push(disk)
        } catch (err) {
          disks.push({ ok: false as const, filename, error: err instanceof Error ? err.message : String(err) })
        }
      },
      { concurrency: 4 }
    )

    const sorted = sortDisks(disks)
    const rows = sorted.map((disk, i) => toTableRow(disk, sorted[i - 1], showSize))
    console.log(renderTable(buildHeaders(showSize), rows))
  })
}
