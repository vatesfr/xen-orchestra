/**
 * test-load.test.mts  —  TypeScript test, NEW pool.loadBalancer endpoint
 *
 * Compiled to dist/ and picked up by: cd dist && node --test
 * Can also be run standalone after build:
 *   node dist/test-load.test.mjs
 *
 * Calls plugin.loadBalancer(planConfig, { dryRun: true }) — the new API —
 * then compares the result with any existing JS-test reference, producing a
 * combined JSON + human-readable console summary.
 *
 * Writes results to: test-load-results-ts.json
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// The plugin default export is the factory function
import factory from './index.mjs'
import { buildObjects, buildHostStats, buildVmStats, hostLoadSnapshot, POOL_IDS } from './test-load-data.mjs'

// ─── mock XO ──────────────────────────────────────────────────────────────────

const objects = buildObjects()
const hostStats = buildHostStats()
const vmStats = buildVmStats()

const mockXo = {
  getObjects: () => objects,
  getObject: (id: string) => objects[id],
  getXapiHostStats: async (hostId: string) => hostStats[hostId] ?? { stats: { cpus: {}, memory: [], memoryFree: [] } },
  getXapiVmStats: async (vmId: string) => vmStats[vmId] ?? { stats: { cpus: {}, memory: [], memoryFree: [] } },
  getXapi: () => ({ migrateVm: async () => {}, powerOnHost: async () => {}, shutdownHost: async () => {} }),
  // registerRestApi is called during load() — stub it out
  registerRestApi: () => () => {},
}

// ─── plugin instantiation ─────────────────────────────────────────────────────

// factory returns a LoadBalancerPlugin instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugin = factory({ xo: mockXo as any })

// Configure with no pre-defined plans (we call loadBalancer() directly)
plugin.configure({ advanced: { maxConcurrentMigrations: 1, migrationCooldown: 0 } })

// ─── plan config ──────────────────────────────────────────────────────────────

const planConfig = {
  name: 'test-ts',
  mode: 'Performance mode',
  pools: POOL_IDS,
  thresholds: { cpu: 90, memoryFree: 1000 },
  balanceVcpus: false as const,
  // affinityTags / antiAffinityTags are discovered from VM tags automatically
  // inside loadBalancer(), so we don't set them here
}

// ─── test suite ───────────────────────────────────────────────────────────────

let migrationMap: Record<string, string> = {}
let elapsedMs = 0

describe('pool.loadBalancer (dryRun=true)', () => {
  before(async () => {
    const t0 = performance.now()
    migrationMap = await plugin.loadBalancer(planConfig, { dryRun: true })
    elapsedMs = Math.round((performance.now() - t0) * 100) / 100
  })

  it('returns a plain object', () => {
    assert.equal(typeof migrationMap, 'object')
    assert.notEqual(migrationMap, null)
  })

  it('does not migrate the ignored VM (vm-05)', () => {
    assert.equal(migrationMap['vm-05'], undefined)
  })

  it('does not migrate VMs from lightly-loaded hosts unnecessarily (host-4)', () => {
    // host-4 is at 15% CPU — none of its VMs should be migrated away
    const vmsOnHost4 = Object.values(objects)
      .filter(
        (o): o is (typeof objects)[string] & { type: 'VM'; $container: string } =>
          o.type === 'VM' && (o as { $container: string }).$container === 'host-4'
      )
      .map(o => (o as { id: string }).id)
    for (const vmId of vmsOnHost4) {
      assert.equal(migrationMap[vmId], undefined, `vm ${vmId} on host-4 should not be migrated`)
    }
  })

  it('planned migrations go to less-loaded hosts', () => {
    const overloadedHosts = new Set(['host-1'])
    for (const [vmId, destHostId] of Object.entries(migrationMap)) {
      assert.ok(
        !overloadedHosts.has(destHostId),
        `VM ${vmId} must not migrate to an overloaded host, got: ${destHostId}`
      )
    }
  })
})

// ─── reporting ────────────────────────────────────────────────────────────────

// Run inline (describe runs synchronously collecting tests; results below run after)
// We use a short post-test hook via setImmediate to write after all tests
setImmediate(() => {
  const migrations = Object.entries(migrationMap).map(([vmId, toHostId]) => {
    const vm = objects[vmId] as {
      name_label: string
      $container: string
      tags: string[]
      memory: { size: number }
      CPUs: { number: number }
    }
    return {
      vmId,
      vmName: vm?.name_label ?? vmId,
      fromHostId: vm?.$container,
      toHostId,
      vmTags: vm?.tags ?? [],
      vmMemGb: (vm?.memory?.size ?? 0) / 1024 ** 3,
      vmVcpus: vm?.CPUs?.number ?? 0,
    }
  })

  const beforeSnapshot = hostLoadSnapshot()

  function simulateLoad(snap: typeof beforeSnapshot, migs: typeof migrations) {
    const hostMap: Record<string, (typeof snap)[0] & { vms: (typeof snap)[0]['vms'] }> = Object.fromEntries(
      snap.map(h => [h.host, { ...h, vms: [...h.vms] }])
    )
    for (const m of migs) {
      const src = hostMap[m.fromHostId ?? '']
      const dst = hostMap[m.toHostId]
      if (!src || !dst) continue
      const idx = src.vms.findIndex(v => v.id === m.vmId)
      if (idx !== -1) {
        const vm = src.vms[idx]!
        src.vms.splice(idx, 1)
        dst.vms.push(vm)
        const contrib = (vm.cpuPct * vm.nVcpus) / 8
        src.cpuPct = Math.max(0, src.cpuPct - contrib)
        dst.cpuPct += contrib
        dst.memFreeMb -= vm.memGb * 1024
        src.memFreeMb += vm.memGb * 1024
      }
    }
    return Object.values(hostMap)
  }

  const afterSnapshot = simulateLoad(
    beforeSnapshot.map(h => ({ ...h, vms: h.vms.map(v => ({ ...v })) })),
    migrations
  )

  // Load JS reference if present
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const jsResultPath = join(__dirname, '..', 'test-load-results-js.json')
  let jsReference: {
    summary?: { migrationMap?: Record<string, string>; migrationsPlanned?: number }
    meta?: { elapsedMs?: number }
  } | null = null
  if (existsSync(jsResultPath)) {
    try {
      jsReference = JSON.parse(readFileSync(jsResultPath, 'utf8'))
    } catch {
      /* ignore */
    }
  }

  const comparison = jsReference
    ? (() => {
        const jsMigMap = jsReference.summary?.migrationMap ?? {}
        const tsMigMap = migrationMap
        const allVms = new Set([...Object.keys(jsMigMap), ...Object.keys(tsMigMap)])
        const diffs: string[] = []
        for (const vmId of allVms) {
          if (jsMigMap[vmId] !== tsMigMap[vmId]) {
            diffs.push(`${vmId}: js→${jsMigMap[vmId] ?? 'none'} ts→${tsMigMap[vmId] ?? 'none'}`)
          }
        }
        return {
          jsElapsedMs: jsReference.meta?.elapsedMs,
          tsElapsedMs: elapsedMs,
          jsMigrationsCount: jsReference.summary?.migrationsPlanned ?? 0,
          tsMigrationsCount: migrations.length,
          migrationDifferences: diffs,
          identical: diffs.length === 0,
        }
      })()
    : null

  const results = {
    meta: {
      test: 'ts-new-api',
      timestamp: new Date().toISOString(),
      elapsedMs,
      planMode: planConfig.mode,
      pools: POOL_IDS,
      thresholds: planConfig.thresholds,
      dryRun: true,
    },
    summary: {
      totalVms: Object.values(objects).filter(o => o.type === 'VM').length,
      totalHosts: Object.values(objects).filter(o => o.type === 'host').length,
      migrationsPlanned: migrations.length,
      migrationMap,
    },
    migrations,
    before: beforeSnapshot,
    after: afterSnapshot,
    comparison,
  }

  writeFileSync('test-load-results-ts.json', JSON.stringify(results, null, 2))

  console.log(`\n[TS test] Done in ${elapsedMs} ms`)
  console.log(`  Migrations planned: ${migrations.length}`)
  for (const m of migrations) {
    console.log(
      `  VM ${m.vmId} (${m.vmMemGb}GB, ${m.vmVcpus}vCPU) [${m.vmTags.join(',')}]: ${m.fromHostId} → ${m.toHostId}`
    )
  }
  if (comparison) {
    console.log(`\n  Comparison with JS test:`)
    console.log(`    JS: ${comparison.jsMigrationsCount} migrations in ${comparison.jsElapsedMs}ms`)
    console.log(`    TS: ${comparison.tsMigrationsCount} migrations in ${comparison.tsElapsedMs}ms`)
    console.log(`    Results identical: ${comparison.identical}`)
    if (!comparison.identical) {
      console.log(`    Differences:`)
      for (const d of comparison.migrationDifferences) console.log(`      ${d}`)
    }
  }
  console.log('  Results written to test-load-results-ts.json')
})
