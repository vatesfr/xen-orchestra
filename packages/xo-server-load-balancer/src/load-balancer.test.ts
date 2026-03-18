/**
 * Tests for the refactored TypeScript load-balancer module.
 *
 * All tests run against mock objects — no real XenServer infrastructure is touched.
 *
 * Import notes (future refactored module):
 *  - Stats helper functions (computeAverage, etc.) must be exported from utils.js
 *  - Plan, PerformancePlan and DensityPlan must be exported as named or default exports
 *  - The Xapi interface must expose assertCanMigrateVm(vmXapiId, destHostXapiId)
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'

// NOTE: paths reflect the future compiled TypeScript output.
// Adjust if the refactored module uses different file names.
import { computeAverage, computeResourcesAverage, computeResourcesAverageWithWeight, computeAverageCpu } from './utils.js'
import Plan, { type Host, type Vm, type Xo, type ConcurrencyLimiter } from './plan.js'
import PerformancePlan from './performance-plan.js'
import DensityPlan from './density-plan.js'

const { describe } = test

// ===================================================================
// Test infrastructure — factories and mock objects
// ===================================================================

function makeHost({
  id = 'host-1',
  poolId = 'pool-1',
  cpuCount = 4,
  powerState = 'Running',
  powerOnMode = 'IPMI',
}: {
  id?: string
  poolId?: string
  cpuCount?: number
  powerState?: string
  powerOnMode?: string
} = {}) {
  return {
    id,
    type: 'host' as const,
    $poolId: poolId,
    power_state: powerState,
    powerOnMode,
    name_label: id,
    CPUs: { cpu_count: cpuCount },
    cpus: { cores: cpuCount },
    _xapiId: `xapi-${id}`,
  }
}

function makeVm({
  id = 'vm-1',
  hostId = 'host-1',
  poolId = 'pool-1',
  xenTools = true,
  tags = [] as string[],
  vcpus = 2,
}: {
  id?: string
  hostId?: string
  poolId?: string
  xenTools?: boolean
  tags?: string[]
  vcpus?: number
} = {}) {
  return {
    id,
    type: 'VM',
    $poolId: poolId,
    $container: hostId,
    power_state: 'Running',
    name_label: id,
    tags,
    xenTools,
    CPUs: { number: vcpus },
    _xapiId: `xapi-${id}`,
  }
}

function makePool({ id = 'pool-1', master = 'host-1' }: { id?: string; master?: string } = {}) {
  return { id, type: 'pool', master, name_label: id }
}

/**
 * Builds uniform host stats where every time-series point has the same value.
 * This makes weighted-average calculations fully predictable in tests.
 */
function makeHostStats({
  cpuPercent,
  memFreeBytes,
  nCpus = 4,
  nPoints = 30,
}: {
  cpuPercent: number
  memFreeBytes: number
  nCpus?: number
  nPoints?: number
}) {
  const totalBytes = 8 * 1024 ** 3
  return {
    stats: {
      cpus: Array.from({ length: nCpus }, () => Array(nPoints).fill(cpuPercent)),
      memoryFree: Array(nPoints).fill(memFreeBytes),
      memory: Array(nPoints).fill(totalBytes - memFreeBytes),
    },
  }
}

/**
 * Builds uniform VM stats.
 */
function makeVmStats({
  cpuPercent,
  memBytes,
  nVcpus = 2,
  nPoints = 30,
}: {
  cpuPercent: number
  memBytes: number
  nVcpus?: number
  nPoints?: number
}) {
  return {
    stats: {
      cpus: Array.from({ length: nVcpus }, () => Array(nPoints).fill(cpuPercent)),
      memoryFree: Array(nPoints).fill(0),
      memory: Array(nPoints).fill(memBytes),
    },
  }
}

/**
 * Mock XAPI connection for a single host.
 * Tracks every call; configure failMigrations / denyMigrations to simulate failures.
 */
class MockXapi {
  migrations: Array<{ vmXapiId: string; destHostXapiId: string }> = []
  shutdowns: string[] = []
  powerOns: string[] = []
  assertCanMigrateCalls: Array<{ vmXapiId: string; destHostXapiId: string }> = []

  /** VM xapi IDs that should throw on migrateVm() */
  failMigrations = new Set<string>()
  /** VM xapi IDs that should throw on assertCanMigrateVm() */
  denyMigrations = new Set<string>()

  async migrateVm(vmXapiId: string, destXapi: unknown, destHostXapiId: string): Promise<void> {
    if (this.failMigrations.has(vmXapiId)) {
      throw new Error(`Simulated migration failure for ${vmXapiId}`)
    }
    this.migrations.push({ vmXapiId, destHostXapiId })
  }

  async assertCanMigrateVm(vmXapiId: string, destHostXapiId: string): Promise<void> {
    if (this.denyMigrations.has(vmXapiId)) {
      throw new Error(`assert_can_migrate rejected ${vmXapiId}`)
    }
    this.assertCanMigrateCalls.push({ vmXapiId, destHostXapiId })
  }

  async shutdownHost(hostId: string): Promise<void> {
    this.shutdowns.push(hostId)
  }

  async powerOnHost(hostId: string): Promise<void> {
    this.powerOns.push(hostId)
  }
}

/**
 * Creates a mock XO server.
 * Returns the same MockXapi instance for any given host id so tests can
 * inspect calls per-host after plan execution.
 */
type MockXo = Omit<Xo, 'getXapi' | 'getObjects'> & {
  getObjects: () => Record<string, any>
  getXapi: (idOrObject: string | { id: string }) => MockXapi
  getXapiFor: (hostId: string) => MockXapi | undefined
}

function createMockXo({
  objects = {} as Record<string, any>,
  hostStats = {} as Record<string, unknown>,
  vmStats = {} as Record<string, unknown>,
} = {}): MockXo {
  const xapiByHostId = new Map<string, MockXapi>()

  const getXapi = (idOrObject: string | { id: string }): MockXapi => {
    const id = typeof idOrObject === 'string' ? idOrObject : idOrObject.id
    if (!xapiByHostId.has(id)) {
      xapiByHostId.set(id, new MockXapi())
    }
    return xapiByHostId.get(id)!
  }

  return {
    getObjects: () => objects,
    getObject: (id: string) => objects[id],
    getXapi,
    getXapiHostStats: async (host: Host) => hostStats[host.id] as any,
    getXapiVmStats: async (vm: Vm) => vmStats[vm.id] as any,
    getXapiFor: (hostId: string) => xapiByHostId.get(hostId),
    addApiMethods: () => () => {},
  }
}

