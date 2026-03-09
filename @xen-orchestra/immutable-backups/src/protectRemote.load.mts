#!/usr/bin/env node
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
import { createHash } from 'node:crypto'
import { rimraf } from 'rimraf'
import execa from 'execa'

import { asyncEach } from '@vates/async-each'
import { indexFile } from './fileIndex.mjs'
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

/**
 * Indices into `vms[]` whose Phase B json→indexed latency is tracked
 * individually to show per-backup timing under full concurrent load.
 */
const PROBE_VM_INDICES = [
  0,
  Math.floor(VM_COUNT / 4),
  Math.floor(VM_COUNT / 2),
  Math.floor((VM_COUNT * 3) / 4),
  VM_COUNT - 1,
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUuid(i: number): string {
  return `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`
}

async function cleanupRoot(root: string): Promise<void> {
  try {
    await execa('chattr', ['-i', '-R', root])
  } catch {}
  await rimraf(root)
}

// Make all `files` immutable using batched chattr calls (no index entry created).
async function bulkMakeImmutable(files: string[]): Promise<void> {
  for (let i = 0; i < files.length; i += CHATTR_BATCH) {
    await execa('chattr', ['+i', ...files.slice(i, i + CHATTR_BATCH)])
  }
}

// Count all files inside the two-level index hierarchy:
//   <indexPath>/<YYYY-MM-DD>/<sha256>
async function countIndexEntries(indexPath: string): Promise<number> {
  let count = 0
  let days
  try {
    days = await fs.readdir(indexPath, { withFileTypes: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return 0
    throw err
  }
  for (const day of days) {
    if (!day.isDirectory()) continue
    const entries = await fs.readdir(path.join(indexPath, day.name))
    count += entries.length
  }
  return count
}

// Poll `countIndexEntries` until it reaches `target` or `LOCK_TIMEOUT_MS` elapses.
// Logs progress on every change.
async function waitForIndexCount(
  indexPath: string,
  target: number,
  label: string
): Promise<{ elapsed: number; reached: boolean }> {
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
// Index membership check — no subprocess, fast polling
// ---------------------------------------------------------------------------

function sha256hex(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

// Returns true when `filePath` has an entry in the immutability index.
// Replicates the key derivation in fileIndex.mts: birthtimeMs + sha256(path).
// Does NOT spawn any subprocess.
async function isIndexed(filePath: string, indexPath: string): Promise<boolean> {
  let stat
  try {
    stat = await fs.stat(filePath)
  } catch {
    return false
  }
  const day = new Date(stat.birthtimeMs).toISOString().split('T')[0]
  const hashFile = path.join(indexPath, day, sha256hex(filePath))
  try {
    await fs.access(hashFile)
    return true
  } catch {
    return false
  }
}

// Spin-polls `isIndexed` every 10 ms until the file is indexed or `timeoutMs`
// elapses.  Returns the wall-clock timestamp (ms) when indexed, or null on timeout.
async function waitUntilIndexed(filePath: string, indexPath: string, timeoutMs = 60_000): Promise<number | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isIndexed(filePath, indexPath)) return Date.now()
    await new Promise(r => setTimeout(r, 10))
  }
  return null
}

// ---------------------------------------------------------------------------
// Raw cost benchmark
// ---------------------------------------------------------------------------

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// Measures the cost of the individual operations that `lockBackup` performs,
// with no watcher running and no concurrent load, so results reflect pure
// operation overhead with no queue contention.
//
// Reports:
//   1. indexFile — stat + sha256 + write one index entry
//   2. chattr +i — single subprocess spawn
//   3. 5 concurrent chattr +i — one realistic backup (1 json + 4 vhds in parallel)
async function measureRawCosts(scratchDir: string, indexPath: string): Promise<void> {
  console.log('=== Baseline: raw lockBackup operation costs (no watcher, no load) ===')

  // Use a sibling index dir so baseline entries never pollute the main index.
  const measureIndex = path.join(path.dirname(indexPath), '.index-measure')

  const files = await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const p = path.join(scratchDir, `_measure_${i}.json`)
      return fs.writeFile(p, '{}').then(() => p)
    })
  )

  // 1. indexFile: stat + sha256 + write index entry (first-time, no EEXIST)
  const tIdx: number[] = []
  for (const f of files) {
    const t = process.hrtime.bigint()
    await indexFile(f, measureIndex)
    tIdx.push(Number(process.hrtime.bigint() - t) / 1e6)
  }
  console.log(
    `  indexFile (stat+sha256+write):   avg ${average(tIdx).toFixed(1)} ms` +
      `  [${tIdx.map(t => t.toFixed(1)).join(', ')} ms]`
  )

  // 2. chattr +i — single subprocess spawn, 5 sequential runs
  const tChattr1: number[] = []
  for (const f of files) {
    const t = process.hrtime.bigint()
    await execa('chattr', ['+i', f])
    tChattr1.push(Number(process.hrtime.bigint() - t) / 1e6)
    await execa('chattr', ['-i', f])
  }
  console.log(
    `  chattr +i single spawn:          avg ${average(tChattr1).toFixed(1)} ms` +
      `  [${tChattr1.map(t => t.toFixed(1)).join(', ')} ms]`
  )

  // 3. 5 concurrent chattr +i — realistic per-backup case (1 json + 4 vhds)
  const tChattr5: number[] = []
  for (let run = 0; run < 5; run++) {
    const t = process.hrtime.bigint()
    await Promise.all(files.map(f => execa('chattr', ['+i', f])))
    tChattr5.push(Number(process.hrtime.bigint() - t) / 1e6)
    await Promise.all(files.map(f => execa('chattr', ['-i', f])))
  }
  console.log(
    `  5x concurrent chattr +i:         avg ${average(tChattr5).toFixed(1)} ms` +
      `  [${tChattr5.map(t => t.toFixed(1)).join(', ')} ms]`
  )

  // Cleanup scratch files and temp index.
  await Promise.all(files.map(f => fs.unlink(f)))
  await rimraf(measureIndex)
  console.log('')
}

