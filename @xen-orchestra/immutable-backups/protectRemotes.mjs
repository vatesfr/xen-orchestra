#!/usr/bin/env node
// @ts-check

import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import assert from 'node:assert'
import { dirname, join } from 'node:path'
import { createLogger } from '@xen-orchestra/log'
import chokidar from 'chokidar'
import { indexFile } from './fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import loadConfig from './_loadConfig.mjs'
import isInVhdDirectory from './_isInVhdDirectory.mjs'
import { asyncEach } from '@vates/async-each'
import readdirp from 'readdirp'
import picomatch from 'picomatch'

/** @typedef {import('./_loadConfig.mjs').RemoteConfig} RemoteConfig */

/**
 * @xen-orchestra/log has no .d.ts — methods are added dynamically at runtime.
 * @typedef {{ debug: (msg: string, data?: object) => void, info: (msg: string, data?: object) => void, warn: (msg: string, data?: object) => void }} XoLogger
 */

/**
 * Tracks the number of key metadata files (header, footer, bat) received for
 * an in-progress VHD directory.
 * @typedef {Object} PendingVhdEntry
 * @property {number} existing     - Count of key files received so far (1 or 2)
 * @property {number} lastModified - Timestamp of the last received file (`Date.now()`)
 */
const { debug, info, warn } = /** @type {XoLogger} */ (
  /** @type {unknown} */ (createLogger('xen-orchestra:immutable-backups:remote'))
)
/**
 * Verify that the remote filesystem and the index directory support immutability
 * by creating, modifying, locking, and unlocking a temporary test file.
 * @param {string} remotePath - Absolute path to the backup repository root
 * @param {string} indexPath  - Absolute path to the immutability index directory
 * @returns {Promise<void>}
 */
async function test(remotePath, indexPath) {
  await fs.readdir(remotePath)

  const testPath = join(remotePath, '.test-immut')
  // cleanup
  try {
    await File.liftImmutability(testPath, indexPath)
    await fs.unlink(testPath)
  } catch (err) {}
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

/**
 * Called for each file seen during the initial scan (rebuildIndexOnStart).
 * If the file is already immutable it is added to the index so it can be
 * lifted later.
 * @param {string} root      - Absolute path to the backup repository root
 * @param {string} indexPath - Absolute path to the immutability index directory
 * @param {string} path      - Relative path of the file inside `root`
 * @param {import('chokidar').FSWatcher} watcher - Watcher instance; immutable VHD dirs are unwatched to free memory
 * @returns {Promise<void>}
 */
async function handleExistingFile(root, indexPath, path, watcher) {
  debug('handleExistingFile', { root, indexPath, path })
  try {
    // a vhd block directory is completely immutable
    if (isInVhdDirectory(path)) {
      // this will trigger 3 times per vhd blocks
      const dir = join(root, dirname(path))
      if (await Directory.isImmutable(dir)) {
        await indexFile(dir, indexPath)
        // The directory is already immutable — no new files will ever be written
        // to it. Release chokidar's FSWatcher to free memory: at startup chokidar
        watcher.unwatch(dir)
        // Also unwatch the individual key file (bat/header/footer) that triggered
        // this call, and the other two sibling files, so chokidar releases all
        // file-level tracking entries for this VHD directory.
        watcher.unwatch(join(dir, 'bat'))
        watcher.unwatch(join(dir, 'header'))
        watcher.unwatch(join(dir, 'footer'))
      }
    } else {
      // other files are immutable a file basis
      const fullPath = join(root, path)
      if (await File.isImmutable(fullPath)) {
        await indexFile(fullPath, indexPath)
        watcher.unwatch(fullPath)
      }
    }
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'EEXIST') {
      // there can be a symbolic link in the tree
      warn('handleExistingFile', { error })
    }
  }
}