/**
 * Passthrough concurrency limiter for tests — no throttling.
 * Matches the .call(obj, methodName, ...args) interface of limit-concurrency-decorator.
 */
const noopLimiter: ConcurrencyLimiter = {
  call: (obj: any, method: string, ...args: unknown[]) => obj[method](...args),
}

const DEFAULT_GLOBAL_OPTIONS = {
  ignoredVmTags: new Set<string>(),
  migrationCooldown: 30 * 60 * 1000,
  migrationHistory: new Map<string, number>(),
}

const GB = 1024 ** 3
const MB = 1024 * 1024

// ===================================================================
// Stats computation — pure functions, no XO needed
// ===================================================================

describe('Stats computation', { concurrency: 1 }, () => {
  test('computeAverage returns undefined for undefined input', () => {
    assert.strictEqual(computeAverage(undefined), undefined, 'missing data should yield undefined')
  })

  test('computeAverage computes the mean of all values', () => {
    assert.strictEqual(computeAverage([10, 20, 30]), 20, 'mean of [10,20,30] should be 20')
  })

  test('computeAverage uses only the last N points when nPoints is given', () => {
    // Last 2 of [10, 20, 30, 40] → mean(30, 40) = 35
    assert.strictEqual(computeAverage([10, 20, 30, 40], 2), 35, 'should average only the last 2 points')
  })

  test('computeAverage excludes zero values from the denominator', () => {
    // [10, 0, 30]: sum = 40, non-zero count = 2 → avg = 20
    assert.strictEqual(computeAverage([10, 0, 30]), 20, 'zeros should not count in the denominator')
  })

  test('computeResourcesAverage aggregates CPU across all physical cores', () => {
    const host = makeHost({ id: 'h1', cpuCount: 2 })
    const hostsStats = {
      h1: {
        stats: {
          cpus: [[50, 50], [100, 100]], // core 0: 50%, core 1: 100%
          memoryFree: [2 * GB],
          memory: [6 * GB],
        },
      },
    }
    const averages = computeResourcesAverage([host], hostsStats, undefined)
    // mean of per-core averages: (50 + 100) / 2 = 75
    assert.strictEqual(averages['h1'].cpu, 75, 'CPU should be the mean across all cores')
    assert.strictEqual(averages['h1'].nCpus, 2, 'nCpus should reflect the number of physical cores')
  })

  test('computeResourcesAverageWithWeight blends at 75% recent / 25% historical', () => {
    const recent = { h1: { cpu: 80, memoryFree: 1000, memory: 7000, nCpus: 4 } }
    const historical = { h1: { cpu: 40, memoryFree: 3000, memory: 5000, nCpus: 4 } }
    const blended = computeResourcesAverageWithWeight(recent, historical, 0.75)
    // cpu:       80 * 0.75 + 40 * 0.25 = 70
    // memoryFree: 1000 * 0.75 + 3000 * 0.25 = 1500
    assert.strictEqual(blended['h1'].cpu, 70, 'blended CPU should apply 75/25 weighting')
    assert.strictEqual(blended['h1'].memoryFree, 1500, 'blended memoryFree should apply 75/25 weighting')
  })

  test('computeAverageCpu weights pool CPU proportionally to physical core count', () => {
    // host-1: 4 CPUs at 80%; host-2: 2 CPUs at 20%
    // weighted avg = (4*80 + 2*20) / 6 = 360 / 6 = 60
    const hostsAverages = {
      h1: { cpu: 80, nCpus: 4, memoryFree: 0, memory: 0 },
      h2: { cpu: 20, nCpus: 2, memoryFree: 0, memory: 0 },
    }
    const poolAvg = computeAverageCpu(hostsAverages)
    assert.ok(Math.abs(poolAvg - 60) < 0.001, `pool CPU avg should be 60, got ${poolAvg}`)
  })
})

// ===================================================================
// Threshold computation — Plan constructor
// ===================================================================

describe('Threshold computation', { concurrency: 1 }, () => {
  const makePerfPlan = (thresholds = {}) =>
    new PerformancePlan(undefined, 'test', ['p1'], { thresholds }, DEFAULT_GLOBAL_OPTIONS, noopLimiter)

  test('CPU high threshold is 85% of the critical value', () => {
    const plan = makePerfPlan({ cpu: 100 })
    assert.strictEqual(plan._thresholds.cpu.high, 85, 'high CPU threshold should be 85% of critical')
  })

  test('CPU low threshold is 65% of the critical value', () => {
    const plan = makePerfPlan({ cpu: 100 })
    assert.strictEqual(plan._thresholds.cpu.low, 65, 'low CPU threshold should be 65% of critical')
  })

  test('memory high threshold is 120% of the critical value', () => {
    const criticalBytes = 1000 * MB
    const plan = makePerfPlan({ memoryFree: 1000 })
    assert.strictEqual(plan._thresholds.memoryFree.high, criticalBytes * 1.2, 'high memory threshold should be 120% of critical')
  })

  test('memory low threshold is 150% of the critical value', () => {
    const criticalBytes = 1000 * MB
    const plan = makePerfPlan({ memoryFree: 1000 })
    assert.strictEqual(plan._thresholds.memoryFree.low, criticalBytes * 1.5, 'low memory threshold should be 150% of critical')
  })

  test('default CPU critical threshold is 90%', () => {
    const plan = makePerfPlan()
    assert.strictEqual(plan._thresholds.cpu.critical, 90, 'default critical CPU should be 90%')
  })

  test('default memory critical threshold is 1 GB', () => {
    const plan = makePerfPlan()
    assert.strictEqual(plan._thresholds.memoryFree.critical, 1000 * MB, 'default critical free memory should be 1 GB')
  })
})

// ===================================================================
// Migration cooldown
// ===================================================================

