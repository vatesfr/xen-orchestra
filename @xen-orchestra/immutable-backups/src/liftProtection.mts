import fsp from 'node:fs/promises'
import { join, basename } from 'node:path'
import * as Directory from './directory.mjs'
import * as File from './file.mjs'
import { createLogger } from '@xen-orchestra/log'
import { asyncEach } from '@vates/async-each'
import cleanXoCache from './_cleanXoCache.mjs'
import { RemoteConfig } from './_loadConfig.mjs'

import { extractDatetime, parseDatetime } from './_datetime.mjs'

const { debug, warn } = createLogger('xen-orchestra:immutable-backups:liftProtection')

// On the very first lift run after startup, skip the isImmutable fast-path so
// that orphaned immutable VHDs/XVAs left by a previous partial or buggy lock
// are caught and released even when the .json sentinel is already mutable.
let isFirstLift = true

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
async function liftExpiredVmBackups(root: string, immutabilityDuration: number, fullScan: boolean): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  const vmDirs = await listDirs(join(root, 'xo-vm-backups'))
  debug('scanning VM backup directories', { count: vmDirs.length, fullScan })
  await asyncEach(vmDirs, async vmDir => {
    // 1. Find all expired datetimes in this vmDir.
    const entries = await fsp.readdir(vmDir, { withFileTypes: true }).catch(() => [])
    const expiredDatetimes: string[] = []
    let firstExpiredJsonPath: string | undefined

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      const datetime = extractDatetime(entry.name)
      if (datetime === undefined) continue // e.g. cache.json.gz
      const backupTimestamp = parseDatetime(datetime)
      if (backupTimestamp === undefined || backupTimestamp > threshold) continue
      const jsonPath = join(vmDir, entry.name)
      try {
        if (!fullScan && !(await File.isImmutable(jsonPath))) continue
        debug('VM backup expired, scheduling lift', { jsonPath })
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
      if (err.code !== 'ENOENT') throw err
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
      debug('VM backups lifted', { vmDir, count: expiredDatetimes.length })
    } catch (err) {
      warn('error lifting VM backup immutability', { err, vmDir })
    }
  })
}

// `liftExpiredVmBackups` names the files of a backup from the datetime of its `<datetime>.json`,
// like the watcher does when locking them. A disk can outlive that name:
//
// - retention deletes the metadata json first and leaves the disks to the next `cleanVm`, so
//   nothing names them any more;
// - a merge renames a disk, and the surviving `data/<datetime>.vhd` keeps the name of the older
//   backup its blocks came from.
//
// Such a disk would stay immutable forever — a full scan does not help, it only bypasses the
// `isImmutable` fast-path — and an immutable disk blocks every future merge and deletion in its VDI
// directory. So walk the VDI directories themselves and lift what is expired, using the datetime in
// each entry's own name, which is the reference the other passes use too.
//
// Only runs on the first pass after startup: it recovers states that should not happen, and looking
// hourly would not make it more effective.
async function liftExpiredOrphanDisks(root: string, immutabilityDuration: number): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  const vmDirs = await listDirs(join(root, 'xo-vm-backups'))
  debug('scanning VDI directories for expired disks', { count: vmDirs.length })
  await asyncEach(vmDirs, async vmDir => {
    // disks live under `vdis/<jobId>/<vdiId>/`, so two levels of directories to walk first
    const jobDirs = await listDirs(join(vmDir, 'vdis'))
    const vdiDirs = (await Promise.all(jobDirs.map(jobDir => listDirs(jobDir)))).flat()

    await asyncEach(vdiDirs, async vdiDir => {
      try {
        // `<datetime>.vhd` (flat VHD or alias) and `<datetime>.alias.vhd`
        const entries = await fsp.readdir(vdiDir, { withFileTypes: true })
        const candidates = entries.map(entry => join(vdiDir, entry.name))

        // `data/<datetime>.vhd` VHD directories. They are locked recursively, but the attribute is
        // set on the directory itself too, so its own entry is enough to decide — no need to look
        // at the blocks inside.
        if (entries.some(entry => entry.name === 'data' && entry.isDirectory())) {
          const dataDir = join(vdiDir, 'data')
          candidates.push(...(await fsp.readdir(dataDir)).map(name => join(dataDir, name)))
        }

        const expired: string[] = []
        for (const path of candidates) {
          // Entries without a datetime — `data` itself, merge state files — are left alone: there
          // is nothing to compare them to.
          const datetime = extractDatetime(basename(path))
          if (datetime === undefined) continue
          const backupTimestamp = parseDatetime(datetime)
          if (backupTimestamp === undefined || backupTimestamp > threshold) continue
          expired.push(path)
        }

        if (expired.length === 0) return
        debug('lifting expired disks', { vdiDir, count: expired.length })
        // Recursive: a VHD directory must be released together with its blocks, and `-R` is a no-op
        // on the flat VHDs and aliases sharing the batch.
        await Directory.liftImmutabilityBatch(expired)
      } catch (err) {
        // `cleanVm` may be merging or deleting these files at the same time
        if (err.code !== 'ENOENT') warn('error lifting expired disks', { err, vdiDir })
      }
    })
  })
}

