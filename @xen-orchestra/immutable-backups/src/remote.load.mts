#!/usr/bin/env node
//
// Load test: 5000 VMs × 4 flat VHDs.
//
// Phase A — live watcher:
//   Write backups for all VMs while the watcher is running and measure how
//   long it takes for every backup to become immutable.
//
// Phase B — lift:
//   Lift immutability on all locked files and measure the duration.
//
// Must be run as root (chattr requires elevated privileges).
// Usage:  node @xen-orchestra/immutable-backups/protectRemote.load.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import { asyncEach } from '@vates/async-each'
import * as File from './file.mjs'
import { watchRemote } from './remote.mjs'
import { liftRemoteImmutability } from './liftProtection.mjs'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VM_COUNT = 5000
const DISKS_PER_VM = 4
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'

/** Datetime used for the live backups (Phase B). */
const BACKUP_DATE = '20240115T120000Z'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** Max concurrent backup file writes. */
const WRITE_CONCURRENCY = 100

/** Max files per lsattr call (avoids ARG_MAX). */
const LSATTR_BATCH = 500

/** Max time to wait for all backups to be locked (ms). */
const LOCK_TIMEOUT_MS = 120_000

// Each VM backup: 1 .json + DISKS_PER_VM plain .vhd files.
const FILES_PER_VM = 1 + DISKS_PER_VM
const EXPECTED_TOTAL = VM_COUNT * FILES_PER_VM

