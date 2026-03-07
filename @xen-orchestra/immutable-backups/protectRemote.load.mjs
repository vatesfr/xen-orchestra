#!/usr/bin/env node
// @ts-check
//
// Load test: 5000 VMs × 4 flat VHDs — measures watcher startup, locking
// throughput, and peak RSS memory.
//
// Must be run as root (chattr requires elevated privileges).
// Usage:  node @xen-orchestra/immutable-backups/protectRemote.load.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import { watchRemote } from './protectRemotes.mjs'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VM_COUNT = 5000
const DISKS_PER_VM = 4
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'
const BACKUP_DATE = '20240115T120000Z'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Max concurrent backup writes. */
const WRITE_CONCURRENCY = 100

/** Max time to wait for all files to be locked (ms). */
const LOCK_TIMEOUT_MS = 120_000

// Each VM backup: 1 .json + DISKS_PER_VM plain .vhd files → all indexed.
const EXPECTED_INDEX_ENTRIES = VM_COUNT * (1 + DISKS_PER_VM)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** @param {number} i */
function makeUuid(i) {
  return `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`
}

/** @param {string} root */
async function cleanupRoot(root) {
  try {
    await execa('chattr', ['-i', '-R', root])
  } catch {}
  await rimraf(root)
}

/**
 * Count all files inside the two-level index hierarchy:
 *   <indexPath>/<YYYY-MM-DD>/<sha256>
 * @param {string} indexPath
 */
async function countIndexEntries(indexPath) {
  let count = 0
  let days
  try {
    days = await fs.readdir(indexPath, { withFileTypes: true })
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') return 0
    throw err
  }
  for (const day of days) {
    if (!day.isDirectory()) continue
    const entries = await fs.readdir(path.join(indexPath, day.name))
    count += entries.length
  }
  return count
}

// ---------------------------------------------------------------------------
// Memory tracking
// ---------------------------------------------------------------------------

let peakRss = 0

function sampleMemory() {
  const { rss } = process.memoryUsage()
  if (rss > peakRss) peakRss = rss
  return rss
}