describe('Migration cooldown', { concurrency: 1 }, () => {
  const makePlanWithHistory = (cooldownMs = 30 * 60 * 1000) => {
    const migrationHistory = new Map<string, number>()
    const globalOptions = { ignoredVmTags: new Set<string>(), migrationCooldown: cooldownMs, migrationHistory }
    const plan = new Plan(undefined, 'test', ['p1'], {}, globalOptions, noopLimiter)
    return { plan, migrationHistory }
  }

  test('VM never migrated before is not in cooldown', () => {
    const { plan } = makePlanWithHistory()
    const vm = makeVm({ id: 'vm-fresh' })
    assert.strictEqual(plan._isVmInCooldown(vm), false, 'a VM with no migration history should not be blocked')
  })

  test('VM migrated just now is in cooldown', () => {
    const { plan, migrationHistory } = makePlanWithHistory()
    const vm = makeVm({ id: 'vm-hot' })
    migrationHistory.set(vm.id, Date.now())
    assert.strictEqual(plan._isVmInCooldown(vm), true, 'VM migrated just now should be in cooldown')
  })

  test('VM migrated after the cooldown period expired is no longer blocked', () => {
    const cooldownMs = 30 * 60 * 1000
    const { plan, migrationHistory } = makePlanWithHistory(cooldownMs)
    const vm = makeVm({ id: 'vm-expired' })
    migrationHistory.set(vm.id, Date.now() - cooldownMs - 1000) // 1 s past expiry
    assert.strictEqual(plan._isVmInCooldown(vm), false, 'VM whose cooldown has expired should not be blocked')
  })

  test('cooldown = 0 never blocks any VM', () => {
    const { plan, migrationHistory } = makePlanWithHistory(0)
    const vm = makeVm({ id: 'vm-no-cooldown' })
    migrationHistory.set(vm.id, Date.now()) // just migrated
    assert.strictEqual(plan._isVmInCooldown(vm), false, 'cooldown = 0 should disable the feature entirely')
  })
})

// ===================================================================
// Coalition computation (migrated from plan.test.js and extended)
// ===================================================================

describe('Coalition computation', { concurrency: 1 }, () => {
  const plan = new Plan(undefined, 'test', ['p1'], {}, DEFAULT_GLOBAL_OPTIONS, noopLimiter)

  const coalitionCases = [
    {
      description: 'tags with no shared VMs form independent singleton coalitions',
      affinityTags: ['A', 'B'],
      vms: [{ tags: ['A'] }, { tags: ['B'] }, { tags: ['A', 'Z'] }],
      expected: { A: ['A'], B: ['B'] },
    },
    {
      description: 'two tags on the same VM form a direct coalition',
      affinityTags: ['A', 'B', 'C'],
      vms: [{ tags: ['A', 'B'] }, { tags: ['B'] }],
      expected: { A: ['A', 'B'], B: ['B', 'A'], C: ['C'] },
    },
    {
      description: 'indirect coalition A-B + B-C collapses to a single A-B-C group',
      affinityTags: ['A', 'B', 'C'],
      vms: [{ tags: ['A', 'B'] }, { tags: ['B', 'C'] }],
      expected: { A: ['A', 'B', 'C'], B: ['B', 'A', 'C'], C: ['C', 'B', 'A'] },
    },
    {
      description: 'complex four-tag chain resolves to a single coalition',
      affinityTags: ['A', 'B', 'C', 'D'],
      vms: [{ tags: ['A', 'B'] }, { tags: ['C', 'D'] }, { tags: ['B', 'D'] }],
      expected: {
        A: ['A', 'B', 'D', 'C'],
        B: ['B', 'A', 'D', 'C'],
        C: ['C', 'D', 'B', 'A'],
        D: ['D', 'C', 'B', 'A'],
      },
    },
    {
      description: 'tag never present in any VM still receives a singleton coalition',
      affinityTags: ['A', 'UNUSED'],
      vms: [{ tags: ['A'] }],
      expected: { A: ['A'], UNUSED: ['UNUSED'] },
    },
  ]

  for (const { description, affinityTags, vms, expected } of coalitionCases) {
    test(description, () => {
      assert.deepEqual(plan._computeCoalitions(vms, affinityTags), expected)
    })
  }
})

// ===================================================================
// Performance plan — threshold detection
// ===================================================================

describe('Performance plan — threshold detection', { concurrency: 1 }, () => {
  const makePerfPlan = () =>
    new PerformancePlan(undefined, 'test', ['p1'], { thresholds: { cpu: 90, memoryFree: 1000 } }, DEFAULT_GLOBAL_OPTIONS, noopLimiter)

  // high CPU threshold = 90 * 0.85 = 76.5 %
  const HIGH_CPU = 90 * 0.85
  // high memory threshold = 1000 MB * 1024^2 * 1.2
  const HIGH_MEM = 1000 * MB * 1.2

  test('host exceeding CPU high threshold is flagged for optimization', () => {
    const plan = makePerfPlan()
    const host = makeHost({ id: 'h1' })
    const averages = { h1: { cpu: HIGH_CPU + 1, memoryFree: HIGH_MEM * 2, memory: 0, nCpus: 4 } }
    const toOptimize = plan._checkResourcesThresholds([host], averages)
    assert.strictEqual(toOptimize.length, 1, 'overloaded CPU host should be flagged')
    assert.strictEqual(toOptimize[0].id, 'h1')
  })

  test('host with free memory below the high threshold is flagged for optimization', () => {
    const plan = makePerfPlan()
    const host = makeHost({ id: 'h1' })
    const averages = { h1: { cpu: 10, memoryFree: HIGH_MEM - 1, memory: 0, nCpus: 4 } }
    const toOptimize = plan._checkResourcesThresholds([host], averages)
    assert.strictEqual(toOptimize.length, 1, 'host with critically low free memory should be flagged')
  })

  test('healthy host is not flagged for optimization', () => {
    const plan = makePerfPlan()
    const host = makeHost({ id: 'h1' })
    const averages = { h1: { cpu: 10, memoryFree: HIGH_MEM * 2, memory: 0, nCpus: 4 } }
    const toOptimize = plan._checkResourcesThresholds([host], averages)
    assert.strictEqual(toOptimize.length, 0, 'healthy host should not be flagged')
  })
})

// ===================================================================
// Performance plan — optimization
// ===================================================================