/**
 * Called for each newly created file after the watcher is `ready`.  Makes the
 * file (or its parent VHD directory once complete) immutable.
 * @param {string}                    root        - Absolute path to the backup repository root
 * @param {string}                    indexPath   - Absolute path to the immutability index directory
 * @param {Map<string, PendingVhdEntry>} pendingVhds - Tracks VHD directories waiting for all key files
 * @param {import('chokidar').FSWatcher} watcher   - The chokidar watcher instance (used to release VHD dir watches)
 * @param {string}                    path        - Relative path of the new file inside `root`
 * @returns {Promise<void>}
 */
async function handleNewFile(root, indexPath, pendingVhds, watcher, path) {
  debug('handleNewFile', { root, indexPath, pendingVhdsSize: pendingVhds.size, path })
  // with awaitWriteFinish we have complete files here
  // we can make them immutable

  if (isInVhdDirectory(path)) {
    // watching a vhd block (bat, header or footer)
    // We need all three key files before locking the directory.
    // Rather than relying purely on an in-memory counter (which resets on
    // daemon restart), we also check for already-present key files using
    // fs.access.  This handles the case where the daemon restarts mid-backup:
    // e.g. bat and header were written before restart, only footer triggers
    // handleNewFile → we probe the other two and find all 3 present → lock.
    const vhdDirRelPath = dirname(path)
    const vhdDirAbsPath = join(root, vhdDirRelPath)
    debug('vhd key file received', { path, vhdDirRelPath })

    const exists = (/** @type {string} */ f) =>
      fs.access(join(vhdDirAbsPath, f)).then(
        () => true,
        () => false
      )
    const [hasBat, hasHeader, hasFooter] = await Promise.all([exists('bat'), exists('header'), exists('footer')])
    const presentCount = [hasBat, hasHeader, hasFooter].filter(Boolean).length
    debug('vhd dir key file count', { vhdDirRelPath, hasBat, hasHeader, hasFooter })

    if (presentCount === 3) {
      // Guard against concurrent locking: bat, header, and footer may all fire
      // add events within the awaitWriteFinish window and each find all 3 files
      // present.  Mark as "locking" (existing=3) synchronously before the first
      // await so the other two handlers see it and skip.
      if (pendingVhds.get(vhdDirRelPath)?.existing === 3) {
        debug('vhd directory locking already in progress, skipping duplicate event', { vhdDirRelPath })
        return
      }
      pendingVhds.set(vhdDirRelPath, { existing: 3, lastModified: Date.now() })
      // all three key files are on disk — lock the directory
      info('locking vhd directory', { vhdDirAbsPath })
      try {
        await Directory.makeImmutable(vhdDirAbsPath, indexPath)
        // Release chokidar's FSWatcher for this VHD directory. Each backup run
        // creates a new VHD UUID dir; without this unwatch, chokidar accumulates
        // one FSWatcher per VHD dir indefinitely, causing a memory leak.
        watcher.unwatch(vhdDirAbsPath)
        // Also explicitly unwatch all three key files so chokidar releases their
        // file-level tracking entries. The triggering file is unwatched by the
        // caller, but the other two siblings would otherwise remain tracked.
        watcher.unwatch(join(vhdDirAbsPath, 'bat'))
        watcher.unwatch(join(vhdDirAbsPath, 'header'))
        watcher.unwatch(join(vhdDirAbsPath, 'footer'))
      } finally {
        // Always clean up so a failed lock doesn't permanently block retries.
        pendingVhds.delete(vhdDirRelPath)
      }
      info('vhd directory locked', { vhdDirAbsPath })
    } else {
      // still waiting for the remaining key file(s)
      pendingVhds.set(vhdDirRelPath, { existing: presentCount, lastModified: Date.now() })
    }
  } else {
    const fullFilePath = join(root, path)
    await File.makeImmutable(fullFilePath, indexPath)
    await cleanXoCache(fullFilePath)
  }
}

/**
 * Start watching a backup remote for new files and make them immutable as they
 * are written.  Also re-indexes already-immutable files when
 * `rebuildIndexOnStart` is `true`.
 * @param {string}       remoteId - Opaque identifier for the remote (used for logging)
 * @param {RemoteConfig} options
 * @returns {Promise<{ close: () => Promise<void> }>}
 */