/** @param {number} bytes */
function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'immut-load-'))
  const indexPath = path.join(root, '.index')

  console.log(`Root:               ${root}`)
  console.log(`VMs:                ${VM_COUNT}`)
  console.log(`Disks per VM:       ${DISKS_PER_VM}`)
  console.log(`Expected index entries: ${EXPECTED_INDEX_ENTRIES}`)
  console.log('')

  // -------------------------------------------------------------------------
  // 1. Generate UUIDs
  // -------------------------------------------------------------------------
  const vms = Array.from({ length: VM_COUNT }, (_, i) => ({
    uuid: makeUuid(i),
    vdiUuids: Array.from({ length: DISKS_PER_VM }, (_, j) =>
      makeUuid(VM_COUNT + i * DISKS_PER_VM + j)
    ),
  }))

  // -------------------------------------------------------------------------
  // 2. Pre-create directory structure
  // -------------------------------------------------------------------------
  console.log('Creating directory structure...')
  const tDirs = Date.now()

  // Limit mkdir concurrency to avoid EMFILE
  const dirQueue = vms.flatMap(vm =>
    vm.vdiUuids.map(vdiUuid =>
      path.join(root, 'xo-vm-backups', vm.uuid, 'vdis', JOB_UUID, vdiUuid)
    )
  )
  const MKDIR_CONCURRENCY = 200
  for (let i = 0; i < dirQueue.length; i += MKDIR_CONCURRENCY) {
    await Promise.all(dirQueue.slice(i, i + MKDIR_CONCURRENCY).map(d => fs.mkdir(d, { recursive: true })))
  }

  console.log(`Directory structure created in ${Date.now() - tDirs} ms`)
  console.log(`  (${VM_COUNT * DISKS_PER_VM} leaf directories)`)
  console.log('')

  // -------------------------------------------------------------------------
  // 3. Start memory sampling + watchRemote
  // -------------------------------------------------------------------------
  const memSampler = setInterval(sampleMemory, 50)

  sampleMemory()
  const rssBeforeWatch = process.memoryUsage().rss
  console.log(`Memory before watchRemote: ${mb(rssBeforeWatch)}`)

  console.log('Starting watchRemote...')
  const tStart = Date.now()
  const { close } = await watchRemote('load-test', {
    root,
    indexPath,
    immutabilityDuration: ONE_DAY_MS,
  })
  const tWatcherReady = Date.now() - tStart

  // Give fs.watch handles time to settle before measuring baseline memory.
  await new Promise(resolve => setTimeout(resolve, 500))
  sampleMemory()

  const rssAfterWatch = process.memoryUsage().rss
  console.log(`watchRemote ready in ${tWatcherReady} ms`)
  console.log(`Memory after watchRemote: ${mb(rssAfterWatch)} (delta: ${mb(rssAfterWatch - rssBeforeWatch)})`)
  console.log('')

  // -------------------------------------------------------------------------
  // 4. Write backups
  // -------------------------------------------------------------------------
  console.log(`Writing ${VM_COUNT} backups (concurrency=${WRITE_CONCURRENCY})...`)
  const tWrite = Date.now()
  let written = 0

  // Simple pool: slice the VM list and process chunks in parallel.
  const writeQueue = vms.slice()
  await Promise.all(
    Array.from({ length: WRITE_CONCURRENCY }, async () => {
      while (writeQueue.length > 0) {
        const vm = writeQueue.shift()
        if (vm === undefined) break

        const vmDir = path.join(root, 'xo-vm-backups', vm.uuid)

        // Write flat VHD files for each VDI.
        await Promise.all(
          vm.vdiUuids.map(vdiUuid =>
            fs.writeFile(
              path.join(vmDir, 'vdis', JOB_UUID, vdiUuid, `${BACKUP_DATE}.vhd`),
              'fake vhd data'
            )
          )
        )
        // .json written last — triggers lockBackup atomically.
        await fs.writeFile(path.join(vmDir, `${BACKUP_DATE}.json`), '{}')

        written++
        if (written % 1000 === 0) {
          sampleMemory()
          console.log(
            `  ${written}/${VM_COUNT} backups written` +
              ` | ${Date.now() - tWrite} ms elapsed` +
              ` | peak RSS ${mb(peakRss)}`
          )
        }
      }
    })
  )

  const tWriteDone = Date.now() - tWrite
  console.log(`All ${VM_COUNT} backups written in ${tWriteDone} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // 5. Wait for all files to be indexed (locked)
  // -------------------------------------------------------------------------
  console.log(`Waiting for ${EXPECTED_INDEX_ENTRIES} index entries (timeout ${LOCK_TIMEOUT_MS / 1000} s)...`)
  const tLock = Date.now()
  let lastCount = 0

  const deadline = Date.now() + LOCK_TIMEOUT_MS
  while (Date.now() < deadline) {
    sampleMemory()
    const count = await countIndexEntries(indexPath)
    if (count !== lastCount) {
      console.log(
        `  index entries: ${count}/${EXPECTED_INDEX_ENTRIES}` +
          ` | ${Date.now() - tLock} ms elapsed` +
          ` | peak RSS ${mb(peakRss)}`
      )
      lastCount = count
    }
    if (count >= EXPECTED_INDEX_ENTRIES) break
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const tLockDone = Date.now() - tLock
  const finalCount = await countIndexEntries(indexPath)
  const allLocked = finalCount >= EXPECTED_INDEX_ENTRIES

  // -------------------------------------------------------------------------
  // 6. Results
  // -------------------------------------------------------------------------
  clearInterval(memSampler)
  sampleMemory()

  console.log('')
  console.log('=== Results ===')
  console.log(`Status:              ${allLocked ? 'OK — all locked' : `TIMEOUT — only ${finalCount}/${EXPECTED_INDEX_ENTRIES} indexed`}`)
  console.log(`watchRemote startup: ${tWatcherReady} ms`)
  console.log(`Write phase:         ${tWriteDone} ms`)
  console.log(`Lock phase:          ${tLockDone} ms`)
  console.log(`Total (watch→done):  ${Date.now() - tStart} ms`)
  console.log(`Memory before watch: ${mb(rssBeforeWatch)}`)
  console.log(`Memory after watch:  ${mb(rssAfterWatch)}`)
  console.log(`Peak RSS:            ${mb(peakRss)}`)
  console.log(`Current RSS:         ${mb(process.memoryUsage().rss)}`)

  await close()
  await cleanupRoot(root)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