describe('Performance plan — optimization', { concurrency: 1 }, () => {
  /**
   * Standard scenario:
   *  h-src: 95% CPU, 500 MB free — overloaded on both metrics
   *  h-dst: 10% CPU, 6 GB free  — healthy destination
   *  vm-1: 2 vCPUs, 80% CPU, 1 GB memory (scaled CPU on 4-core host = 40%)
   *
   * After migrating vm-1:
   *  h-src CPU: 95 - 40 = 55% → below low threshold (58.5%) ✓ stops
   */
  function makeBasicPerfScenario() {
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-1': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-1': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }),
      },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )

    return { plan, xo, vm, srcHost, destHost }
  }

  test('migrates VM from overloaded host to healthy destination', async () => {
    const { plan, xo, vm } = makeBasicPerfScenario()
    await plan.execute()
    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi.migrations.length, 1, 'one migration should have been scheduled')
    assert.strictEqual(srcXapi.migrations[0].vmXapiId, vm._xapiId, 'the correct VM should be migrated')
  })

  test('does not migrate VM that lacks xenTools', async () => {
    const { plan, xo } = makeBasicPerfScenario()
    xo.getObjects()['vm-1'].xenTools = false
    await plan.execute()
    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi?.migrations.length ?? 0, 0, 'VM without xenTools must not be migrated')
  })

  test('does not migrate VM currently in cooldown', async () => {
    const migrationHistory = new Map<string, number>()
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-cool', hostId: 'h-src', poolId: 'p1' })
    migrationHistory.set(vm.id, Date.now()) // migrated just now

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-cool': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-cool': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ignoredVmTags: new Set(), migrationCooldown: 30 * 60 * 1000, migrationHistory },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src')?.migrations.length ?? 0, 0, 'VM in cooldown must not be migrated')
  })

  test('does not migrate VM tagged with a blocking affinity tag', async () => {
    const { plan, xo } = makeBasicPerfScenario()
    xo.getObjects()['vm-1'].tags = ['tier-1']
    plan._affinityTags = ['tier-1']
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src')?.migrations.length ?? 0, 0, 'VM with affinity tag must be skipped')
  })

  test('does not migrate VM tagged with a blocking anti-affinity tag', async () => {
    const { plan, xo } = makeBasicPerfScenario()
    xo.getObjects()['vm-1'].tags = ['spread']
    plan._antiAffinityTags = ['spread']
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src')?.migrations.length ?? 0, 0, 'VM with anti-affinity tag must be skipped')
  })

  test('prefers same-pool destination over a better-resourced cross-pool host', async () => {
    const srcHost       = makeHost({ id: 'h-src',   poolId: 'p1', cpuCount: 4 })
    const samePoolDest  = makeHost({ id: 'h-same',  poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const crossPoolDest = makeHost({ id: 'h-cross', poolId: 'p2', cpuCount: 4, powerOnMode: '' })
    const pool1         = makePool({ id: 'p1', master: 'h-same' })
    const pool2         = makePool({ id: 'p2', master: 'h-cross' })
    const vm            = makeVm({ id: 'vm-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: {
        'h-src': srcHost, 'h-same': samePoolDest, 'h-cross': crossPoolDest,
        'p1': pool1, 'p2': pool2, 'vm-1': vm,
      },
      hostStats: {
        'h-src':   makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-same':  makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-cross': makeHostStats({ cpuPercent: 5,  memFreeBytes: 7 * GB }), // even lighter but cross-pool
      },
      vmStats: { 'vm-1': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi.migrations.length, 1, 'one migration should occur')
    assert.strictEqual(
      srcXapi.migrations[0].destHostXapiId,
      samePoolDest._xapiId,
      'same-pool destination should be preferred over the cross-pool one'
    )
  })

  test('updates in-memory host averages after each migration decision so subsequent decisions are accurate', async () => {
    /**
     * h-src: 95% CPU (above high threshold 76.5%)
     * h-dst: 30% CPU.
     *   vm scaled CPU = 40% * (2/4) = 20%.
     *   Before vm-a: 30+20 = 50% < low(58.5%) → vm-a CAN migrate.
     *   After vm-a (averages updated): 30+20 = 50%. Check vm-b: 50+20 = 70% ≥ low(58.5%) → vm-b BLOCKED.
     *   Without averages update: 30+20 = 50% < 58.5% → vm-b would also migrate (2 migrations).
     */
    const srcHost = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vmA      = makeVm({ id: 'vm-a', hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const vmB      = makeVm({ id: 'vm-b', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-a': vmA, 'vm-b': vmB },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        // h-dst at 30%: vm-a fits (30+20=50 < 58.5), but vm-b would push it over (50+20=70 ≥ 58.5)
        'h-dst': makeHostStats({ cpuPercent: 30, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        // scaled CPU per VM = 40% * (2/4) = 20%.
        'vm-a': makeVmStats({ cpuPercent: 40, memBytes: 512 * MB }),
        'vm-b': makeVmStats({ cpuPercent: 40, memBytes: 512 * MB }),
      },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src').migrations.length, 1, 'only one VM should migrate — destination is full after the first')
  })

  test('stops migrating as soon as source drops below the low CPU threshold', async () => {
    /**
     * h-src: 88% CPU, plenty of memory (both metrics fine except CPU).
     * vm-1: scaled CPU = 80% * (2/4) = 40%. After migration: 88 - 40 = 48% < low(58.5%) → STOP.
     * vm-2 and vm-3 must NOT be migrated.
     */
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm1      = makeVm({ id: 'vm-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const vm2      = makeVm({ id: 'vm-2', hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const vm3      = makeVm({ id: 'vm-3', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-1': vm1, 'vm-2': vm2, 'vm-3': vm3 },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 88, memFreeBytes: 7 * GB }), // above high (76.5), memory fine
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-1': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }),  // scaled 40% — migrated first
        'vm-2': makeVmStats({ cpuPercent: 30, memBytes: 512 * MB }), // scaled 15%
        'vm-3': makeVmStats({ cpuPercent: 20, memBytes: 256 * MB }), // scaled 10%
      },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src').migrations.length, 1, 'should stop after source drops below low threshold')
  })

  test('when two VMs have equal CPU usage, migrates the one with more memory first', async () => {
    /**
     * vm-large and vm-small-1 both have the same scaled CPU.
     * epsiEqual(15, 15) → sort by memory descending → vm-large goes first.
     */
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const largeVm  = makeVm({ id: 'vm-large',   hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const smallVm  = makeVm({ id: 'vm-small-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const migrationOrder: string[] = []
    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-large': largeVm, 'vm-small-1': smallVm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 88, memFreeBytes: 7 * GB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-large':   makeVmStats({ cpuPercent: 30, memBytes: 4 * GB }),       // same CPU, more memory
        'vm-small-1': makeVmStats({ cpuPercent: 30, memBytes: 256 * MB }),
      },
    })

    const srcXapi = xo.getXapi('h-src')
    const originalMigrateVm = srcXapi.migrateVm.bind(srcXapi)
    srcXapi.migrateVm = async (vmXapiId: string, ...rest: unknown[]) => {
      migrationOrder.push(vmXapiId)
      return originalMigrateVm(vmXapiId, ...rest)
    }

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    assert.ok(migrationOrder.length >= 1, 'at least one migration should have occurred')
    assert.strictEqual(migrationOrder[0], largeVm._xapiId, 'VM with equal CPU but more memory should migrate first')
  })
})

// ===================================================================
// Density plan — simulation and execution
// ===================================================================

describe('Density plan — simulation and execution', { concurrency: 1 }, () => {
  /**
   * Standard density scenario.
   *  h-under:  very underutilised (2% CPU, 7 GB free) with powerOnMode — will be evacuated.
   *  h-dest:   medium load, powerOnMode='' so it won't itself be targeted for evacuation.
   *  h-master: pool master, never evacuated.
   */
  function makeDensityScenario({ vmXenTools = true, vmTags = [] as string[] } = {}) {
    const srcHost  = makeHost({ id: 'h-under',  poolId: 'p1', cpuCount: 4, powerOnMode: 'IPMI' })
    const destHost = makeHost({ id: 'h-dest',   poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const master   = makeHost({ id: 'h-master', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-master' })
    const vm       = makeVm({ id: 'vm-1', hostId: 'h-under', poolId: 'p1', xenTools: vmXenTools, tags: vmTags })

    const xo = createMockXo({
      objects: { 'h-under': srcHost, 'h-dest': destHost, 'h-master': master, 'p1': pool, 'vm-1': vm },
      hostStats: {
        'h-under':  makeHostStats({ cpuPercent: 2,  memFreeBytes: 7 * GB }),
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-master': makeHostStats({ cpuPercent: 20, memFreeBytes: 5 * GB }),
      },
      vmStats: { 'vm-1': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }) },
    })

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    return { plan, xo, vm, srcHost }
  }

  test('migrates all VMs from underutilised host and shuts it down', async () => {
    const { plan, xo, vm, srcHost } = makeDensityScenario()
    await plan.execute()
    const srcXapi = xo.getXapiFor(srcHost.id)
    assert.strictEqual(srcXapi.migrations.length, 1, 'VM should have been migrated')
    assert.strictEqual(srcXapi.migrations[0].vmXapiId, vm._xapiId, 'correct VM should migrate')
    assert.strictEqual(srcXapi.shutdowns.length, 1, 'source host should be shut down after evacuation')
    assert.strictEqual(srcXapi.shutdowns[0], srcHost.id, 'correct host should be shut down')
  })

  test('does not evacuate host when a VM lacks xenTools', async () => {
    const { plan, xo, srcHost } = makeDensityScenario({ vmXenTools: false })
    await plan.execute()
    const srcXapi = xo.getXapiFor(srcHost.id)
    assert.strictEqual(srcXapi?.migrations.length ?? 0, 0, 'host with non-migratable VM should not be evacuated')
    assert.strictEqual(srcXapi?.shutdowns.length ?? 0, 0, 'host should not be shut down')
  })

  test('does not evacuate host when a VM carries an affinity tag', async () => {
    const { plan, xo, srcHost } = makeDensityScenario({ vmTags: ['tier-1'] })
    plan._affinityTags = ['tier-1']
    await plan.execute()
    assert.strictEqual(xo.getXapiFor(srcHost.id)?.migrations.length ?? 0, 0, 'host with affinity-tagged VM must not be evacuated')
  })

  test('does not evacuate host when a VM carries an anti-affinity tag', async () => {
    const { plan, xo, srcHost } = makeDensityScenario({ vmTags: ['spread'] })
    plan._antiAffinityTags = ['spread']
    await plan.execute()
    assert.strictEqual(xo.getXapiFor(srcHost.id)?.migrations.length ?? 0, 0, 'host with anti-affinity-tagged VM must not be evacuated')
  })

  test('never evacuates the pool master', async () => {
    const master   = makeHost({ id: 'h-master', poolId: 'p1', powerOnMode: 'IPMI' })
    const destHost = makeHost({ id: 'h-dest',   poolId: 'p1', powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-master' })
    const vm       = makeVm({ id: 'vm-m', hostId: 'h-master', poolId: 'p1' })

    const xo = createMockXo({
      objects: { 'h-master': master, 'h-dest': destHost, 'p1': pool, 'vm-m': vm },
      hostStats: {
        'h-master': makeHostStats({ cpuPercent: 2,  memFreeBytes: 7 * GB }),
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-m': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }) },
    })

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-master')?.migrations.length ?? 0, 0, 'master should never be evacuated')
    assert.strictEqual(xo.getXapiFor('h-master')?.shutdowns.length ?? 0, 0, 'master should never be shut down')
  })

  test('skips host with empty powerOnMode (cannot be shut down)', async () => {
    const srcHost  = makeHost({ id: 'h-nopow', poolId: 'p1', powerOnMode: '' }) // no IPMI
    const destHost = makeHost({ id: 'h-dest',  poolId: 'p1', powerOnMode: '' })
    const master   = makeHost({ id: 'h-master', poolId: 'p1', powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-master' })
    const vm       = makeVm({ id: 'vm-1', hostId: 'h-nopow', poolId: 'p1' })

    const xo = createMockXo({
      objects: { 'h-nopow': srcHost, 'h-dest': destHost, 'h-master': master, 'p1': pool, 'vm-1': vm },
      hostStats: {
        'h-nopow':  makeHostStats({ cpuPercent: 2,  memFreeBytes: 7 * GB }),
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-master': makeHostStats({ cpuPercent: 20, memFreeBytes: 5 * GB }),
      },
      vmStats: { 'vm-1': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }) },
    })

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-nopow')?.migrations.length ?? 0, 0, 'host without powerOnMode must not be evacuated')
  })

  test('a failing host shutdown is swallowed — remaining hosts are still processed', async () => {
    const src1   = makeHost({ id: 'h-src1',  poolId: 'p1', powerOnMode: 'IPMI' })
    const src2   = makeHost({ id: 'h-src2',  poolId: 'p1', powerOnMode: 'IPMI' })
    const dest   = makeHost({ id: 'h-dest',  poolId: 'p1', powerOnMode: '' })
    const master = makeHost({ id: 'h-master', poolId: 'p1', powerOnMode: '' })
    const pool   = makePool({ id: 'p1', master: 'h-master' })
    const vm1    = makeVm({ id: 'vm-1', hostId: 'h-src1', poolId: 'p1' })
    const vm2    = makeVm({ id: 'vm-2', hostId: 'h-src2', poolId: 'p1' })

    const underloadedStats = makeHostStats({ cpuPercent: 2, memFreeBytes: 7 * GB })
    const xo = createMockXo({
      objects: { 'h-src1': src1, 'h-src2': src2, 'h-dest': dest, 'h-master': master, 'p1': pool, 'vm-1': vm1, 'vm-2': vm2 },
      hostStats: {
        'h-src1': underloadedStats,
        'h-src2': underloadedStats,
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-master': makeHostStats({ cpuPercent: 20, memFreeBytes: 5 * GB }),
      },
      vmStats: {
        'vm-1': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }),
        'vm-2': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }),
      },
    })

    // Make h-src1 shutdown throw to simulate IPMI failure
    xo.getXapi('h-src1').shutdownHost = async () => { throw new Error('IPMI unreachable') }

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )

    await assert.doesNotReject(plan.execute(), 'a failing shutdown must not propagate out of execute()')

    // h-src2 should still have been processed despite h-src1 failing
    assert.strictEqual(xo.getXapiFor('h-src2')?.migrations.length, 1, 'second host should still be evacuated after the first shutdown failed')
  })

  test('simulation sorts VMs by memory descending (largest first) to minimise migration count', async () => {
    const srcHost  = makeHost({ id: 'h-under',  poolId: 'p1', powerOnMode: 'IPMI' })
    const destHost = makeHost({ id: 'h-dest',   poolId: 'p1', powerOnMode: '' })
    const master   = makeHost({ id: 'h-master', poolId: 'p1', powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-master' })
    const smallVm  = makeVm({ id: 'vm-small', hostId: 'h-under', poolId: 'p1' })
    const largeVm  = makeVm({ id: 'vm-large', hostId: 'h-under', poolId: 'p1' })

    const migrationOrder: string[] = []
    const xo = createMockXo({
      objects: { 'h-under': srcHost, 'h-dest': destHost, 'h-master': master, 'p1': pool, 'vm-small': smallVm, 'vm-large': largeVm },
      hostStats: {
        'h-under':  makeHostStats({ cpuPercent: 2,  memFreeBytes: 7 * GB }),
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-master': makeHostStats({ cpuPercent: 20, memFreeBytes: 5 * GB }),
      },
      vmStats: {
        'vm-small': makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }),
        'vm-large': makeVmStats({ cpuPercent: 2, memBytes: 2 * GB }),
      },
    })

    const srcXapi = xo.getXapi('h-under')
    const originalMigrateVm = srcXapi.migrateVm.bind(srcXapi)
    srcXapi.migrateVm = async (vmXapiId: string, ...rest: unknown[]) => {
      migrationOrder.push(vmXapiId)
      return originalMigrateVm(vmXapiId, ...rest)
    }

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    assert.strictEqual(migrationOrder[0], largeVm._xapiId, 'larger VM should be planned first to minimise migration count')
  })
})

// ===================================================================
// Anti-affinity processing
// ===================================================================

describe('Anti-affinity processing', { concurrency: 1 }, () => {
  test('does nothing when no anti-affinity tags are configured', async () => {
    const host = makeHost({ id: 'h1', poolId: 'p1' })
    const vm   = makeVm({ id: 'vm-1', hostId: 'h1', tags: ['tag-a'] })
    const xo   = createMockXo({
      objects: { 'h1': host, 'p1': makePool({ master: 'h1' }), 'vm-1': vm },
      hostStats: { 'h1': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }) },
      vmStats:   { 'vm-1': makeVmStats({ cpuPercent: 5, memBytes: 256 * MB }) },
    })
    const plan = new Plan(xo, 'test', ['p1'], { antiAffinityTags: [] }, DEFAULT_GLOBAL_OPTIONS, noopLimiter)
    await plan._processAntiAffinity()
    assert.strictEqual(xo.getXapiFor('h1')?.migrations.length ?? 0, 0, 'no migration should occur when no anti-affinity tags exist')
  })

  test('migrates one VM to equalise tag distribution across hosts', async () => {
    // vm-a and vm-b both tagged 'spread' are on h1; h2 has none → imbalance of 2, needs 1 migration
    const h1  = makeHost({ id: 'h1', poolId: 'p1', cpuCount: 4 })
    const h2  = makeHost({ id: 'h2', poolId: 'p1', cpuCount: 4 })
    const vmA = makeVm({ id: 'vm-a', hostId: 'h1', poolId: 'p1', tags: ['spread'] })
    const vmB = makeVm({ id: 'vm-b', hostId: 'h1', poolId: 'p1', tags: ['spread'] })

    const xo = createMockXo({
      objects: { 'h1': h1, 'h2': h2, 'p1': makePool({ master: 'h1' }), 'vm-a': vmA, 'vm-b': vmB },
      hostStats: {
        'h1': makeHostStats({ cpuPercent: 30, memFreeBytes: 6 * GB }),
        'h2': makeHostStats({ cpuPercent: 10, memFreeBytes: 7 * GB }),
      },
      vmStats: {
        'vm-a': makeVmStats({ cpuPercent: 15, memBytes: 512 * MB }),
        'vm-b': makeVmStats({ cpuPercent: 15, memBytes: 512 * MB }),
      },
    })

    const plan = new Plan(
      xo, 'test', ['p1'],
      { antiAffinityTags: ['spread'] },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan._processAntiAffinity()
    assert.strictEqual(xo.getXapiFor('h1').migrations.length, 1, 'exactly one VM should move to balance the tag')
  })

  test('does not migrate when the tag distribution is already balanced (diff ≤ 1)', async () => {
    // One 'spread' VM on h1, one on h2 — perfectly balanced
    const h1  = makeHost({ id: 'h1', poolId: 'p1' })
    const h2  = makeHost({ id: 'h2', poolId: 'p1' })
    const vmA = makeVm({ id: 'vm-a', hostId: 'h1', poolId: 'p1', tags: ['spread'] })
    const vmB = makeVm({ id: 'vm-b', hostId: 'h2', poolId: 'p1', tags: ['spread'] })

    const xo = createMockXo({
      objects: { 'h1': h1, 'h2': h2, 'p1': makePool({ master: 'h1' }), 'vm-a': vmA, 'vm-b': vmB },
      hostStats: {
        'h1': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h2': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-a': makeVmStats({ cpuPercent: 5, memBytes: 256 * MB }),
        'vm-b': makeVmStats({ cpuPercent: 5, memBytes: 256 * MB }),
      },
    })

    const plan = new Plan(
      xo, 'test', ['p1'],
      { antiAffinityTags: ['spread'] },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan._processAntiAffinity()
    assert.strictEqual(xo.getXapiFor('h1')?.migrations.length ?? 0, 0, 'already-balanced distribution should not trigger migration')
  })
})

// ===================================================================
// Affinity processing
// ===================================================================

describe('Affinity processing', { concurrency: 1 }, () => {
  test('does nothing when no affinity tags are configured', async () => {
    const h1 = makeHost({ id: 'h1', poolId: 'p1' })
    const vm = makeVm({ id: 'vm-1', hostId: 'h1', tags: ['front-end'] })
    const xo = createMockXo({
      objects: { 'h1': h1, 'p1': makePool({ master: 'h1' }), 'vm-1': vm },
      hostStats: { 'h1': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }) },
      vmStats:   { 'vm-1': makeVmStats({ cpuPercent: 5, memBytes: 256 * MB }) },
    })
    const plan = new Plan(xo, 'test', ['p1'], { affinityTags: [] }, DEFAULT_GLOBAL_OPTIONS, noopLimiter)
    await plan._processAffinity()
    assert.strictEqual(xo.getXapiFor('h1')?.migrations.length ?? 0, 0)
  })

  test('colocates spread tagged VMs onto a single host', async () => {
    // vm-a on h1, vm-b on h2, both tagged 'coloc' — one must move to the other host
    const h1  = makeHost({ id: 'h1', poolId: 'p1', cpuCount: 4 })
    const h2  = makeHost({ id: 'h2', poolId: 'p1', cpuCount: 4 })
    const vmA = makeVm({ id: 'vm-a', hostId: 'h1', poolId: 'p1', tags: ['coloc'] })
    const vmB = makeVm({ id: 'vm-b', hostId: 'h2', poolId: 'p1', tags: ['coloc'] })

    const xo = createMockXo({
      objects: { 'h1': h1, 'h2': h2, 'p1': makePool({ master: 'h1' }), 'vm-a': vmA, 'vm-b': vmB },
      hostStats: {
        'h1': makeHostStats({ cpuPercent: 30, memFreeBytes: 6 * GB }),
        'h2': makeHostStats({ cpuPercent: 10, memFreeBytes: 7 * GB }),
      },
      vmStats: {
        'vm-a': makeVmStats({ cpuPercent: 15, memBytes: 512 * MB }),
        'vm-b': makeVmStats({ cpuPercent: 5,  memBytes: 256 * MB }),
      },
    })

    const plan = new Plan(
      xo, 'test', ['p1'],
      { affinityTags: ['coloc'] },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan._processAffinity()

    const totalMigrations =
      (xo.getXapiFor('h1')?.migrations.length ?? 0) +
      (xo.getXapiFor('h2')?.migrations.length ?? 0)
    assert.strictEqual(totalMigrations, 1, 'exactly one migration should colocate the tagged pair')
  })

  test('does not migrate when all tagged VMs already share one host', async () => {
    const h1  = makeHost({ id: 'h1', poolId: 'p1', cpuCount: 4 })
    const h2  = makeHost({ id: 'h2', poolId: 'p1', cpuCount: 4 })
    const vmA = makeVm({ id: 'vm-a', hostId: 'h1', poolId: 'p1', tags: ['coloc'] })
    const vmB = makeVm({ id: 'vm-b', hostId: 'h1', poolId: 'p1', tags: ['coloc'] }) // already same host

    const xo = createMockXo({
      objects: { 'h1': h1, 'h2': h2, 'p1': makePool({ master: 'h1' }), 'vm-a': vmA, 'vm-b': vmB },
      hostStats: {
        'h1': makeHostStats({ cpuPercent: 30, memFreeBytes: 6 * GB }),
        'h2': makeHostStats({ cpuPercent: 10, memFreeBytes: 7 * GB }),
      },
      vmStats: {
        'vm-a': makeVmStats({ cpuPercent: 15, memBytes: 512 * MB }),
        'vm-b': makeVmStats({ cpuPercent: 5,  memBytes: 256 * MB }),
      },
    })

    const plan = new Plan(
      xo, 'test', ['p1'],
      { affinityTags: ['coloc'] },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan._processAffinity()

    const totalMigrations =
      (xo.getXapiFor('h1')?.migrations.length ?? 0) +
      (xo.getXapiFor('h2')?.migrations.length ?? 0)
    assert.strictEqual(totalMigrations, 0, 'already colocated VMs should not trigger any migration')
  })
})

// ===================================================================
// NEW — assert_can_migrate checks
// ===================================================================

describe('assert_can_migrate checks (new improvement)', { concurrency: 1 }, () => {
  function makeAssertScenario() {
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-1': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-1': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    return { plan, xo, vm }
  }

  test('assertCanMigrateVm is called on the source XAPI before migrateVm', async () => {
    const { plan, xo, vm } = makeAssertScenario()
    await plan.execute()
    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi.assertCanMigrateCalls.length, 1, 'assertCanMigrateVm should be called once per candidate VM')
    assert.strictEqual(srcXapi.assertCanMigrateCalls[0].vmXapiId, vm._xapiId, 'should assert against the correct VM xapi ID')
    assert.strictEqual(srcXapi.migrations.length, 1, 'migrateVm should follow a successful assert')
  })

  test('VM is skipped when assertCanMigrateVm rejects it', async () => {
    const { plan, xo, vm } = makeAssertScenario()
    xo.getXapi('h-src').denyMigrations.add(vm._xapiId)
    await plan.execute()
    assert.strictEqual(xo.getXapiFor('h-src').migrations.length, 0, 'denied VM must not be migrated')
  })

  test('other VMs continue migrating when one fails assertCanMigrateVm', async () => {
    const srcHost   = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost  = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool      = makePool({ id: 'p1', master: 'h-dst' })
    const vmDenied  = makeVm({ id: 'vm-denied', hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const vmAllowed = makeVm({ id: 'vm-ok',     hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-denied': vmDenied, 'vm-ok': vmAllowed },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-denied': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }),   // highest CPU — first in sort
        'vm-ok':     makeVmStats({ cpuPercent: 30, memBytes: 256 * MB }),
      },
    })

    xo.getXapi('h-src').denyMigrations.add(vmDenied._xapiId)

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi.migrations.length, 1, 'the allowed VM should still migrate')
    assert.strictEqual(srcXapi.migrations[0].vmXapiId, vmAllowed._xapiId, 'only the allowed VM should have migrated')
  })

  test('cooldown is not recorded when assertCanMigrateVm rejects the VM', async () => {
    const migrationHistory = new Map<string, number>()
    const { xo, vm } = makeAssertScenario()

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ignoredVmTags: new Set(), migrationCooldown: 30 * 60 * 1000, migrationHistory },
      noopLimiter
    )
    xo.getXapi('h-src').denyMigrations.add(vm._xapiId)
    await plan.execute()

    assert.strictEqual(migrationHistory.has(vm.id), false, 'a rejected migration must not set a cooldown entry')
  })
})

