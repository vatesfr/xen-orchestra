#!/usr/bin/env node
// @ts-check
//
// Load test: 5000 VMs × 4 flat VHDs.
//
// Phase A — rebuildIndexOnStart:
//   Write backups for all VMs, make them immutable without indexing (simulates
//   a previous run where the index was lost), start watchRemote with
//   rebuildIndexOnStart=true, and measure how long the full index rebuild takes.
//
// Phase B — live watcher:
//   While the watcher is still running, write a second round of backups
//   (different datetime) and measure how long the watcher takes to lock them.
//
// Must be run as root (chattr requires elevated privileges).
// Usage:  node @xen-orchestra/immutable-backups/protectRemote.load.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import { watchRemote } from './protectRemotes.mjs'
import { liftRemoteImmutability } from './liftProtection.mjs'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VM_COUNT = 5000
const DISKS_PER_VM = 4
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'

/** Datetime used for the pre-existing immutable backups (Phase A). */
const OLD_DATE = '20240115T120000Z'

/** Datetime used for the new live backups (Phase B). */
const NEW_DATE = '20240116T120000Z'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Max concurrent backup file writes. */
const WRITE_CONCURRENCY = 100

/** Files per chattr call when bulk-locking pre-existing files. */
const CHATTR_BATCH = 500

/** Max time to wait for all files to be indexed (ms). */
const LOCK_TIMEOUT_MS = 120_000

// Each VM backup: 1 .json + DISKS_PER_VM plain .vhd files → all indexed.
const FILES_PER_VM = 1 + DISKS_PER_VM
const EXPECTED_PER_PHASE = VM_COUNT * FILES_PER_VM

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
 * Make all `files` immutable using batched chattr calls (no index entry created).
 * @param {string[]} files
 */
