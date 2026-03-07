// @ts-check

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { join } from 'node:path'
import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'

/** @typedef {import('./protectRemotes.mjs').XoLogger} XoLogger */

const { debug } = /** @type {XoLogger} */ (/** @type {unknown} */ (createLogger('xen-orchestra:immutable-backups:watcher')))

/**
 * @typedef {Object} WatchOptions
 * @property {number} [lockTimeout=600_000] - Milliseconds after which a
 *   datetime is evicted from the deduplication set inside watchVmDirectory.
 */

/**
 * Matches the datetime prefix shared by all files belonging to a single backup
 * run: `<YYYYMMDD>T<HHmmss>`.
 *
 * Examples:
 *   "20231215T142030.json"        → "20231215T142030"
 *   "20231215T142030.alias.vhd"   → "20231215T142030"
 *   "cache.json.gz"               → undefined  (not a backup file)
 */
const DATETIME_RE = /^(\d{8}T\d{6}Z?)\./

/**
 * @param {string} filename
 * @returns {string | undefined}
 */
function extractDatetime(filename) {
  return DATETIME_RE.exec(filename)?.[1]
}

/**
 * Make a file immutable, silently ignoring ENOENT (many files are optional
 * depending on the backup mode: xva, checksum, alias…).
 *
 * @param {string} path
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function tryLockFile(path, indexPath) {
  try {
    await File.makeImmutable(path, indexPath)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Make a VHD directory immutable (chattr +i -R), silently ignoring ENOENT.
 *
 * @param {string} path
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function tryLockDirectory(path, indexPath) {
  try {
    await Directory.makeImmutable(path, indexPath)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Lock all backup files for a single VDI directory that belong to `datetime`.
 *
 * Handles both storage modes:
 *   - **VHD directory**: `<datetime>.alias.vhd` + `data/<datetime>.vhd/`
 *   - **Plain VHD**:     `<datetime>.vhd`
 *
 * The VHD directory under `data/` is expected to be named `<datetime>.vhd`
 * (same datetime as the alias and the metadata json), not the legacy UUID name.
 *
 * @param {string} vdiDir    - Absolute path to `vdis/<jobId>/<vdiId>/`
 * @param {string} datetime  - e.g. `"20231215T142030"`
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function lockVdiFiles(vdiDir, datetime, indexPath) {
  await Promise.all([
    // VHD directory mode — alias pointer file
    tryLockFile(join(vdiDir, `${datetime}.alias.vhd`), indexPath),
    // VHD directory mode — the actual data directory (bat + header + footer + blocks)
    tryLockDirectory(join(vdiDir, 'data', `${datetime}.vhd`), indexPath),
    // Plain VHD file mode
    tryLockFile(join(vdiDir, `${datetime}.vhd`), indexPath),
  ])
}

/**
 * Scan every `vdis/<jobId>/<vdiId>/` directory under `vmDir` and lock all
 * files belonging to `datetime`.
 *
 * @param {string} vmDir
 * @param {string} datetime
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function lockAllVdis(vmDir, datetime, indexPath) {
  const vdisDir = join(vmDir, 'vdis')

  let jobIds
  try {
    jobIds = await fsp.readdir(vdisDir)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      return // no vdis directory — full backup with .xva only, nothing to do
    }
    throw err
  }

  await Promise.all(
    jobIds.map(async jobId => {
      let vdiIds
      try {
        vdiIds = await fsp.readdir(join(vdisDir, jobId))
      } catch {
        return
      }
      await Promise.all(
        vdiIds.map(vdiId => lockVdiFiles(join(vdisDir, jobId, vdiId), datetime, indexPath))
      )
    })
  )
}

/**
 * Lock every file belonging to the backup run identified by `datetime` inside
 * `vmDir`.  Called once the metadata `.json` has been detected, which
 * guarantees that all other files for that run have already been written.
 *
 * Files locked:
 *   - `<datetime>.json`
 *   - `<datetime>.xva`              (full backup only, may be absent)
 *   - `<datetime>.xva.checksum`     (pre-2025 or non-encrypted, may be absent)
 *   - all VDI files under `vdis/`   (alias, VHD dir, or plain VHD)
 *
 * @param {string} vmDir
 * @param {string} datetime
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function lockBackup(vmDir, datetime, indexPath) {
  debug(`[watcher] lockBackup: vmDir="${vmDir}" datetime="${datetime}"`)
  await Promise.all([
    tryLockFile(join(vmDir, `${datetime}.json`), indexPath),
    tryLockFile(join(vmDir, `${datetime}.xva`), indexPath),
    tryLockFile(join(vmDir, `${datetime}.xva.checksum`), indexPath),
    lockAllVdis(vmDir, datetime, indexPath),
  ])
  debug(`[watcher] lockBackup: done vmDir="${vmDir}" datetime="${datetime}"`)
}

/**
 * Watch a single VM backup directory (`xo-vm-backups/<VM UUID>/`) for
 * newly completed backups, and make all their files immutable atomically.
 *
 * **Trigger**: a metadata file `<YYYYMMDD>T<HHmmss>.json` appearing as a
 * direct child of `vmDir`, fully written (verified by parsing it as JSON).
 * The `.json` is always written last, so its validity guarantees that every
 * other file for that backup run is already fully written to disk.
 *
 * **Completeness check**: on every fs event for a `.json` file, the file is
 * read and parsed. A partial write produces a truncated or empty file that
 * fails JSON.parse — so we simply wait for the next event. No polling needed.
 *
 * **Atomicity**: either the `.json` is valid (whole backup is locked) or it
 * is not (partial upload — nothing is locked, files can be cleaned up freely).
 *
 * A single `fs.watch()` handle on `vmDir` is sufficient because the trigger
 * files are direct children; no recursive watching is needed here.
 *
 * @param {string}   vmDir      - Absolute path to the VM UUID directory
 * @param {string}   indexPath  - Absolute path to the immutability index directory
 * @param {(err: unknown) => void} onError - Called when a lock operation fails
 * @param {WatchOptions} [options]
 * @returns {() => void} Close function — stops the watcher
 */
