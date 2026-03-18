/**
 * Mock data factory for load-balancer tests.
 *
 * Scenario (light — suitable for a small dev machine):
 *   1 pool, 4 hosts (8 CPU cores, 128 GB RAM each), 20 VMs
 *
 *   host-1  →  overloaded  (CPU ~85 %, 6 GB free RAM)
 *   host-2  →  moderate    (CPU ~60 %, 50 GB free RAM)
 *   host-3  →  light       (CPU ~25 %, 90 GB free RAM)
 *   host-4  →  light       (CPU ~15 %, 100 GB free RAM)
 *
 * Tag convention used by the new API:
 *   xo:load:balancer:affinity=<group>       – colocate VMs on same host
 *   xo:load:balancer:anti-affinity=<group>  – spread VMs across hosts
 *   xo:load:balancer:ignore                 – never migrate this VM
 *
 * The enterprise scale reference (not executed here, for documentation):
 *   10 pools × 10 hosts × 1 000 VMs = 100 000 VMs, 8–128 GB RAM each
 */

import type { XoHost, XoPool, XoVm } from '@vates/types'

// ─── constants ────────────────────────────────────────────────────────────────

const GB = 1024 * 1024 * 1024
const N_POINTS = 35 // >30 (MINUTES_OF_HISTORICAL_DATA)

// ─── typed sub-objects ────────────────────────────────────────────────────────

type MockXoObjects = Record<string, XoPool | XoHost | XoVm>

interface StatSeries {
  cpus: Record<string, (number | null)[]>
  memory: (number | null)[]
  memoryFree: (number | null)[]
}