export async function watchRemote(remoteId, { root, immutabilityDuration, rebuildIndexOnStart = false, indexPath }) {
  debug('got config ', { remoteId, root, immutabilityDuration, rebuildIndexOnStart, indexPath })
  // create index directory
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
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') {
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

  // we wait for footer/header AND BAT to be written before locking a vhd directory
  // this map allow us to track the vhd with partial metadata
  /** @type {Map<string, PendingVhdEntry>} */
  const pendingVhds = new Map()
  // cleanup pending vhd map periodically
  const cleanupInterval = setInterval(
    () => {
      pendingVhds.forEach(({ lastModified, existing }, path) => {
        if (Date.now() - lastModified > 60 * 60 * 1000) {
          pendingVhds.delete(path)
          warn(`vhd at ${path} is incomplete since ${lastModified}`, { existing, lastModified, path })
        }
      })
    },
    60 * 60 * 1000
  )
  cleanupInterval.unref()

  // watch the remote for any new VM metadata json file
  const PATHS = [
    // xo-config-backups/scheduleId/date/metadata.json
    'xo-config-backups/*/*/data',
    'xo-config-backups/*/*/data.json',
    'xo-config-backups/*/*/metadata.json',
    // xo-pool-metadata-backups/backupId/scheduleId/date/metadata.json
    'xo-pool-metadata-backups/*/*/*/metadata.json',
    'xo-pool-metadata-backups/*/*/*/data',
    // xo-vm-backups/<vmuuid>/
    'xo-vm-backups/*/*.json',
    'xo-vm-backups/*/*.xva',
    'xo-vm-backups/*/*.xva.checksum',
    // xo-vm-backups/<vmuuid>/vdis/<jobid>/<vdiUuid>
    'xo-vm-backups/*/vdis/*/*/*.vhd', // can be an alias or a vhd file
    // for vhd directory :
    'xo-vm-backups/*/vdis/*/*/data/*.vhd/bat',
    'xo-vm-backups/*/vdis/*/*/data/*.vhd/header',
    'xo-vm-backups/*/vdis/*/*/data/*.vhd/footer',
  ]

  /** @type {import('chokidar').WatchOptions & { recursive: boolean }} */
  const watchOptions = {
    ignored: [
      /(^|[/\\])\../, // ignore dotfiles
      /\.lock$/,
    ],
    cwd: root,
    recursive: false, // vhd directory can generate a lot of folder, don't let chokidar choke on this
    ignoreInitial: true, // existing files are handled by the readdirp scan below
    depth: 7,
    awaitWriteFinish: true,
  }
  const watcher = chokidar.watch(PATHS, watchOptions)

  watcher
    .on('add', async path => {
      debug(`File ${path} has been added`)
      await handleNewFile(root, indexPath, pendingVhds, watcher, path).catch(warn)
      // Once processed the file is immutable and won't change — stop watching
      // it to free the FSWatcher handle and prevStats closure.
      watcher.unwatch(path)
    })
    .on('error', error => warn(`Watcher error: ${error}`))
    .on('ready', () => info('Ready for changes'))

  if (rebuildIndexOnStart) {
    // Use readdirp + picomatch for the initial scan instead of relying on
    // chokidar's ignoreInitial:false, which fires 'ready' once per glob pattern
    // group and makes it impossible to know deterministically when all initial
    // add events have been processed.
    const isWatchedPath = /** @type {(path: string) => boolean} */ (picomatch(PATHS))
    ;(async () => {
      await asyncEach(
        readdirp(root, { depth: 7, fileFilter: entry => isWatchedPath(entry.path) }),
        entry => handleExistingFile(root, indexPath, entry.path, watcher).catch(warn),
        { concurrency: 16 }
      )
      info('rebuildIndexOnStart: done')
    })().catch(error => warn('error during rebuildIndexOnStart scan', { error }))
  }

  return {
    close: () => watcher.close(),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { remotes } = await loadConfig()
  for (const [remoteId, remote] of Object.entries(remotes)) {
    watchRemote(remoteId, remote).catch(err => warn('error during watchRemote', { err, remoteId, remote }))
  }
}
