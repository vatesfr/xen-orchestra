import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { join } from 'node:path'
import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'

// @xen-orchestra/log has no .d.ts — methods are added dynamically at runtime.
type XoLogger = { debug: (msg: string, data?: object) => void }

const { debug } = createLogger('xen-orchestra:immutable-backups:watcher') as unknown as XoLogger

export interface WatchOptions {
  /** Milliseconds after which a datetime is evicted from the deduplication set inside watchVmDirectory. */
  lockTimeout?: number
}

/**
 * Matches the datetime prefix shared by all files belonging to a single backup run.
 *
 * Examples:
 *   "20231215T142030.json"        → "20231215T142030"
 *   "20231215T142030.alias.vhd"   → "20231215T142030"
 *   "cache.json.gz"               → undefined  (not a backup file)
 */
const DATETIME_RE = /^(\d{8}T\d{6}Z?)\./

function extractDatetime(filename: string): string | undefined {
  return DATETIME_RE.exec(filename)?.[1]
}

// Poll `path` with `fs.stat` until the file size stops changing, indicating the
// write is complete regardless of file format (plain or encrypted).
// The first stat is issued immediately; resolution requires a stable non-zero
// size across two consecutive polls spaced 100 ms apart.
// Rejects with an error if `timeout` ms elapse before stability is reached.
export async function waitForWriteDone(path: string, timeout: number): Promise<void> {
  const deadline = Date.now() + timeout
  let prevSize = -1

  while (Date.now() < deadline) {
    try {
      const { size } = await fsp.stat(path)
      if (size > 0 && size === prevSize) {
        return // non-empty and size stable — write done
      }
      prevSize = size
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
      // file not yet visible — keep waiting
    }
    await new Promise<void>(resolve => setTimeout(resolve, 100))
  }

  throw new Error(`Timeout waiting for write to complete on ${path}`)
}