// Walk `xo-config-backups/<scheduleId>/<datetime>/metadata.json` files and
// lift immutability on any backup directory whose metadata mtime is expired.
async function liftExpiredConfigBackups(root: string, immutabilityDuration: number, fullScan: boolean): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  const scheduleDirs = await listDirs(join(root, 'xo-config-backups'))
  debug('scanning config backup directories', { count: scheduleDirs.length, fullScan })
  await asyncEach(scheduleDirs, async scheduleDir => {
    for (const dateDir of await listDirs(scheduleDir)) {
      const backupTimestamp = parseDatetime(basename(dateDir))
      if (backupTimestamp === undefined || backupTimestamp > threshold) continue
      const metadataPath = join(dateDir, 'metadata.json')
      try {
        if (!fullScan && !(await File.isImmutable(metadataPath))) continue
        debug('config backup expired, scheduling lift', { metadataPath })
        await liftDirBackup(dateDir)
        debug('config backup lifted', { dateDir })
      } catch (err) {
        const code = err.code
        if (code !== 'ENOENT') warn('error lifting config backup immutability', { err, metadataPath })
      }
    }
  })
}

// Walk `xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<datetime>/metadata.json`
// files and lift immutability on any backup directory whose metadata mtime is expired.
async function liftExpiredPoolBackups(root: string, immutabilityDuration: number, fullScan: boolean): Promise<void> {
  const threshold = Date.now() - immutabilityDuration
  const scheduleDirs = await listDirs(join(root, 'xo-pool-metadata-backups'))
  debug('scanning pool metadata backup directories', { count: scheduleDirs.length, fullScan })
  await asyncEach(scheduleDirs, async scheduleDir => {
    for (const poolDir of await listDirs(scheduleDir)) {
      for (const dateDir of await listDirs(poolDir)) {
        const backupTimestamp = parseDatetime(basename(dateDir))
        if (backupTimestamp === undefined || backupTimestamp > threshold) continue
        const metadataPath = join(dateDir, 'metadata.json')
        try {
          if (!fullScan && !(await File.isImmutable(metadataPath))) continue
          debug('pool metadata backup expired, scheduling lift', { metadataPath })
          await liftDirBackup(dateDir)
          debug('pool metadata backup lifted', { dateDir })
        } catch (err) {
          const code = err.code
          if (code !== 'ENOENT') warn('error lifting pool metadata backup immutability', { err, metadataPath })
        }
      }
    }
  })
}

// Scan the filesystem for expired immutable backups under `root` and lift their
// immutability.  No index is required — the backup tree is walked directly.
export async function liftRemoteImmutability(
  root: string,
  immutabilityDuration: number,
  fullScan: boolean
): Promise<void> {
  await Promise.all([
    liftExpiredVmBackups(root, immutabilityDuration, fullScan),
    liftExpiredConfigBackups(root, immutabilityDuration, fullScan),
    liftExpiredPoolBackups(root, immutabilityDuration, fullScan),
  ])

  // after the passes above: every disk still named by a metadata json has been handled, so this one
  // only has the leftovers to look at
  if (fullScan) {
    await liftExpiredOrphanDisks(root, immutabilityDuration)
  }
}

// Lift immutability on all expired backups across every configured remote.
export async function liftImmutability(remotes: Record<string, RemoteConfig>): Promise<void> {
  const fullScan = isFirstLift
  isFirstLift = false
  for (const [remoteId, { root, immutabilityDuration }] of Object.entries(remotes)) {
    await liftRemoteImmutability(root, immutabilityDuration, fullScan).catch(err =>
      warn('error during liftRemoteImmutability', { err, remoteId, root, immutabilityDuration })
    )
  }
}