export function watchVmDirectory(vmDir, indexPath, onError, { lockTimeout = 10 * 60 * 1000 } = {}) {
  const watcher = fs.watch(vmDir)

  // Tracks datetimes that are already locked or currently being locked,
  // preventing duplicate work when multiple fs events fire for the same file.
  // Each entry is evicted after `lockTimeout` ms so the set stays bounded.
  /** @type {Set<string>} */
  const lockedDatetimes = new Set()

  // Tracks the eviction timers so they can be cancelled eagerly on close,
  // rather than keeping the lockedDatetimes closure alive for lockTimeout ms.
  /** @type {Set<ReturnType<typeof setTimeout>>} */
  const evictionTimers = new Set()

  watcher.on(
    'change',
    /** @param {'rename'|'change'} _eventType @param {string | Buffer | null} filename */
    (_eventType, filename) => {
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
        return // e.g. cache.json.gz — not a backup metadata file
      }
      if (lockedDatetimes.has(datetime)) {
        return // already locked or locking in progress
      }

      const jsonPath = join(vmDir, name)
      fsp
        .readFile(jsonPath, 'utf8')
        .then(content => {
          JSON.parse(content) // throws SyntaxError if file is incomplete
          if (lockedDatetimes.has(datetime)) {
            return // another event raced us to it
          }
          lockedDatetimes.add(datetime)
          const timer = setTimeout(() => {
            lockedDatetimes.delete(datetime)
            evictionTimers.delete(timer)
          }, lockTimeout)
          timer.unref()
          evictionTimers.add(timer)
          debug(`[watcher] watchVmDirectory: locking backup datetime="${datetime}" in vmDir="${vmDir}"`)
          return lockBackup(vmDir, datetime, indexPath)
        })
        .catch(err => {
          const code = /** @type {NodeJS.ErrnoException} */ (err).code
          if (code === 'ENOENT' || err instanceof SyntaxError) {
            // File not yet fully written or transiently absent — the next fs
            // event will trigger another attempt.
            debug(`[watcher] watchVmDirectory: json not yet complete (${code ?? 'SyntaxError'}) — will retry on next event`)
            return
          }
          onError(err)
        })
    }
  )

  watcher.on('error', onError)

  return () => {
    watcher.close()
    watcher.removeAllListeners()
    for (const timer of evictionTimers) clearTimeout(timer)
    evictionTimers.clear()
    lockedDatetimes.clear()
  }
}

/**
 * Lock every file and subdirectory that is a direct child of `dir`.
 * Used to lock all files in a config/pool-metadata backup date directory
 * once `metadata.json` has been confirmed valid.
 *
 * @param {string} dir
 * @param {string} indexPath
 * @returns {Promise<void>}
 */
async function lockAllFilesInDir(dir, indexPath) {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  await Promise.all(
    entries.map(entry => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        return tryLockDirectory(fullPath, indexPath)
      } else {
        return  tryLockFile(fullPath, indexPath)
      }
    })
  )
}