// Make a file immutable, silently ignoring ENOENT (many files are optional
// depending on the backup mode: xva, checksum, alias…).
async function tryLockFile(path: string, indexPath: string): Promise<void> {
  try {
    await File.makeImmutable(path, indexPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

// Make a VHD directory immutable (`chattr +i -R`), silently ignoring ENOENT.
async function tryLockDirectory(path: string, indexPath: string): Promise<void> {
  try {
    await Directory.makeImmutable(path, indexPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

// Lock every file belonging to the backup run identified by `datetime` inside `vmDir`.
// Called once the terminal `.json` file is fully written, which guarantees all other
// files for that run are already fully written.
//
// Flat files (json, xva, checksum, plain/alias VHDs) are batched into a single
// `chattr +i` call. VHD directories need `chattr +i -R` and are handled separately.
async function lockBackup(vmDir: string, datetime: string, indexPath: string): Promise<void> {
  debug(`[watcher] lockBackup: vmDir="${vmDir}" datetime="${datetime}"`)

  const flatCandidates: string[] = [
    join(vmDir, `${datetime}.json`),
    join(vmDir, `${datetime}.xva`),
    join(vmDir, `${datetime}.xva.checksum`),
  ]
  const vhdDirCandidates: string[] = []

  const vdisDir = join(vmDir, 'vdis')
  let jobIds: string[] = []
  try {
    jobIds = await fsp.readdir(vdisDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }

  await Promise.all(
    jobIds.map(async jobId => {
      let vdiIds: string[]
      try {
        vdiIds = await fsp.readdir(join(vdisDir, jobId))
      } catch {
        return
      }
      for (const vdiId of vdiIds) {
        const vdiDir = join(vdisDir, jobId, vdiId)
        flatCandidates.push(join(vdiDir, `${datetime}.vhd`))
        flatCandidates.push(join(vdiDir, `${datetime}.alias.vhd`))
        vhdDirCandidates.push(join(vdiDir, 'data', `${datetime}.vhd`))
      }
    })
  )

  await Promise.all([
    File.makeImmutableBatch(flatCandidates, indexPath),
    ...vhdDirCandidates.map(dir => tryLockDirectory(dir, indexPath)),
  ])

  debug(`[watcher] lockBackup: done vmDir="${vmDir}" datetime="${datetime}"`)
}

// Watch a single VM backup directory (`xo-vm-backups/<VM UUID>/`) for newly
// completed backups and lock all their files.
//
// Trigger: a `<YYYYMMDD>T<HHmmss>.json` file appearing as a direct child whose
// size is stable (write complete). The `.json` is always written last, so its
// stability guarantees that every other file for that run is fully written.
//
// Returns a close function that stops the watcher.
export function watchVmDirectory(
  vmDir: string,
  indexPath: string,
  onError: (err: unknown) => void,
  { lockTimeout = 10 * 60 * 1000 }: WatchOptions = {}
): () => void {
  const watcher = fs.watch(vmDir)

  // Deduplicates lock attempts when multiple fs events fire for the same datetime.
  // Entries are evicted after `lockTimeout` ms to keep the set bounded.
  const lockedDatetimes = new Set<string>()

  watcher.on('change', (_eventType: string, filename: string | Buffer | null) => {
    if (filename == null) {
      return
    }
    const name = String(filename)
    debug(`[watcher] watchVmDirectory(${vmDir}): event filename="${name}"`)
    if (!name.endsWith('.json')) {
      return
    }
    const datetime = extractDatetime(name)
    debug(`[watcher] watchVmDirectory: extractDatetime("${name}") → ${datetime}`)
    if (datetime === undefined) {
      debug(`[watcher] watchVmDirectory: ignoring "${name}" — does not match DATETIME_RE ${DATETIME_RE}`)
      return // e.g. cache.json.gz
    }
    // ensure we handle event once per file
    // clear up the remaingin data after a reasonnable tie
    if (lockedDatetimes.has(datetime)) {
      return
    }
    lockedDatetimes.add(datetime)
    setTimeout(() => {
      lockedDatetimes.delete(datetime)
    }, lockTimeout).unref()

    const jsonPath = join(vmDir, name)
    waitForWriteDone(jsonPath, lockTimeout)
      .then(() => {
        debug(`[watcher] watchVmDirectory: locking backup datetime="${datetime}" in vmDir="${vmDir}"`)
        return lockBackup(vmDir, datetime, indexPath)
      })
      .catch(err => {
        const code = (err as NodeJS.ErrnoException).code
        if (code === 'ENOENT') {
          // file disappeared before write completed — next fs event will retry
          debug(`[watcher] watchVmDirectory: file gone (ENOENT) — will retry on next event`)
          return
        }
        onError(err)
      })
  })

  watcher.on('error', onError)

  return () => {
    watcher.close()
    watcher.removeAllListeners()
  }
}

// Lock every file and subdirectory that is a direct child of `dir`.
// Used for config/pool-metadata backups once `metadata.json` is confirmed written.
async function lockAllFilesInDir(dir: string, indexPath: string): Promise<void> {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  await Promise.all(
    entries.map(entry => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        return tryLockDirectory(fullPath, indexPath)
      } else {
        return tryLockFile(fullPath, indexPath)
      }
    })
  )
}

// Watch a backup date directory (`<YYYYMMDD>T<HHmmss>/`) for its terminal
// `metadata.json`. When its write is complete, all files in the directory are
// made immutable.
//
// Applies to both config backups and pool metadata backups: `metadata.json`
// is always written last.
//
// Returns a close function.
function watchBackupDateDirectory(
  dateDir: string,
  indexPath: string,
  onError: (err: unknown) => void,
  { lockTimeout = 10 * 60 * 1000 }: WatchOptions = {}
): () => void {
  const watcher = fs.watch(dateDir)
  let locked = false

  watcher.on('change', (_eventType: string, filename: string | Buffer | null) => {
    if (filename == null || String(filename) !== 'metadata.json') {
      return
    }
    if (locked) {
      return
    }
    const metadataPath = join(dateDir, 'metadata.json')
    waitForWriteDone(metadataPath, lockTimeout)
      .then(() => {
        if (locked) {
          return
        }
        locked = true
        return lockAllFilesInDir(dateDir, indexPath)
      })
      .catch(err => {
        const code = (err as NodeJS.ErrnoException).code
        if (code === 'ENOENT') {
          return // file gone — wait for next event
        }
        onError(err)
      })
  })

  watcher.on('error', onError)
  return () => {
    watcher.close()
    watcher.removeAllListeners()
  }
}

// Watch `dir` for subdirectories, invoke `makeChildWatcher` for each one,
// and close the child watcher when the subdirectory is removed.
//
// `makeChildWatcher` may return a close function or a Promise that resolves to one.
async function watchSubdirectoriesWithChildren(
  dir: string,
  makeChildWatcher: (subdir: string) => (() => void) | Promise<() => void>,
  onError: (err: unknown) => void
): Promise<() => void> {
  const childClosers = new Map<string, Promise<() => void>>()

  const closeWatcher = await watchSubdirectories(
    dir,
    {
      onAdd: subdir => {
        if (!childClosers.has(subdir)) {
          childClosers.set(
            subdir,
            Promise.resolve(makeChildWatcher(subdir)).catch(err => {
              onError(err)
              return () => {}
            })
          )
        }
      },
      onRemove: subdir => {
        const p = childClosers.get(subdir)
        childClosers.delete(subdir)
        p?.then(close => close()).catch(onError)
      },
    },
    onError
  )

  return () => {
    closeWatcher()
    for (const p of childClosers.values()) {
      p.then(close => close()).catch(onError)
    }
    childClosers.clear()
  }
}

// Watch `dir` for immediate subdirectory additions and deletions. Creates `dir`
// if it does not exist. Calls `onAdd` for each existing and new subdirectory,
// and `onRemove` when one disappears.
async function watchSubdirectories(
  dir: string,
  { onAdd, onRemove }: { onAdd: (subdir: string) => void; onRemove: (subdir: string) => void },
  onError: (err: unknown) => void
): Promise<() => void> {
  await fsp.mkdir(dir, { recursive: true })

  const watcher = fs.watch(dir)

  watcher.on('change', (_eventType: string, filename: string | Buffer | null) => {
    if (filename == null) {
      return
    }
    const subdir = join(dir, String(filename))
    debug(`[watcher] watchSubdirectories(${dir}): event filename="${String(filename)}"`)
    fsp.stat(subdir).then(
      stat => {
        if (stat.isDirectory()) {
          debug(`[watcher] watchSubdirectories: new dir detected "${subdir}"`)
          onAdd(subdir)
        } else {
          debug(`[watcher] watchSubdirectories: "${subdir}" is not a directory (isFile=${stat.isFile()}) — ignored`)
        }
      },
      (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          onRemove(subdir)
          return
        }
        onError(err)
      }
    )
  })

  watcher.on('error', onError)

  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      onAdd(join(dir, entry.name))
    }
  }

  return () => {
    watcher.close()
    watcher.removeAllListeners()
  }
}

// Watch a backup remote root and lock all completed backup files.
//
// Handles three backup types:
// - VM backups (`xo-vm-backups/<vmUUID>/`) — triggered by `<YYYYMMDD>T<HHmmss>.json`
// - Config backups (`xo-config-backups/<scheduleId>/<YYYYMMDD>T<HHmmss>/`) — triggered by `metadata.json`
// - Pool metadata (`xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<YYYYMMDD>T<HHmmss>/`) — triggered by `metadata.json`
//
// Returns a close function.
export async function watchRemote(
  root: string,
  indexPath: string,
  onError: (err: unknown) => void,
  options: WatchOptions = {}
): Promise<() => void> {
  const [closeVmWatcher, closeConfigWatcher, closePoolWatcher] = await Promise.all([
    // xo-vm-backups/<vmUUID>/
    watchSubdirectoriesWithChildren(
      join(root, 'xo-vm-backups'),
      vmDir => watchVmDirectory(vmDir, indexPath, onError, options),
      onError
    ),

    // xo-config-backups/<scheduleId>/<YYYYMMDD>T<HHmmss>/
    watchSubdirectoriesWithChildren(
      join(root, 'xo-config-backups'),
      scheduleDir =>
        watchSubdirectoriesWithChildren(
          scheduleDir,
          dateDir => watchBackupDateDirectory(dateDir, indexPath, onError, options),
          onError
        ),
      onError
    ),

    // xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<YYYYMMDD>T<HHmmss>/
    watchSubdirectoriesWithChildren(
      join(root, 'xo-pool-metadata-backups'),
      scheduleDir =>
        watchSubdirectoriesWithChildren(
          scheduleDir,
          poolDir =>
            watchSubdirectoriesWithChildren(
              poolDir,
              dateDir => watchBackupDateDirectory(dateDir, indexPath, onError, options),
              onError
            ),
          onError
        ),
      onError
    ),
  ])

  return () => {
    closeVmWatcher()
    closeConfigWatcher()
    closePoolWatcher()
  }
}