// ===================================================================
// NEW — Graceful migration failure handling
// ===================================================================

describe('Graceful migration failure handling (new improvement)', { concurrency: 1 }, () => {
  test('execute() does not throw when a VM migration fails at the XAPI level', async () => {
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-fail', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-fail': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-fail': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })
    xo.getXapi('h-src').failMigrations.add(vm._xapiId)

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await assert.doesNotReject(plan.execute(), 'a failed migration must not cause execute() to throw')
  })

  test('cooldown is not set for a VM whose migration threw', async () => {
    const migrationHistory = new Map<string, number>()
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-fail', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-fail': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-fail': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })
    xo.getXapi('h-src').failMigrations.add(vm._xapiId)

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ignoredVmTags: new Set(), migrationCooldown: 30 * 60 * 1000, migrationHistory },
      noopLimiter
    )
    await plan.execute()
    assert.strictEqual(migrationHistory.has(vm.id), false, 'a failed migration must not register a cooldown entry')
  })

  test('remaining VMs are still processed after one migration failure', async () => {
    /**
     * vm-fail has more CPU → migrated first, then throws.
     * vm-ok should still be migrated in the same execute() run.
     */
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vmFail   = makeVm({ id: 'vm-fail', hostId: 'h-src', poolId: 'p1', vcpus: 2 })
    const vmOk     = makeVm({ id: 'vm-ok',   hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-fail': vmFail, 'vm-ok': vmOk },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: {
        'vm-fail': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }),   // higher CPU — processed first
        'vm-ok':   makeVmStats({ cpuPercent: 30, memBytes: 256 * MB }),
      },
    })
    xo.getXapi('h-src').failMigrations.add(vmFail._xapiId)

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    const srcXapi = xo.getXapiFor('h-src')
    assert.strictEqual(srcXapi.migrations.length, 1, 'vm-ok should still have been migrated after vm-fail threw')
    assert.strictEqual(srcXapi.migrations[0].vmXapiId, vmOk._xapiId, 'vm-ok should be the successful migration')
  })

  test('density plan does not shut down a host when any VM migration in the batch failed', async () => {
    const srcHost  = makeHost({ id: 'h-under',  poolId: 'p1', powerOnMode: 'IPMI' })
    const destHost = makeHost({ id: 'h-dest',   poolId: 'p1', powerOnMode: '' })
    const master   = makeHost({ id: 'h-master', poolId: 'p1', powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-master' })
    const vmFail   = makeVm({ id: 'vm-fail', hostId: 'h-under', poolId: 'p1' })
    const vmOk     = makeVm({ id: 'vm-ok',   hostId: 'h-under', poolId: 'p1' })

    const xo = createMockXo({
      objects: { 'h-under': srcHost, 'h-dest': destHost, 'h-master': master, 'p1': pool, 'vm-fail': vmFail, 'vm-ok': vmOk },
      hostStats: {
        'h-under':  makeHostStats({ cpuPercent: 2,  memFreeBytes: 7 * GB }),
        'h-dest':   makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
        'h-master': makeHostStats({ cpuPercent: 20, memFreeBytes: 5 * GB }),
      },
      vmStats: {
        'vm-fail': makeVmStats({ cpuPercent: 2, memBytes: 2 * GB }),   // larger — first in simulation
        'vm-ok':   makeVmStats({ cpuPercent: 2, memBytes: 256 * MB }),
      },
    })
    xo.getXapi('h-under').failMigrations.add(vmFail._xapiId)

    const plan = new DensityPlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await assert.doesNotReject(plan.execute())

    const srcXapi = xo.getXapiFor('h-under')
    assert.strictEqual(
      srcXapi?.shutdowns.length ?? 0, 0,
      'host must not be shut down when at least one VM migration in the batch failed'
    )
  })
})