// ---------------------------------------------------------------------------
// Memory tracking
// ---------------------------------------------------------------------------

let peakRss = 0

function sampleMemory(): number {
  const { rss } = process.memoryUsage()
  if (rss > peakRss) peakRss = rss
  return rss
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
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
    vdiUuids: Array.from({ length: DISKS_PER_VM }, (_, j) => makeUuid(VM_COUNT + i * DISKS_PER_VM + j)),
  }))

  // -------------------------------------------------------------------------
  // 1. Create directory structure
  // -------------------------------------------------------------------------
  console.log('Creating directory structure...')
  const tDirs = Date.now()

  await asyncEach(
    vms,
    async vm => {
      await Promise.all(
        vm.vdiUuids.map(vdiUuid =>
          fs.mkdir(path.join(root, 'xo-vm-backups', vm.uuid, 'vdis', JOB_UUID, vdiUuid), {
            recursive: true,
          })
        )
      )
    },
    { concurrency: 200 }
  )
  console.log(`Done in ${Date.now() - tDirs} ms (${VM_COUNT * DISKS_PER_VM} leaf dirs)`)
  console.log('')

  // -------------------------------------------------------------------------
  // 1.5. Baseline: measure raw operation costs (no watcher, no contention)
  // -------------------------------------------------------------------------
  await measureRawCosts(path.join(root, 'xo-vm-backups', vms[0].uuid), indexPath)

  // -------------------------------------------------------------------------
  // 2. Write backup files for OLD_DATE and make them immutable without indexing
  // -------------------------------------------------------------------------
  console.log(`Writing ${VM_COUNT * FILES_PER_VM} files for OLD_DATE (${OLD_DATE})...`)
  const tWrite1 = Date.now()

  const allOldFiles: string[] = []
  await asyncEach(
    vms,
    async vm => {
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
    },
    { concurrency: WRITE_CONCURRENCY }
  )
  console.log(`Files written in ${Date.now() - tWrite1} ms`)

  console.log(`Making ${allOldFiles.length} files immutable (no index)...`)
  const tChattr = Date.now()
  await bulkMakeImmutable(allOldFiles)
  allOldFiles.length = 0 // release path strings; main memory is from the watcher
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
  // Phase A.5 — single-backup probe: watcher running, zero concurrent load.
  // Measures the full json-written → indexed latency for 5 sequential backups
  // on a dedicated probe VM (not in the main 5000).
  // Together with the baseline above this isolates: event delivery latency and
  // readdir overhead = (A.5 latency) − (5× concurrent chattr baseline).
  // -------------------------------------------------------------------------
  console.log('=== Phase A.5: single-backup probe latency (watcher running, no load) ===')

  // Use UUIDs that cannot collide with the main vms[] (all-f prefix).
  const PROBE_VM_UUID = 'ffffffff-ffff-ffff-ffff-000000000001'
  const probeVm = {
    uuid: PROBE_VM_UUID,
    vdiUuids: Array.from(
      { length: DISKS_PER_VM },
      (_, j) => `ffffffff-ffff-ffff-ffff-${String(j + 2).padStart(12, '0')}`
    ),
  }
  const probeVmDir = path.join(root, 'xo-vm-backups', PROBE_VM_UUID)

  // Create the probe VM's VDI directories.  The watcher dynamically picks up
  // the new xo-vm-backups/<UUID>/ directory via watchSubdirectories.
  for (const vdiUuid of probeVm.vdiUuids) {
    await fs.mkdir(path.join(probeVmDir, 'vdis', JOB_UUID, vdiUuid), { recursive: true })
  }
  // Give the watcher time to detect and start watching the new VM dir.
  await new Promise(resolve => setTimeout(resolve, 500))

  const probeSingleTimes: number[] = []
  for (let run = 0; run < 5; run++) {
    // Each run uses a distinct datetime (20240117T120000Z … 20240121T120000Z).
    const pDatetime = `2024011${run + 7}T120000Z`

    // VHD files must be written before the terminal .json signal.
    await Promise.all(
      probeVm.vdiUuids.map(vdiUuid =>
        fs.writeFile(path.join(probeVmDir, 'vdis', JOB_UUID, vdiUuid, `${pDatetime}.vhd`), 'fake vhd data')
      )
    )

    const jsonPath = path.join(probeVmDir, `${pDatetime}.json`)
    const tJsonWritten = Date.now()
    await fs.writeFile(jsonPath, '{}')
    const tIndexed = await waitUntilIndexed(jsonPath, indexPath)

    if (tIndexed !== null) {
      const latency = tIndexed - tJsonWritten
      probeSingleTimes.push(latency)
      console.log(`  run ${run + 1}: json→indexed ${latency} ms`)
    } else {
      console.log(`  run ${run + 1}: TIMEOUT`)
    }
  }

  if (probeSingleTimes.length > 0) {
    const sorted = [...probeSingleTimes].sort((a, b) => a - b)
    const avg = average(probeSingleTimes)
    const med = sorted[Math.floor(sorted.length / 2)]
    const max = sorted[sorted.length - 1]
    console.log(`  avg ${avg.toFixed(0)} ms  median ${med} ms  max ${max} ms`)
    console.log(`  (subtract 5× concurrent chattr baseline above to isolate fs.watch event latency + readdir)`)
  }
  console.log('')

  // -------------------------------------------------------------------------
  // Phase B — write new backups and measure live watcher locking speed.
  // 5 probe VMs are tracked individually: their poller starts as soon as their
  // .json is written, so we capture the true per-backup json→indexed latency
  // even when 5000 backups are competing simultaneously.
  // -------------------------------------------------------------------------
  console.log(`=== Phase B: live watcher — writing ${VM_COUNT} new backups (${NEW_DATE}) ===`)

  // Each probe VM gets a notifier that the write loop calls when the .json
  // is flushed.  The notifier kicks off a background poller.
  const probeWriteNotifiers = new Map<string, (tWritten: number) => void>()
  const probeBTasks = PROBE_VM_INDICES.map(vmIdx => {
    const vm = vms[vmIdx]
    const jsonPath = path.join(root, 'xo-vm-backups', vm.uuid, `${NEW_DATE}.json`)
    return new Promise<{ vmIdx: number; tWritten: number; tIndexed: number | null }>(resolve => {
      probeWriteNotifiers.set(vm.uuid, tWritten => {
        waitUntilIndexed(jsonPath, indexPath).then(tIndexed => resolve({ vmIdx, tWritten, tIndexed }))
      })
    })
  })

  const tWrite2 = Date.now()
  let written2 = 0

  await asyncEach(
    vms,
    async vm => {
      const vmDir = path.join(root, 'xo-vm-backups', vm.uuid)
      await Promise.all(
        vm.vdiUuids.map(vdiUuid =>
          fs.writeFile(path.join(vmDir, 'vdis', JOB_UUID, vdiUuid, `${NEW_DATE}.vhd`), 'fake vhd data')
        )
      )
      // .json written last — triggers lockBackup atomically
      await fs.writeFile(path.join(vmDir, `${NEW_DATE}.json`), '{}')

      written2++
      // Notify probe poller (no-op for non-probe VMs).
      probeWriteNotifiers.get(vm.uuid)?.(Date.now())

      if (written2 % 1000 === 0) {
        sampleMemory()
        console.log(
          `  ${written2}/${VM_COUNT} backups written` +
            ` | ${Date.now() - tWrite2} ms elapsed` +
            ` | peak RSS ${mb(peakRss)}`
        )
      }
    },
    { concurrency: WRITE_CONCURRENCY }
  )
  const tWrite2Done = Date.now() - tWrite2
  console.log(`All ${VM_COUNT} backups written in ${tWrite2Done} ms`)

  // Collect probe latencies — each resolves as soon as the watcher indexes
  // that VM's .json.  Run concurrently with waitForIndexCount below.
  console.log('\n  Probe VM json→indexed latency (under full 5000-VM load):')
  const [probeBResults, phaseB] = await Promise.all([
    Promise.all(probeBTasks),
    waitForIndexCount(indexPath, EXPECTED_PER_PHASE * 2, 'live-lock'),
  ])
  for (const { vmIdx, tWritten, tIndexed } of probeBResults) {
    const latency = tIndexed === null ? 'TIMEOUT' : `${tIndexed - tWritten} ms`
    console.log(`    VM[${String(vmIdx).padStart(4)}]: json→indexed ${latency}`)
  }

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

  const avgProbeSingle = probeSingleTimes.length > 0 ? `${average(probeSingleTimes).toFixed(0)} ms` : 'N/A'
  const avgProbeBLatencies = probeBResults
    .map(r => (r.tIndexed === null ? null : r.tIndexed - r.tWritten))
    .filter((v): v is number => v !== null)
  const avgProbeB = avgProbeBLatencies.length > 0 ? `${average(avgProbeBLatencies).toFixed(0)} ms` : 'N/A'

  console.log('=== Results ===')
  console.log(`watchRemote startup:              ${tWatcherReady} ms`)
  console.log(`Phase A  — rebuild index:         ${phaseA.elapsed} ms  ${phaseA.reached ? 'OK' : 'TIMEOUT'}`)
  console.log(`Phase A.5 — single probe avg:     ${avgProbeSingle}  (no contention)`)
  console.log(`Phase B  — write backups:         ${tWrite2Done} ms`)
  console.log(`Phase B  — lock all:              ${phaseB.elapsed} ms  ${phaseB.reached ? 'OK' : 'TIMEOUT'}`)
  console.log(`Phase B  — avg lock/backup:       ${(phaseB.elapsed / VM_COUNT).toFixed(0)} ms  (total / VM_COUNT)`)
  console.log(`Phase B  — probe avg (5 samples): ${avgProbeB}  (under full load)`)
  console.log(`Phase C  — lift all:              ${tLiftDone} ms  (${liftCount} entries remaining)`)
  console.log(`Memory before watch:              ${mb(rssBeforeWatch)}`)
  console.log(`Memory after watch:               ${mb(rssAfterWatch)}`)
  console.log(`Peak RSS:                         ${mb(peakRss)}`)
  console.log(`Current RSS:                      ${mb(process.memoryUsage().rss)}`)

  await cleanupRoot(root)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
