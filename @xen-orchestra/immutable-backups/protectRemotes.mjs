#!/usr/bin/env node
// @ts-check

import fs from 'node:fs/promises'
import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import assert from 'node:assert'
import { dirname, join, sep } from 'node:path'
import { createLogger } from '@xen-orchestra/log'
import chokidar from 'chokidar'
import { indexFile } from './fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import loadConfig from './_loadConfig.mjs'
import isInVhdDirectory from './_isInVhdDirectory.mjs'

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
 * Called for each file seen during the initial scan (before the watcher is
 * `ready`).  If the file is already immutable it is added to the index so it
 * can be lifted later.
 * @param {string} root      - Absolute path to the backup repository root
 * @param {string} indexPath - Absolute path to the immutability index directory
 * @param {string} path      - Relative path of the file inside `root`
 * @returns {Promise<void>}
 */
async function handleExistingFile(root, indexPath, path) {
  try {
    // a vhd block directory is completely immutable
    if (isInVhdDirectory(path)) {
      // this will trigger 3 times per vhd blocks
      const dir = join(root, dirname(path))
      if (await Directory.isImmutable(dir)) {
        await indexFile(dir, indexPath)
      }
    } else {
      // other files are immutable a file basis
      const fullPath = join(root, path)
      if (await File.isImmutable(fullPath)) {
        await indexFile(fullPath, indexPath)
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
 * @param {string}                    path        - Relative path of the new file inside `root`
 * @returns {Promise<void>}
 */
async function handleNewFile(root, indexPath, pendingVhds, path) {
  // with awaitWriteFinish we have complete files here
  // we can make them immutable

  if (isInVhdDirectory(path)) {
    // watching a vhd block
    // wait for header/footer and BAT before making this immutable recursively
    const splitted = path.split(sep)
    const vmUuid = splitted[1]
    const vdiUuid = splitted[4]
    const uniqPath = `${vmUuid}/${vdiUuid}`
    const { existing } = pendingVhds.get(uniqPath) ?? {}
    if (existing === undefined) {
      pendingVhds.set(uniqPath, { existing: 1, lastModified: Date.now() })
    } else {
      // already two of the key files,and we got the last one
      if (existing === 2) {
        await Directory.makeImmutable(join(root, dirname(path)), indexPath)
        pendingVhds.delete(uniqPath)
      } else {
        // wait for the other
        pendingVhds.set(uniqPath, { existing: existing + 1, lastModified: Date.now() })
      }
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
 * @returns {Promise<void>}
 */
export async function watchRemote(remoteId, { root, immutabilityDuration, rebuildIndexOnStart = false, indexPath }) {
  // create index directory
  await fs.mkdir(indexPath, { recursive: true })

  // test if fs and index directories are well configured
  await test(root, indexPath)

  // add duration and watch status in the metadata.json of the remote
  const settingPath = join(root, 'immutability.json')
  try {
    // this file won't be made mutable by liftimmutability
    await File.liftImmutability(settingPath)
  } catch (error) {
    // file may not exists, and it's not really a problem
    info('lifting immutability on current settings', { error })
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
  setInterval(
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

  let ready = false
  /** @type {import('chokidar').WatchOptions & { recursive: boolean }} */
  const watchOptions = {
    ignored: [
      /(^|[/\\])\../, // ignore dotfiles
      /\.lock$/,
    ],
    cwd: root,
    recursive: false, // vhd directory can generate a lot of folder, don't let chokidar choke on this
    ignoreInitial: !rebuildIndexOnStart,
    depth: 7,
    awaitWriteFinish: true,
  }
  const watcher = chokidar.watch(PATHS, watchOptions)

  // Add event listeners.
  watcher
    .on('add', async path => {
      debug(`File ${path} has been added ${path.split('/').length}`)
      if (ready) {
        await handleNewFile(root, indexPath, pendingVhds, path).catch(warn)
      } else {
        await handleExistingFile(root, indexPath, path).catch(warn)
      }
    })
    .on('error', error => warn(`Watcher error: ${error}`))
    .on('ready', () => {
      ready = true
      info('Ready for changes')
    })
}

const { remotes } = await loadConfig()

for (const [remoteId, remote] of Object.entries(remotes)) {
  watchRemote(remoteId, remote).catch(err => warn('error during watchRemote', { err, remoteId, remote }))
}