/**
 * Watch a backup date directory (`<YYYYMMDD>T<HHmmss>/`) for its terminal
 * `metadata.json` file.  When `metadata.json` appears and parses as valid
 * JSON, every file in the directory is made immutable.
 *
 * Applies to both config backups (`data.json` + `metadata.json`) and pool
 * metadata backups (`data` + `metadata.json`): in both cases `metadata.json`
 * is written last, so its validity signals a complete backup.
 *
 * @param {string}   dateDir   - Absolute path to the `<YYYYMMDD>T<HHmmss>/` directory
 * @param {string}   indexPath
 * @param {(err: unknown) => void} onError
 * @returns {() => void} Close function
 */
function watchBackupDateDirectory(dateDir, indexPath, onError) {
  const watcher = fs.watch(dateDir)
  let locked = false

  watcher.on(
    'change',
    /** @param {'rename'|'change'} _eventType @param {string | Buffer | null} filename */
    (_eventType, filename) => {
      if (filename == null || String(filename) !== 'metadata.json') {
        return
      }
      if (locked) {
        return
      }
      fsp
        .readFile(join(dateDir, 'metadata.json'), 'utf8')
        .then(content => {
          JSON.parse(content) // throws SyntaxError if file is incomplete
          if (locked) {
            return
          }
          locked = true
          return lockAllFilesInDir(dateDir, indexPath)
        })
        .catch(err => {
          const code = /** @type {NodeJS.ErrnoException} */ (err).code
          if (code === 'ENOENT' || err instanceof SyntaxError) {
            return // not yet complete — wait for next event
          }
          onError(err)
        })
    }
  )

  watcher.on('error', onError)
  return () => {
    watcher.close()
    watcher.removeAllListeners()
  }
}

/**
 * Watch `dir` for subdirectories, invoke `makeChildWatcher` for each one,
 * and close the resulting child watcher when the subdirectory is removed.
 *
 * `makeChildWatcher` may return a close function directly (sync) or a Promise
 * that resolves to one (async).  Both forms are handled transparently.
 *
 * This is the building block for multi-level backup hierarchies:
 * composing calls produces watchers for arbitrarily deep trees.
 *
 * @param {string} dir
 * @param {(subdir: string) => (() => void) | Promise<() => void>} makeChildWatcher
 * @param {(err: unknown) => void} onError
 * @returns {Promise<() => void>} Close function
 */
async function watchSubdirectoriesWithChildren(dir, makeChildWatcher, onError) {
  /** @type {Map<string, Promise<() => void>>} */
  const childClosers = new Map()

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

/**
 * Watch `dir` for immediate subdirectory additions and deletions.
 *
 * - Creates `dir` if it does not exist.
 * - Installs the watcher *before* the initial scan so no directory created
 *   during the scan is missed.
 * - Calls `onAdd(subdir)` for every existing subdirectory at startup and for
 *   every new one that appears afterwards.
 * - Calls `onRemove(subdir)` when a subdirectory disappears.
 *
 * Only immediate children are observed; deeper nesting is the caller's
 * responsibility.
 *
 * @param {string}   dir
 * @param {{ onAdd: (subdir: string) => void, onRemove: (subdir: string) => void }} callbacks
 * @param {(err: unknown) => void} onError
 * @returns {Promise<() => void>} Close function
 */
async function watchSubdirectories(dir, { onAdd, onRemove }, onError) {
  await fsp.mkdir(dir, { recursive: true })

  const watcher = fs.watch(dir)

  watcher.on(
    'change',
    /** @param {'rename'|'change'} _eventType @param {string | Buffer | null} filename */
    (_eventType, filename) => {
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
        /** @param {NodeJS.ErrnoException} err */
        err => {
          if (err.code === 'ENOENT') {
            onRemove(subdir)
            return
          }
          onError(err)
        }
      )
    }
  )

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

/**
 * Watch a backup remote root and make all completed backup files immutable.
 *
 * Handles all three backup types:
 * - **VM backups** (`xo-vm-backups/<vmUUID>/`) — one watcher per VM UUID dir,
 *   triggered by `<YYYYMMDD>T<HHmmss>.json`
 * - **Config backups** (`xo-config-backups/<scheduleId>/<YYYYMMDD>T<HHmmss>/`) —
 *   triggered by `metadata.json`
 * - **Pool metadata backups** (`xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<YYYYMMDD>T<HHmmss>/`) —
 *   triggered by `metadata.json`
 *
 * @param {string}   root      - Absolute path to the backup remote root
 * @param {string}   indexPath - Absolute path to the immutability index directory
 * @param {(err: unknown) => void} onError
 * @param {WatchOptions} [options]
 * @returns {Promise<() => void>} Close function
 */
export async function watchRemote(root, indexPath, onError, options = {}) {
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
          dateDir => watchBackupDateDirectory(dateDir, indexPath, onError),
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
              dateDir => watchBackupDateDirectory(dateDir, indexPath, onError),
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