interface MockHostStats {
  stats: StatSeries
}
interface MockVmStats {
  stats: StatSeries
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fill(v: number): (number | null)[] {
  return Array(N_POINTS).fill(v)
}

function cpuSeries(pct: number, nCpus: number): Record<string, (number | null)[]> {
  const c: Record<string, (number | null)[]> = {}
  for (let i = 0; i < nCpus; i++) c[String(i)] = fill(pct)
  return c
}

// ─── raw object builders ──────────────────────────────────────────────────────

function makePool(id: string, master: string): XoPool {
  return {
    id: id as XoPool['id'],
    type: 'pool',
    master: master as XoHost['id'],
    name_label: `Pool ${id}`,
    name_description: '',
    cpus: { cores: 8, sockets: 1 },
  } as unknown as XoPool
}

interface HostDef {
  id: string
  poolId: string
  cpuPct: number // host CPU load in %
  memFreeMb: number // free RAM in MB
  totalMemGb: number
  nCpus?: number
}

function makeHost(d: HostDef): XoHost {
  const nCpus = d.nCpus ?? 8
  return {
    id: d.id as XoHost['id'],
    type: 'host',
    $poolId: d.poolId as XoPool['id'],
    power_state: 'Running',
    name_label: `Host ${d.id}`,
    name_description: '',
    CPUs: { cpu_count: String(nCpus) },
    cpus: { cores: nCpus, sockets: 1 },
    memory: {
      size: d.totalMemGb * GB,
      usage: d.totalMemGb * GB - d.memFreeMb * 1024 * 1024,
    },
    powerOnMode: '',
  } as unknown as XoHost
}

interface VmDef {
  id: string
  hostId: string
  poolId: string
  cpuPct: number // vCPU usage in % (relative to each vCPU)
  memGb: number // memory used by VM
  nVcpus?: number
  tags?: string[]
}

function makeVm(d: VmDef): XoVm {
  const nVcpus = d.nVcpus ?? 2
  return {
    id: d.id as XoVm['id'],
    type: 'VM',
    $container: d.hostId as XoHost['id'],
    $poolId: d.poolId as XoPool['id'],
    power_state: 'Running',
    name_label: `VM ${d.id}`,
    name_description: '',
    CPUs: { number: nVcpus, max: 8 },
    tags: d.tags ?? [],
    xentools: { major: 6, minor: 2, version: '6.2.0' },
    memory: { size: d.memGb * GB, static_max: d.memGb * GB },
  } as unknown as XoVm
}

// ─── scenario definition ──────────────────────────────────────────────────────

const POOL_ID = 'pool-1'

const HOST_DEFS: HostDef[] = [
  { id: 'host-1', poolId: POOL_ID, cpuPct: 85, memFreeMb: 6_000, totalMemGb: 128 },
  { id: 'host-2', poolId: POOL_ID, cpuPct: 60, memFreeMb: 50_000, totalMemGb: 128 },
  { id: 'host-3', poolId: POOL_ID, cpuPct: 25, memFreeMb: 90_000, totalMemGb: 128 },
  { id: 'host-4', poolId: POOL_ID, cpuPct: 15, memFreeMb: 100_000, totalMemGb: 128 },
]

// 20 VMs: 5 per host.
// host-1 (overloaded): heavy VMs — candidates for migration
// host-3/4 (idle): will receive VMs
const VM_DEFS: VmDef[] = [
  // host-1: 5 VMs, heavy
  {
    id: 'vm-01',
    hostId: 'host-1',
    poolId: POOL_ID,
    cpuPct: 70,
    memGb: 16,
    nVcpus: 4,
    tags: ['xo:load:balancer:affinity=frontend'],
  },
  {
    id: 'vm-02',
    hostId: 'host-1',
    poolId: POOL_ID,
    cpuPct: 65,
    memGb: 32,
    nVcpus: 4,
    tags: ['xo:load:balancer:anti-affinity=database'],
  },
  { id: 'vm-03', hostId: 'host-1', poolId: POOL_ID, cpuPct: 55, memGb: 16, nVcpus: 2 },
  { id: 'vm-04', hostId: 'host-1', poolId: POOL_ID, cpuPct: 50, memGb: 8, nVcpus: 2 },
  {
    id: 'vm-05',
    hostId: 'host-1',
    poolId: POOL_ID,
    cpuPct: 40,
    memGb: 8,
    nVcpus: 2,
    tags: ['xo:load:balancer:ignore'],
  },

  // host-2: 5 VMs, moderate
  {
    id: 'vm-06',
    hostId: 'host-2',
    poolId: POOL_ID,
    cpuPct: 45,
    memGb: 16,
    nVcpus: 2,
    tags: ['xo:load:balancer:affinity=frontend'],
  },
  {
    id: 'vm-07',
    hostId: 'host-2',
    poolId: POOL_ID,
    cpuPct: 40,
    memGb: 32,
    nVcpus: 4,
    tags: ['xo:load:balancer:anti-affinity=database'],
  },
  { id: 'vm-08', hostId: 'host-2', poolId: POOL_ID, cpuPct: 35, memGb: 16, nVcpus: 2 },
  { id: 'vm-09', hostId: 'host-2', poolId: POOL_ID, cpuPct: 30, memGb: 8, nVcpus: 2 },
  { id: 'vm-10', hostId: 'host-2', poolId: POOL_ID, cpuPct: 25, memGb: 8, nVcpus: 2 },

  // host-3: 5 VMs, light
  {
    id: 'vm-11',
    hostId: 'host-3',
    poolId: POOL_ID,
    cpuPct: 20,
    memGb: 16,
    nVcpus: 2,
    tags: ['xo:load:balancer:affinity=frontend'],
  },
  {
    id: 'vm-12',
    hostId: 'host-3',
    poolId: POOL_ID,
    cpuPct: 15,
    memGb: 8,
    nVcpus: 2,
    tags: ['xo:load:balancer:anti-affinity=database'],
  },
  { id: 'vm-13', hostId: 'host-3', poolId: POOL_ID, cpuPct: 10, memGb: 8, nVcpus: 2 },
  { id: 'vm-14', hostId: 'host-3', poolId: POOL_ID, cpuPct: 10, memGb: 8, nVcpus: 2 },
  { id: 'vm-15', hostId: 'host-3', poolId: POOL_ID, cpuPct: 5, memGb: 8, nVcpus: 1 },

  // host-4: 5 VMs, very light
  { id: 'vm-16', hostId: 'host-4', poolId: POOL_ID, cpuPct: 10, memGb: 16, nVcpus: 2 },
  { id: 'vm-17', hostId: 'host-4', poolId: POOL_ID, cpuPct: 8, memGb: 8, nVcpus: 2 },
  { id: 'vm-18', hostId: 'host-4', poolId: POOL_ID, cpuPct: 8, memGb: 8, nVcpus: 2 },
  { id: 'vm-19', hostId: 'host-4', poolId: POOL_ID, cpuPct: 5, memGb: 8, nVcpus: 1 },
  { id: 'vm-20', hostId: 'host-4', poolId: POOL_ID, cpuPct: 5, memGb: 8, nVcpus: 1 },
]

// ─── public exports ───────────────────────────────────────────────────────────

export const POOL_IDS = [POOL_ID]

/** Build the flat object map returned by xo.getObjects() */
export function buildObjects(): MockXoObjects {
  const objects: MockXoObjects = {}

  const pool = makePool(POOL_ID, 'host-1')
  objects[pool.id] = pool

  for (const d of HOST_DEFS) {
    const h = makeHost(d)
    objects[h.id] = h
  }
  for (const d of VM_DEFS) {
    const v = makeVm(d)
    objects[v.id] = v
  }
  return objects
}

/** Pre-compute host stats keyed by host id. */
export function buildHostStats(): Record<string, MockHostStats> {
  const map: Record<string, MockHostStats> = {}
  for (const d of HOST_DEFS) {
    const nCpus = d.nCpus ?? 8
    const totalBytes = d.totalMemGb * GB
    const freeBytes = d.memFreeMb * 1024 * 1024
    map[d.id] = {
      stats: {
        cpus: cpuSeries(d.cpuPct, nCpus),
        memory: fill(totalBytes - freeBytes),
        memoryFree: fill(freeBytes),
      },
    }
  }
  return map
}

/** Pre-compute VM stats keyed by VM id. */
export function buildVmStats(): Record<string, MockVmStats> {
  const map: Record<string, MockVmStats> = {}
  for (const d of VM_DEFS) {
    const nVcpus = d.nVcpus ?? 2
    map[d.id] = {
      stats: {
        cpus: cpuSeries(d.cpuPct, nVcpus),
        memory: fill(d.memGb * GB),
        memoryFree: fill(0),
      },
    }
  }
  return map
}

/**
 * Build a minimal mock XoApp suitable for running plans in dry-run mode.
 * No actual XAPI connections are made.
 */
export function createMockXo() {
  const objects = buildObjects()
  const hostStats = buildHostStats()
  const vmStats = buildVmStats()

  return {
    getObjects: () => objects,
    getObject: (id: string) => objects[id],
    getXapiHostStats: async (hostId: string) =>
      hostStats[hostId] ?? { stats: { cpus: {}, memory: [], memoryFree: [] } },
    getXapiVmStats: async (vmId: string) => vmStats[vmId] ?? { stats: { cpus: {}, memory: [], memoryFree: [] } },
    // Not called in dry-run — stub only
    getXapi: () => ({ migrateVm: async () => {}, powerOnHost: async () => {}, shutdownHost: async () => {} }),
  }
}

export interface VmSnapshot {
  id: string
  cpuPct: number
  memGb: number
  nVcpus: number
  tags: string[]
}

export interface HostSnapshot {
  host: string
  cpuPct: number
  memFreeMb: number
  totalMemGb: number
  vms: VmSnapshot[]
}

/** Return a human-readable host-load snapshot for reporting. */
export function hostLoadSnapshot(): HostSnapshot[] {
  return HOST_DEFS.map(d => ({
    host: d.id,
    cpuPct: d.cpuPct,
    memFreeMb: d.memFreeMb,
    totalMemGb: d.totalMemGb,
    vms: VM_DEFS.filter(v => v.hostId === d.id).map(v => ({
      id: v.id,
      cpuPct: v.cpuPct,
      memGb: v.memGb,
      nVcpus: v.nVcpus ?? 2,
      tags: v.tags ?? [],
    })),
  }))
}
