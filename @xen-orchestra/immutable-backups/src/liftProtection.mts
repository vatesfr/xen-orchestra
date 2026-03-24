import fsp from 'node:fs/promises'
import { join } from 'node:path'
import * as Directory from './directory.mjs'
import * as File from './file.mjs'
import { createLogger } from '@xen-orchestra/log'
import { asyncEach } from '@vates/async-each'
import cleanXoCache from './_cleanXoCache.mjs'
import { RemoteConfig } from './_loadConfig.mjs'

const { warn } = createLogger('xen-orchestra:immutable-backups:liftProtection')

/**
 * Matches the datetime prefix shared by all files belonging to a single VM backup run.
 *
 * Examples:
 *   "20231215T142030.json"        → "20231215T142030"
 *   "20231215T142030Z.alias.vhd"  → "20231215T142030Z"
 *   "cache.json.gz"               → undefined  (not a backup file)
 */
const DATETIME_RE = /^(\d{8}T\d{6}Z?)\./

function extractDatetime(filename: string): string | undefined {
  return DATETIME_RE.exec(filename)?.[1]
}

// Returns the absolute paths of all immediate subdirectories of `dir`.
// Returns [] if `dir` does not exist.
async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => join(dir, e.name))
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

// Lift immutability from every file and subdirectory inside a date-stamped
// backup directory (config backup or pool-metadata backup).
async function liftDirBackup(dateDir: string): Promise<void> {
  const entries = await fsp.readdir(dateDir, { withFileTypes: true })
  const paths = entries.map(entry => join(dateDir, entry.name))
  await Directory.liftImmutabilityBatch(paths)
}

// Walk `xo-vm-backups/<vmUUID>/<datetime>.json` files and lift immutability on
// any VM backup run whose metadata mtime is older than `immutabilityDuration`.
// Per vmDir: vdis is read once, all expired datetimes are batched into a single
// liftImmutabilityBatch call, and cleanXoCache is called once.
async function liftExpiredVmBackups(root: string, immutabilityDuration: number): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  await asyncEach(await listDirs(join(root, 'xo-vm-backups')), async vmDir => {
    // 1. Find all expired datetimes in this vmDir.
    const entries = await fsp.readdir(vmDir, { withFileTypes: true }).catch(() => [])
    const expiredDatetimes: string[] = []
    let firstExpiredJsonPath: string | undefined

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      const datetime = extractDatetime(entry.name)
      if (datetime === undefined) continue // e.g. cache.json.gz
      const jsonPath = join(vmDir, entry.name)
      try {
        if (!(await File.isImmutable(jsonPath))) continue
        const { mtimeMs } = await fsp.stat(jsonPath)
        if (mtimeMs > threshold) continue
        expiredDatetimes.push(datetime)
        firstExpiredJsonPath ??= jsonPath
      } catch (err) {
        warn('error checking VM backup expiry', { err, jsonPath })
      }
    }

    if (expiredDatetimes.length === 0) return

    // 2. Read the vdis tree once for this vmDir.
    const vdisDir = join(vmDir, 'vdis')
    let jobIds: string[] = []
    try {
      jobIds = await fsp.readdir(vdisDir)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
    const vdiDirs: string[] = []
    await asyncEach(jobIds, async jobId => {
      let vdiIds: string[]
      try {
        vdiIds = await fsp.readdir(join(vdisDir, jobId))
      } catch {
        return
      }
      for (const vdiId of vdiIds) {
        vdiDirs.push(join(vdisDir, jobId, vdiId))
      }
    })

    // 3. Build all candidates for all expired datetimes in one pass.
    const candidates: string[] = []
    for (const datetime of expiredDatetimes) {
      candidates.push(
        join(vmDir, `${datetime}.json`),
        join(vmDir, `${datetime}.xva`),
        join(vmDir, `${datetime}.xva.checksum`)
      )
      for (const vdiDir of vdiDirs) {
        candidates.push(
          join(vdiDir, `${datetime}.vhd`),
          join(vdiDir, `${datetime}.alias.vhd`),
          join(vdiDir, 'data', `${datetime}.vhd`)
        )
      }
    }

    // 4. Single batch lift + single cache invalidation for this vmDir.
    try {
      await Directory.liftImmutabilityBatch(candidates)
      await cleanXoCache(firstExpiredJsonPath!)
    } catch (err) {
      warn('error lifting VM backup immutability', { err, vmDir })
    }
  })
}

// Walk `xo-config-backups/<scheduleId>/<datetime>/metadata.json` files and
// lift immutability on any backup directory whose metadata mtime is expired.
async function liftExpiredConfigBackups(root: string, immutabilityDuration: number): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  await asyncEach(await listDirs(join(root, 'xo-config-backups')), async scheduleDir => {
    for (const dateDir of await listDirs(scheduleDir)) {
      const metadataPath = join(dateDir, 'metadata.json')
      try {
        if (!(await File.isImmutable(metadataPath))) continue
        const { mtimeMs } = await fsp.stat(metadataPath)
        if (mtimeMs > threshold) continue
        await liftDirBackup(dateDir)
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code
        if (code !== 'ENOENT') warn('error lifting config backup immutability', { err, metadataPath })
      }
    }
  })
}

// Walk `xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<datetime>/metadata.json`
// files and lift immutability on any backup directory whose metadata mtime is expired.
async function liftExpiredPoolBackups(root: string, immutabilityDuration: number): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  await asyncEach(await listDirs(join(root, 'xo-pool-metadata-backups')), async scheduleDir => {
    for (const poolDir of await listDirs(scheduleDir)) {
      for (const dateDir of await listDirs(poolDir)) {
        const metadataPath = join(dateDir, 'metadata.json')
        try {
          if (!(await File.isImmutable(metadataPath))) continue
          const { mtimeMs } = await fsp.stat(metadataPath)
          if (mtimeMs > threshold) continue
          await liftDirBackup(dateDir)
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code
          if (code !== 'ENOENT') warn('error lifting pool metadata backup immutability', { err, metadataPath })
        }
      }
    }
  })
}

// Scan the filesystem for expired immutable backups under `root` and lift their
// immutability.  No index is required — the backup tree is walked directly.
export async function liftRemoteImmutability(root: string, immutabilityDuration: number): Promise<void> {
  await Promise.all([
    liftExpiredVmBackups(root, immutabilityDuration),
    liftExpiredConfigBackups(root, immutabilityDuration),
    liftExpiredPoolBackups(root, immutabilityDuration),
  ])
}

// Lift immutability on all expired backups across every configured remote.
export async function liftImmutability(remotes: Record<string, RemoteConfig>): Promise<void> {
  for (const [remoteId, { root, immutabilityDuration }] of Object.entries(remotes)) {
    await liftRemoteImmutability(root, immutabilityDuration).catch(err =>
      warn('error during liftRemoteImmutability', { err, remoteId, root, immutabilityDuration })
    )
  }
}
