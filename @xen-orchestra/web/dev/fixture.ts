// Deterministic in-memory fixture used by the mock REST plugin (see ./mock-rest-plugin.ts).
// The whole object graph is generated once per scale and cached, so cross-references
// (vm.$container -> host, vm.$VBDs -> vbd, vbd.VDI -> vdi) stay consistent across requests.

export interface FixtureScale {
  pools: number
  hosts: number
  vms: number
  vbdsPerVm: number
}

export interface Fixture {
  pools: Record<string, unknown>[]
  hosts: Record<string, unknown>[]
  vms: Record<string, unknown>[]
  vbds: Record<string, unknown>[]
  vdis: Record<string, unknown>[]
}

// mulberry32: tiny seeded PRNG so successive runs produce identical data and stay comparable
function createRng(seed: number) {
  let state = seed >>> 0

  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GIBIBYTE = 1024 * 1024 * 1024

function makePool(index: number): Record<string, unknown> {
  return {
    id: `pool-${index}`,
    name_label: `Pool ${index}`,
    name_description: `Mock pool ${index}`,
    master: undefined,
    default_SR: `sr-${index}`,
    tags: [],
    otherConfig: {},
    auto_poweron: false,
    HA_enabled: false,
    migrationCompression: false,
    suspendSr: undefined,
    crashDumpSr: undefined,
    haSrs: [],
    haRebootVmOnInternalShutdown: false,
    type: 'pool',
  }
}

function makeHost(index: number, poolId: string, rng: () => number): Record<string, unknown> {
  return {
    id: `host-${index}`,
    name_label: `Host ${index}`,
    name_description: `Mock host ${index}`,
    power_state: 'Running',
    controlDomain: `vm-control-${index}`,
    residentVms: [],
    $pool: poolId,
    current_operations: {},
    address: `10.${index % 256}.${Math.floor(index / 256) % 256}.1`,
    startTime: 1700000000 + index,
    version: '8.3.0',
    bios_strings: {},
    cpus: { cores: 8, sockets: 2 },
    CPUs: { cpu_count: '16', socket_count: '2', modelname: 'Mock CPU' },
    memory: { size: 256 * GIBIBYTE, usage: Math.floor(rng() * 128) * GIBIBYTE },
    tags: [],
    iscsiIqn: '',
    powerOnMode: '',
    build: 'mock',
    otherConfig: {},
    multipathing: false,
    logging: {},
    enabled: true,
    agentStartTime: 1700000000 + index,
    PGPUs: [],
    type: 'host',
  }
}

function makeVm(
  index: number,
  containerId: string,
  poolId: string,
  vbdIds: string[],
  rng: () => number
): Record<string, unknown> {
  const ramSize = (1 + Math.floor(rng() * 16)) * GIBIBYTE

  return {
    id: `vm-${index}`,
    name_label: `VM ${index}`,
    name_description: `Mock VM ${index}`,
    power_state: rng() < 0.7 ? 'Running' : 'Halted',
    $container: containerId,
    $pool: poolId,
    other: {},
    current_operations: {},
    creation: {},
    CPUs: { number: 2, max: 4 },
    addresses: { '0/ipv4/0': `10.${index % 256}.${Math.floor(index / 256) % 256}.${(index % 253) + 2}` },
    tags: [],
    os_version: { name: 'Mock Linux', distro: 'mock' },
    virtualizationMode: 'hvm',
    secureBoot: false,
    VTPMs: [],
    VIFs: [`vif-${index}`],
    viridian: false,
    isNestedVirtEnabled: false,
    memory: { size: ramSize, usage: Math.floor(rng() * ramSize) },
    VGPUs: [],
    high_availability: '',
    auto_poweron: false,
    startDelay: 0,
    vga: 'std',
    videoram: 8,
    pvDriversVersion: undefined,
    cpuWeight: null,
    cpuCap: null,
    cpuMask: undefined,
    coresPerSocket: undefined,
    mainIpAddress: `10.${index % 256}.${Math.floor(index / 256) % 256}.${(index % 253) + 2}`,
    nicType: undefined,
    affinityHost: undefined,
    suspendSr: undefined,
    blockedOperations: {},
    hasVendorDevice: false,
    startTime: 1700000000 + index,
    installTime: 1690000000 + index,
    pvDriversDetected: true,
    managementAgentDetected: true,
    type: 'VM',
    $VBDs: vbdIds,
    snapshots: [],
    boot: {},
    parent: undefined,
  }
}

function makeVbd(
  id: string,
  vmId: string,
  vdiId: string | undefined,
  isCdDrive: boolean,
  position: number
): Record<string, unknown> {
  return {
    id,
    VDI: vdiId,
    VM: vmId,
    is_cd_drive: isCdDrive,
    position: String(position),
    type: isCdDrive ? 'CD' : 'Disk',
    attached: true,
    device: `xvd${String.fromCharCode(97 + position)}`,
    read_only: false,
    bootable: position === 0,
  }
}

function makeVdi(id: string, vbdId: string, poolId: string, rng: () => number): Record<string, unknown> {
  const size = (10 + Math.floor(rng() * 200)) * GIBIBYTE

  return {
    id,
    name_label: `${id} disk`,
    name_description: '',
    $VBDs: [vbdId],
    $SR: `sr-${poolId}`,
    size,
    $pool: poolId,
    type: 'VDI',
    usage: Math.floor(rng() * size),
    tags: [],
    uuid: id,
    cbt_enabled: false,
    image_format: 'vhd',
  }
}

function generate(scale: FixtureScale): Fixture {
  const rng = createRng(42)

  const pools = Array.from({ length: scale.pools }, (_, index) => makePool(index))

  const hosts = Array.from({ length: scale.hosts }, (_, index) =>
    makeHost(index, pools[index % pools.length].id as string, rng)
  )

  pools.forEach((pool, poolIndex) => {
    const firstHost = hosts.find(host => host.$pool === pool.id)
    pool.master = firstHost?.id ?? `host-${poolIndex}`
  })

  const vms: Record<string, unknown>[] = []
  const vbds: Record<string, unknown>[] = []
  const vdis: Record<string, unknown>[] = []

  let nextVbd = 0
  let nextVdi = 0

  for (let index = 0; index < scale.vms; index++) {
    const host = hosts[index % Math.max(hosts.length, 1)]
    const poolId = host.$pool as string
    const isHostLess = index % 20 === 0
    const containerId = isHostLess ? poolId : (host.id as string)

    const vbdIds: string[] = []

    for (let slot = 0; slot < scale.vbdsPerVm; slot++) {
      const vbdId = `vbd-${nextVbd++}`
      const isCdDrive = slot === scale.vbdsPerVm - 1
      let vdiId: string | undefined

      if (!isCdDrive) {
        vdiId = `vdi-${nextVdi++}`
        vdis.push(makeVdi(vdiId, vbdId, poolId, rng))
      }

      vbds.push(makeVbd(vbdId, `vm-${index}`, vdiId, isCdDrive, slot))
      vbdIds.push(vbdId)
    }

    vms.push(makeVm(index, containerId, poolId, vbdIds, rng))
  }

  return { pools, hosts, vms, vbds, vdis }
}

const cache = new Map<string, Fixture>()

export function getFixture(scale: FixtureScale): Fixture {
  const key = `${scale.pools}-${scale.hosts}-${scale.vms}-${scale.vbdsPerVm}`

  let fixture = cache.get(key)

  if (fixture === undefined) {
    fixture = generate(scale)
    cache.set(key, fixture)
  }

  return fixture
}