// ===================================================================
// NEW — No storage migration
// ===================================================================

describe('No storage migration (new improvement)', { concurrency: 1 }, () => {
  test('migrateVm is called with exactly 3 arguments — no VDI-to-SR mapping', async () => {
    /**
     * The live-migration signature is: migrateVm(vmXapiId, destXapi, destHostXapiId).
     * A storage migration would add a 4th argument with a VDI-to-SR map.
     * We verify that argument is never passed.
     */
    const srcHost  = makeHost({ id: 'h-src', poolId: 'p1', cpuCount: 4 })
    const destHost = makeHost({ id: 'h-dst', poolId: 'p1', cpuCount: 4, powerOnMode: '' })
    const pool     = makePool({ id: 'p1', master: 'h-dst' })
    const vm       = makeVm({ id: 'vm-1', hostId: 'h-src', poolId: 'p1', vcpus: 2 })

    const capturedArgs: unknown[][] = []
    const xo = createMockXo({
      objects: { 'h-src': srcHost, 'h-dst': destHost, 'p1': pool, 'vm-1': vm },
      hostStats: {
        'h-src': makeHostStats({ cpuPercent: 95, memFreeBytes: 500 * MB }),
        'h-dst': makeHostStats({ cpuPercent: 10, memFreeBytes: 6 * GB }),
      },
      vmStats: { 'vm-1': makeVmStats({ cpuPercent: 80, memBytes: 1 * GB }) },
    })

    const srcXapi = xo.getXapi('h-src')
    const originalMigrateVm = srcXapi.migrateVm.bind(srcXapi)
    srcXapi.migrateVm = async (...args: unknown[]) => {
      capturedArgs.push(args)
      return originalMigrateVm(...args)
    }

    const plan = new PerformancePlan(
      xo, 'test', ['p1'],
      { thresholds: { cpu: 90, memoryFree: 1000 } },
      { ...DEFAULT_GLOBAL_OPTIONS, migrationHistory: new Map() },
      noopLimiter
    )
    await plan.execute()

    assert.strictEqual(capturedArgs.length, 1, 'migrateVm should have been called once')
    assert.strictEqual(
      capturedArgs[0].length, 3,
      'migrateVm must be called with exactly 3 arguments (vmXapiId, destXapi, destHostXapiId) — no VDI map'
    )
  })
})