/**
 * Indices into `vms[]` whose json→immutable latency is tracked individually
 * to show per-backup timing under full concurrent load.
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

// Spin-polls File.isImmutable every 10 ms until the file is immutable or
// `timeoutMs` elapses.  Returns the wall-clock timestamp (ms) when locked,
// or null on timeout.
async function waitUntilImmutable(filePath: string, timeoutMs = 60_000): Promise<number | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await File.isImmutable(filePath).catch(() => false)) return Date.now()
    await new Promise(r => setTimeout(r, 10))
  }
  return null
}

// Count how many `<date>.json` files across all VM dirs are currently immutable.
// Uses batched lsattr calls to avoid hitting ARG_MAX.
async function countImmutableJsonFiles(root: string, date: string, vmUuids: string[]): Promise<number> {
  let count = 0
  for (let i = 0; i < vmUuids.length; i += LSATTR_BATCH) {
    const batch = vmUuids.slice(i, i + LSATTR_BATCH).map(uuid => path.join(root, 'xo-vm-backups', uuid, `${date}.json`))
    try {
      const { stdout } = await execa('lsattr', ['-d', ...batch])
      count += stdout.split('\n').filter(line => line.length > 4 && line[4] === 'i').length
    } catch (err) {
      // lsattr exits non-zero when some files don't exist yet — parse stdout anyway
      const out = (err as any).stdout as string | undefined
      if (out) count += out.split('\n').filter((line: string) => line.length > 4 && line[4] === 'i').length
    }
  }
  return count
}

// Poll `countImmutableJsonFiles` until it reaches `target` or `LOCK_TIMEOUT_MS`
// elapses.  Logs progress on every change.
async function waitForImmutableCount(
  root: string,
  date: string,
  vmUuids: string[],
  target: number,
  label: string
): Promise<{ elapsed: number; reached: boolean }> {
  const tStart = Date.now()
  let lastCount = await countImmutableJsonFiles(root, date, vmUuids)
  console.log(`  [${label}] starting at ${lastCount}/${target}`)

  const deadline = Date.now() + LOCK_TIMEOUT_MS
  while (Date.now() < deadline) {
    sampleMemory()
    const count = await countImmutableJsonFiles(root, date, vmUuids)
    if (count !== lastCount) {
      console.log(
        `  [${label}] immutable json files: ${count}/${target}` +
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
//   1. chattr +i — single subprocess spawn
//   2. 5 concurrent chattr +i — one realistic backup (1 json + 4 vhds in parallel)
async function measureRawCosts(scratchDir: string): Promise<void> {
  console.log('=== Baseline: raw lockBackup operation costs (no watcher, no load) ===')

  const files = await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const p = path.join(scratchDir, `_measure_${i}.json`)
      return fs.writeFile(p, '{}').then(() => p)
    })
  )

  // 1. chattr +i — single subprocess spawn, 5 sequential runs
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

  // 2. 5 concurrent chattr +i — realistic per-backup case (1 json + 4 vhds)
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

  await Promise.all(files.map(f => fs.unlink(f)))
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

  console.log(`Root:            ${root}`)
  console.log(`VMs:             ${VM_COUNT}`)
  console.log(`Disks per VM:    ${DISKS_PER_VM}`)
  console.log(`Files per VM:    ${FILES_PER_VM}`)
  console.log(`Expected total:  ${EXPECTED_TOTAL}`)
  console.log('')

  const vms = Array.from({ length: VM_COUNT }, (_, i) => ({
    uuid: makeUuid(i),
    vdiUuids: Array.from({ length: DISKS_PER_VM }, (_, j) => makeUuid(VM_COUNT + i * DISKS_PER_VM + j)),
  }))
  const vmUuids = vms.map(vm => vm.uuid)

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
  await measureRawCosts(path.join(root, 'xo-vm-backups', vms[0].uuid))

  // -------------------------------------------------------------------------
  // 2. Start memory sampling + watchRemote
  // -------------------------------------------------------------------------
  const memSampler = setInterval(sampleMemory, 50)
  sampleMemory()
  const rssBeforeWatch = process.memoryUsage().rss
  console.log(`Memory before watchRemote: ${mb(rssBeforeWatch)}`)

  const tWatchStart = Date.now()
  const { close } = await watchRemote('load-test', {
    root,
    immutabilityDuration: ONE_DAY_MS,
    delayBetweenSizeCheck: 100,
  })
  const tWatcherReady = Date.now() - tWatchStart

  await new Promise(resolve => setTimeout(resolve, 500))
  sampleMemory()
  const rssAfterWatch = process.memoryUsage().rss
  console.log(`watchRemote ready in ${tWatcherReady} ms`)
  console.log(`Memory after watchRemote:  ${mb(rssAfterWatch)} (delta: ${mb(rssAfterWatch - rssBeforeWatch)})`)
  console.log('')

  // -------------------------------------------------------------------------
  // Phase A — single-backup probe: watcher running, zero concurrent load.
  // Measures json-written → immutable latency for 5 sequential backups on a
  // dedicated probe VM (not in the main 5000).
  // Together with the baseline this isolates: event delivery + readdir overhead
  // = (Phase A latency) − (5× concurrent chattr baseline).
  // -------------------------------------------------------------------------
  console.log('=== Phase A: single-backup probe latency (watcher running, no load) ===')

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

  for (const vdiUuid of probeVm.vdiUuids) {
    await fs.mkdir(path.join(probeVmDir, 'vdis', JOB_UUID, vdiUuid), { recursive: true })
  }
  // Give the watcher time to detect and start watching the new VM dir.
  await new Promise(resolve => setTimeout(resolve, 500))

  const probeSingleTimes: number[] = []
  for (let run = 0; run < 5; run++) {
    const pDatetime = `2024011${run + 1}T120000Z`

    await Promise.all(
      probeVm.vdiUuids.map(vdiUuid =>
        fs.writeFile(path.join(probeVmDir, 'vdis', JOB_UUID, vdiUuid, `${pDatetime}.vhd`), 'fake vhd data')
      )
    )

    const jsonPath = path.join(probeVmDir, `${pDatetime}.json`)
    const tJsonWritten = Date.now()
    await fs.writeFile(jsonPath, '{}')
    const tLocked = await waitUntilImmutable(jsonPath)

    if (tLocked !== null) {
      const latency = tLocked - tJsonWritten
      probeSingleTimes.push(latency)
      console.log(`  run ${run + 1}: json→immutable ${latency} ms`)
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
  // Phase B — write all VM backups and measure live watcher locking speed.
  // 5 probe VMs are tracked individually for per-backup latency under load.
  // -------------------------------------------------------------------------
  console.log(`=== Phase B: live watcher — writing ${VM_COUNT} backups (${BACKUP_DATE}) ===`)

  const probeWriteNotifiers = new Map<string, (tWritten: number) => void>()
  const probeBTasks = PROBE_VM_INDICES.map(vmIdx => {
    const vm = vms[vmIdx]
    const jsonPath = path.join(root, 'xo-vm-backups', vm.uuid, `${BACKUP_DATE}.json`)
    return new Promise<{ vmIdx: number; tWritten: number; tLocked: number | null }>(resolve => {
      probeWriteNotifiers.set(vm.uuid, tWritten => {
        waitUntilImmutable(jsonPath).then(tLocked => resolve({ vmIdx, tWritten, tLocked }))
      })
    })
  })

  const tWrite = Date.now()
  let written = 0

  await asyncEach(
    vms,
    async vm => {
      const vmDir = path.join(root, 'xo-vm-backups', vm.uuid)
      await Promise.all(
        vm.vdiUuids.map(vdiUuid =>
          fs.writeFile(path.join(vmDir, 'vdis', JOB_UUID, vdiUuid, `${BACKUP_DATE}.vhd`), 'fake vhd data')
        )
      )
      await fs.writeFile(path.join(vmDir, `${BACKUP_DATE}.json`), '{}')

      written++
      probeWriteNotifiers.get(vm.uuid)?.(Date.now())

      if (written % 1000 === 0) {
        sampleMemory()
        console.log(
          `  ${written}/${VM_COUNT} backups written` +
            ` | ${Date.now() - tWrite} ms elapsed` +
            ` | peak RSS ${mb(peakRss)}`
        )
      }
    },
    { concurrency: WRITE_CONCURRENCY }
  )
  const tWriteDone = Date.now() - tWrite
  console.log(`All ${VM_COUNT} backups written in ${tWriteDone} ms`)

  console.log('\n  Probe VM json→immutable latency (under full load):')
  const [probeBResults, phaseB] = await Promise.all([
    Promise.all(probeBTasks),
    waitForImmutableCount(root, BACKUP_DATE, vmUuids, VM_COUNT, 'live-lock'),
  ])
  for (const { vmIdx, tWritten, tLocked } of probeBResults) {
    const latency = tLocked === null ? 'TIMEOUT' : `${tLocked - tWritten} ms`
    console.log(`    VM[${String(vmIdx).padStart(4)}]: json→immutable ${latency}`)
  }

  console.log(`Phase B ${phaseB.reached ? 'DONE' : 'TIMEOUT'} in ${phaseB.elapsed} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // Phase C — lift all immutability
  // -------------------------------------------------------------------------
  await close()

  console.log(`=== Phase C: lift all ${EXPECTED_TOTAL} protected files ===`)
  const tLift = Date.now()
  let lastLiftLog = Date.now()

  const liftSampler = setInterval(() => {
    sampleMemory()
    const now = Date.now()
    if (now - lastLiftLog >= 5000) {
      console.log(`  lifting in progress... ${Date.now() - tLift} ms elapsed | peak RSS ${mb(peakRss)}`)
      lastLiftLog = now
    }
  }, 1000)

  await liftRemoteImmutability(root, 0)

  clearInterval(liftSampler)
  sampleMemory()
  const tLiftDone = Date.now() - tLift
  console.log(`Phase C DONE in ${tLiftDone} ms`)
  console.log('')

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------
  clearInterval(memSampler)
  sampleMemory()

  const avgProbeSingle = probeSingleTimes.length > 0 ? `${average(probeSingleTimes).toFixed(0)} ms` : 'N/A'
  const avgProbeBLatencies = probeBResults
    .map(r => (r.tLocked === null ? null : r.tLocked - r.tWritten))
    .filter((v): v is number => v !== null)
  const avgProbeB = avgProbeBLatencies.length > 0 ? `${average(avgProbeBLatencies).toFixed(0)} ms` : 'N/A'

  console.log('=== Results ===')
  console.log(`watchRemote startup:              ${tWatcherReady} ms`)
  console.log(`Phase A  — single probe avg:      ${avgProbeSingle}  (no contention)`)
  console.log(`Phase B  — write backups:         ${tWriteDone} ms`)
  console.log(`Phase B  — lock all:              ${phaseB.elapsed} ms  ${phaseB.reached ? 'OK' : 'TIMEOUT'}`)
  console.log(`Phase B  — avg lock/backup:       ${(phaseB.elapsed / VM_COUNT).toFixed(0)} ms  (total / VM_COUNT)`)
  console.log(`Phase B  — probe avg (5 samples): ${avgProbeB}  (under full load)`)
  console.log(`Phase C  — lift all:              ${tLiftDone} ms`)
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