async function bulkMakeImmutable(files) {
  for (let i = 0; i < files.length; i += CHATTR_BATCH) {
    await execa('chattr', ['+i', ...files.slice(i, i + CHATTR_BATCH)])
  }
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

/**
 * Poll `countIndexEntries` until it reaches `target` or `LOCK_TIMEOUT_MS` elapses.
 * Logs progress on every change.
 * @param {string} indexPath
 * @param {number} target
 * @param {string} label
 * @returns {Promise<{ elapsed: number, reached: boolean }>}
 */
async function waitForIndexCount(indexPath, target, label) {
  const tStart = Date.now()
  let lastCount = await countIndexEntries(indexPath)
  console.log(`  [${label}] starting at ${lastCount}/${target}`)

  const deadline = Date.now() + LOCK_TIMEOUT_MS
  while (Date.now() < deadline) {
    sampleMemory()
    const count = await countIndexEntries(indexPath)
    if (count !== lastCount) {
      console.log(
        `  [${label}] index entries: ${count}/${target}` +
          ` | ${Date.now() - tStart} ms elapsed` +
          ` | peak RSS ${mb(peakRss)}`
      )
      lastCount = count
    }
    if (count >= target) {
      return { elapsed: Date.now() - tStart, reached: true }
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return { elapsed: Date.now() - tStart, reached: false }
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

  console.log(`Root:                   ${root}`)
  console.log(`VMs:                    ${VM_COUNT}`)
  console.log(`Disks per VM:           ${DISKS_PER_VM}`)
  console.log(`Files per VM:           ${FILES_PER_VM}`)
  console.log(`Expected index/phase:   ${EXPECTED_PER_PHASE}`)
  console.log('')

  const vms = Array.from({ length: VM_COUNT }, (_, i) => ({
    uuid: makeUuid(i),
    vdiUuids: Array.from({ length: DISKS_PER_VM }, (_, j) =>
      makeUuid(VM_COUNT + i * DISKS_PER_VM + j)
    ),
  }))

  // -------------------------------------------------------------------------
  // 1. Create directory structure
  // -------------------------------------------------------------------------
  console.log('Creating directory structure...')
  const tDirs = Date.now()

  const leafDirs = vms.flatMap(vm =>
    vm.vdiUuids.map(vdiUuid =>
      path.join(root, 'xo-vm-backups', vm.uuid, 'vdis', JOB_UUID, vdiUuid)
    )
  )
  for (let i = 0; i < leafDirs.length; i += 200) {
    await Promise.all(leafDirs.slice(i, i + 200).map(d => fs.mkdir(d, { recursive: true })))
  }
  console.log(`Done in ${Date.now() - tDirs} ms (${VM_COUNT * DISKS_PER_VM} leaf dirs)`)
  console.log('')

  // -------------------------------------------------------------------------
  // 2. Write backup files for OLD_DATE and make them immutable without indexing
  // -------------------------------------------------------------------------
  console.log(`Writing ${VM_COUNT * FILES_PER_VM} files for OLD_DATE (${OLD_DATE})...`)
  const tWrite1 = Date.now()

  const allOldFiles = /** @type {string[]} */ ([])
  const writeQueue1 = vms.slice()
  await Promise.all(
    Array.from({ length: WRITE_CONCURRENCY }, async () => {
      while (writeQueue1.length > 0) {
        const vm = writeQueue1.shift()
        if (vm === undefined) break
        const vmDir = path.join(root, 'xo-vm-backups', vm.uuid)
        const vhdFiles = await Promise.all(
          vm.vdiUuids.map(async vdiUuid => {
            const p = path.join(vmDir, 'vdis', JOB_UUID, vdiUuid, `${OLD_DATE}.vhd`)
            await fs.writeFile(p, 'fake vhd data')
            return p
          })
        )
        const jsonFile = path.join(vmDir, `${OLD_DATE}.json`)
        await fs.writeFile(jsonFile, '{}')
        allOldFiles.push(jsonFile, ...vhdFiles)
      }
    })
  )
  console.log(`Files written in ${Date.now() - tWrite1} ms`)

  console.log(`Making ${allOldFiles.length} files immutable (no index)...`)
  const tChattr = Date.now()
  await bulkMakeImmutable(allOldFiles)
  console.log(`chattr done in ${Date.now() - tChattr} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // 3. Start memory sampling + watchRemote with rebuildIndexOnStart
  // -------------------------------------------------------------------------
  const memSampler = setInterval(sampleMemory, 50)
  sampleMemory()
  const rssBeforeWatch = process.memoryUsage().rss
  console.log(`Memory before watchRemote: ${mb(rssBeforeWatch)}`)

  console.log('Starting watchRemote (rebuildIndexOnStart=true)...')
  const tWatchStart = Date.now()
  const { close } = await watchRemote('load-test', {
    root,
    indexPath,
    immutabilityDuration: ONE_DAY_MS,
    rebuildIndexOnStart: true,
  })
  const tWatcherReady = Date.now() - tWatchStart

  await new Promise(resolve => setTimeout(resolve, 500))
  sampleMemory()
  const rssAfterWatch = process.memoryUsage().rss
  console.log(`watchRemote ready in ${tWatcherReady} ms`)
  console.log(`Memory after watchRemote:  ${mb(rssAfterWatch)} (delta: ${mb(rssAfterWatch - rssBeforeWatch)})`)
  console.log('')

  // -------------------------------------------------------------------------
  // Phase A — wait for rebuildIndex to index all pre-existing immutable files
  // -------------------------------------------------------------------------
  console.log(`=== Phase A: rebuildIndexOnStart (${EXPECTED_PER_PHASE} entries) ===`)
  const phaseA = await waitForIndexCount(indexPath, EXPECTED_PER_PHASE, 'rebuild')
  console.log(`Phase A ${phaseA.reached ? 'DONE' : 'TIMEOUT'} in ${phaseA.elapsed} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // Phase B — write new backups and measure live watcher locking speed
  // -------------------------------------------------------------------------
  console.log(`=== Phase B: live watcher — writing ${VM_COUNT} new backups (${NEW_DATE}) ===`)
  const tWrite2 = Date.now()
  let written2 = 0

  const writeQueue2 = vms.slice()
  await Promise.all(
    Array.from({ length: WRITE_CONCURRENCY }, async () => {
      while (writeQueue2.length > 0) {
        const vm = writeQueue2.shift()
        if (vm === undefined) break
        const vmDir = path.join(root, 'xo-vm-backups', vm.uuid)
        await Promise.all(
          vm.vdiUuids.map(vdiUuid =>
            fs.writeFile(
              path.join(vmDir, 'vdis', JOB_UUID, vdiUuid, `${NEW_DATE}.vhd`),
              'fake vhd data'
            )
          )
        )
        // .json written last — triggers lockBackup atomically
        await fs.writeFile(path.join(vmDir, `${NEW_DATE}.json`), '{}')

        written2++
        if (written2 % 1000 === 0) {
          sampleMemory()
          console.log(
            `  ${written2}/${VM_COUNT} backups written` +
              ` | ${Date.now() - tWrite2} ms elapsed` +
              ` | peak RSS ${mb(peakRss)}`
          )
        }
      }
    })
  )
  const tWrite2Done = Date.now() - tWrite2
  console.log(`All ${VM_COUNT} backups written in ${tWrite2Done} ms`)

  const phaseB = await waitForIndexCount(indexPath, EXPECTED_PER_PHASE * 2, 'live-lock')
  console.log(`Phase B ${phaseB.reached ? 'DONE' : 'TIMEOUT'} in ${phaseB.elapsed} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // Phase C — lift all immutability via liftRemoteImmutability
  // Use a negative duration so that today's index entries are treated as
  // "older than the limit" and therefore yielded by listOlderTargets.
  // -------------------------------------------------------------------------
  await close()

  console.log(`=== Phase C: lift all ${EXPECTED_PER_PHASE * 2} protected files ===`)
  const tLift = Date.now()
  let liftCount = 0
  let lastLiftLog = Date.now()

  // Wrap liftRemoteImmutability to log progress periodically.
  // liftRemoteImmutability is sequential (for-await), so we interleave
  // logging by sampling after each entry via a thin proxy on the indexPath.
  // Simpler: just run it and log before/after with a mid-run memory sample.
  const liftSampler = setInterval(() => {
    sampleMemory()
    const now = Date.now()
    if (now - lastLiftLog >= 5000) {
      console.log(`  lifting in progress... ${Date.now() - tLift} ms elapsed | peak RSS ${mb(peakRss)}`)
      lastLiftLog = now
    }
  }, 1000)

  await liftRemoteImmutability(indexPath, -ONE_DAY_MS)

  clearInterval(liftSampler)
  sampleMemory()
  const tLiftDone = Date.now() - tLift
  liftCount = await countIndexEntries(indexPath)
  console.log(`Phase C DONE in ${tLiftDone} ms — remaining index entries: ${liftCount}`)
  console.log('')

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------
  clearInterval(memSampler)
  sampleMemory()

  console.log('=== Results ===')
  console.log(`watchRemote startup:         ${tWatcherReady} ms`)
  console.log(`Phase A — rebuild index:     ${phaseA.elapsed} ms  ${phaseA.reached ? 'OK' : 'TIMEOUT'}`)
  console.log(`Phase B — write backups:     ${tWrite2Done} ms`)
  console.log(`Phase B — lock all:          ${phaseB.elapsed} ms  ${phaseB.reached ? 'OK' : 'TIMEOUT'}`)
  console.log(`Phase C — lift all:          ${tLiftDone} ms  (${liftCount} entries remaining)`)
  console.log(`Memory before watch:         ${mb(rssBeforeWatch)}`)
  console.log(`Memory after watch:          ${mb(rssAfterWatch)}`)
  console.log(`Peak RSS:                    ${mb(peakRss)}`)
  console.log(`Current RSS:                 ${mb(process.memoryUsage().rss)}`)

  await cleanupRoot(root)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
