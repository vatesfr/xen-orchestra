import fs from 'node:fs/promises'
import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import assert from 'node:assert'
import { join } from 'node:path'
import { createLogger } from '@xen-orchestra/log'
import { asyncEach } from '@vates/async-each'
import { indexFile } from './fileIndex.mjs'
import { type RemoteConfig } from './_loadConfig.mjs'
import { watchRemote as startRemoteWatcher } from './watcher.mjs'

const { debug, info, warn } = createLogger('xen-orchestra:immutable-backups:remote')

// Verify that the remote filesystem and the index directory support immutability
// by creating, modifying, locking, and unlocking a temporary test file.
async function test(remotePath: string, indexPath: string): Promise<void> {
  await fs.readdir(remotePath)

  const testPath = join(remotePath, '.test-immut')
  // cleanup
  try {
    await File.liftImmutability(testPath, indexPath)
    await fs.unlink(testPath)
  } catch {
    // cleanup can fails if it's te first test not an issue
  }
  // can create , modify and delete a file
  await fs.writeFile(testPath, `test immut ${new Date()}`)
  await fs.writeFile(testPath, `test immut change 1 ${new Date()}`)
  await fs.unlink(testPath)

  // cannot modify or delete an immutable file
  await fs.writeFile(testPath, `test immut ${new Date()}`)
  await File.makeImmutable(testPath, indexPath)
  await assert.rejects(fs.writeFile(testPath, `test immut change 2  ${new Date()}`), { code: 'EPERM' })
  await assert.rejects(fs.unlink(testPath), { code: 'EPERM' })
  // can modify and delete a file after lifting immutability
  await File.liftImmutability(testPath, indexPath)

  await fs.writeFile(testPath, `test immut change 3 ${new Date()}`)
  await fs.unlink(testPath)
}

// List the immediate subdirectories of `dir`.
// Returns an empty array if `dir` does not exist.
async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => join(dir, e.name))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw err
  }
}

// If `path` is already immutable, add it to the index.
// Errors other than ENOENT / EEXIST are logged as warnings.
async function tryIndexExistingFile(path: string, indexPath: string): Promise<void> {
  try {
    if (await File.isImmutable(path)) {
      await indexFile(path, indexPath)
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT' && code !== 'EEXIST') {
      warn('tryIndexExistingFile', { err, path })
    }
  }
}

// If `path` (a directory) is already immutable, add it to the index.
async function tryIndexExistingDirectory(path: string, indexPath: string): Promise<void> {
  try {
    if (await Directory.isImmutable(path)) {
      await indexFile(path, indexPath)
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT' && code !== 'EEXIST') {
      warn('tryIndexExistingDirectory', { err, path })
    }
  }
}

/** Matches `<YYYYMMDD>T<HHmmss>` at the start of a filename. */
const DATETIME_RE = /^\d{8}T\d{6}Z?/

// Walk the backup tree under `root` and add any already-immutable files to the
// index.  Called at startup when `rebuildIndexOnStart` is true so that files
// locked in a previous run can still be lifted later.
async function rebuildIndex(root: string, indexPath: string): Promise<void> {
  // xo-vm-backups/<vmUUID>/
  await asyncEach(await listDirs(join(root, 'xo-vm-backups')), async vmDir => {
    // VM-level files: <datetime>.json, <datetime>.xva, <datetime>.xva.checksum
    const vmEntries = await fs.readdir(vmDir, { withFileTypes: true }).catch(() => [])
    for (const entry of vmEntries) {
      const matches = entry.isFile() && DATETIME_RE.test(entry.name)
      debug(`[rebuildIndex] vmDir entry "${entry.name}": matches=${matches} → ${matches ? 'indexing' : 'skipped'}`)

      if (matches) {
        await tryIndexExistingFile(join(vmDir, entry.name), indexPath)
      }
    }

    // xo-vm-backups/<vmUUID>/vdis/<jobId>/<vdiId>/
    for (const jobDir of await listDirs(join(vmDir, 'vdis'))) {
      for (const vdiDir of await listDirs(jobDir)) {
        // <datetime>.vhd (plain VHD) and <datetime>.alias.vhd
        // don't assume a VM has disks
        const vdiEntries = await fs.readdir(vdiDir, { withFileTypes: true }).catch(() => [])
        for (const entry of vdiEntries) {
          if (entry.isFile() && entry.name.endsWith('.vhd')) {
            await tryIndexExistingFile(join(vdiDir, entry.name), indexPath)
          }
        }
        // data/<datetime>.vhd/ — VHD directory
        for (const vhdDir of await listDirs(join(vdiDir, 'data'))) {
          if (vhdDir.endsWith('.vhd')) {
            await tryIndexExistingDirectory(vhdDir, indexPath)
          }
        }
      }
    }
  })

  // xo-config-backups/<scheduleId>/<YYYYMMDD>T<HHmmss>/
  await asyncEach(await listDirs(join(root, 'xo-config-backups')), async scheduleDir => {
    for (const dateDir of await listDirs(scheduleDir)) {
      await tryIndexExistingFile(join(dateDir, 'metadata.json'), indexPath)
      await tryIndexExistingFile(join(dateDir, 'data.json'), indexPath)
    }
  })

  // xo-pool-metadata-backups/<scheduleId>/<poolUUID>/<YYYYMMDD>T<HHmmss>/
  await asyncEach(await listDirs(join(root, 'xo-pool-metadata-backups')), async scheduleDir => {
    for (const poolDir of await listDirs(scheduleDir)) {
      for (const dateDir of await listDirs(poolDir)) {
        await tryIndexExistingFile(join(dateDir, 'metadata.json'), indexPath)
        await tryIndexExistingFile(join(dateDir, 'data'), indexPath)
      }
    }
  })

  info('rebuildIndexOnStart: done')
}

// Start watching a backup remote for new files and make them immutable as they
// are written.  Also re-indexes already-immutable files when
// `rebuildIndexOnStart` is `true`.
export async function watchRemote(
  remoteId: string,
  { root, immutabilityDuration, rebuildIndexOnStart = false, indexPath }: RemoteConfig
): Promise<{ close: () => void }> {
  debug('got config ', { remoteId, root, immutabilityDuration, rebuildIndexOnStart, indexPath })

  await fs.mkdir(indexPath, { recursive: true })

  // test if fs and index directories are well configured
  await test(root, indexPath)

  // add duration and watch status in the metadata.json of the remote
  const settingPath = join(root, 'immutability.json')
  // Only lift immutability when the file already exists from a previous run.
  // Calling chattr on a non-existent file produces a confusing error message.
  try {
    await fs.access(settingPath)
    // this file won't be tracked in the index
    await File.liftImmutability(settingPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      info('error lifting immutability on current settings', { error })
    }
  }
  await fs.writeFile(
    settingPath,
    JSON.stringify({
      since: Date.now(),
      immutable: true,
      duration: immutabilityDuration,
    })
  )
  // no index path in makeImmutable(): the immutability won't be lifted
  // let it fall and stop the process on error
  await File.makeImmutable(settingPath)

  const close = await startRemoteWatcher(root, indexPath, err => warn('watcher error', { err }))

  if (rebuildIndexOnStart) {
    rebuildIndex(root, indexPath).catch(err => warn('error during rebuildIndexOnStart scan', { err }))
  }

  return { close }
}
