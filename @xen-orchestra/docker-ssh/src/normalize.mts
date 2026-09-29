// Docker Engine API wire shapes → XO DTOs.
//
// Pure functions, written against API 1.43 (`MAX_API_VERSION`) and tolerant of
// fields missing in older versions. Timestamps are converted to ms since the
// epoch. Optional values which do not apply are left `undefined` (so they are
// omitted from JSON), except the stats values which are `null` when they cannot
// be computed.
//
// The container environment (`Config.Env`) is deliberately never exposed: it
// routinely contains secrets.

import type {
  XoDockerCompose,
  XoDockerContainer,
  XoDockerContainerHealth,
  XoDockerContainerStats,
  XoDockerEngineInfoConnected,
  XoDockerMount,
  XoDockerNetwork,
  XoDockerPort,
} from '@vates/types'

import type {
  DockerBlkioStats,
  DockerContainerConfig,
  DockerContainerStateInfo,
  DockerContainerSummary,
  DockerCpuStats,
  DockerEndpointSettings,
  DockerInfo,
  DockerInspect,
  DockerMemoryStats,
  DockerMountPoint,
  DockerPort,
  DockerPortMap,
  DockerStatsSample,
  DockerVersion,
} from './wire.mjs'

/**
 * A container as normalized from the daemon: without the fields added by XO
 * (`id`, `$engine`…).
 */
export type NormalizedDockerContainer = Omit<
  XoDockerContainer,
  'id' | '$engine' | '$VM' | '$pool' | 'stats' | 'statsPending'
>

/**
 * `GET /info` (and `GET /version`) normalized: `XoDockerEngineInfoConnected`
 * without the fields added by XO, and with the daemon's ID (`id`) and newest
 * API version (`apiVersion`).
 */
export type NormalizedDockerEngineInfo = Omit<
  XoDockerEngineInfoConnected,
  'status' | 'asOf' | 'daemonId' | 'daemonApiVersion' | 'compose'
> & {
  /** the daemon's ID */
  id?: string
}

// Go's zero `time.Time`, used by dockerd for dates which are not set
const ZERO_DATE_RE = /^0001-01-01T00:00:00(?:\.0+)?Z$/

/**
 * @param date RFC 3339 date
 * @returns ms since the epoch
 */
export function parseDockerDate(date: unknown): number | undefined {
  if (typeof date !== 'string' || date === '' || ZERO_DATE_RE.test(date)) {
    return undefined
  }
  const time = Date.parse(date)
  return Number.isNaN(time) ? undefined : time
}

// === Container name, state, status

/**
 * Primary name of a container, without its leading `/`.
 *
 * With legacy links, `Names` also contains aliases like `/other/alias`: the
 * primary name is the one without any other `/` (what the Docker CLI shows).
 */
export function getContainerName(names: string[] | undefined): string | undefined {
  if (names === undefined || names.length === 0) {
    return undefined
  }
  const name = names.find(name => name.lastIndexOf('/') === 0) ?? names[0]
  return name.startsWith('/') ? name.slice(1) : name
}

/**
 * Parse the human readable `Status` of a list entry, e.g. `Exited (3) 2 hours
 * ago`, `Up 5 minutes (healthy)`, `Up 1 second (health: starting)`,
 * `Restarting (1) 3 seconds ago`, `Up 3 hours (Paused)`.
 */
export function parseContainerStatus(status: string | undefined): {
  exitCode?: number
  health?: XoDockerContainerHealth
} {
  const result: { exitCode?: number; health?: XoDockerContainerHealth } = {}
  if (typeof status !== 'string') {
    return result
  }
  const exitCodeMatch = /^(?:Exited|Restarting) \((-?\d+)\)/.exec(status)
  if (exitCodeMatch !== null) {
    result.exitCode = Number(exitCodeMatch[1])
  }
  const healthMatch = /\((healthy|unhealthy|health: starting)\)/.exec(status)
  if (healthMatch !== null) {
    result.health = healthMatch[1] === 'health: starting' ? 'starting' : (healthMatch[1] as 'healthy' | 'unhealthy')
  }
  return result
}

/**
 * @param status `State.Health.Status`
 * @returns `undefined` if the container has no health check
 */
function normalizeHealthStatus(status: string | undefined): XoDockerContainerHealth | undefined {
  return status === 'starting' || status === 'healthy' || status === 'unhealthy' ? status : undefined
}

// === Ports

const WILDCARD_IPV4 = '0.0.0.0'
const WILDCARD_IPV6 = '::'

/**
 * Normalize, dedupe and sort ports.
 *
 * When a port is published on all interfaces, dockerd reports it twice: once
 * for `0.0.0.0` and once for `::`. The `::` entry is dropped in that case (the
 * port stays reported as `0.0.0.0`). An IPv6-only binding keeps `::`.
 */
function dedupePorts(ports: XoDockerPort[]): XoDockerPort[] {
  const byKey = new Map<string, XoDockerPort>()
  for (const port of ports) {
    byKey.set(`${port.privatePort}/${port.protocol}/${port.publicPort}/${port.ip}`, port)
  }
  const result: XoDockerPort[] = []
  for (const port of byKey.values()) {
    if (
      port.ip === WILDCARD_IPV6 &&
      byKey.has(`${port.privatePort}/${port.protocol}/${port.publicPort}/${WILDCARD_IPV4}`)
    ) {
      continue
    }
    result.push(port)
  }
  return result.sort(
    (a, b) =>
      a.privatePort - b.privatePort ||
      a.protocol.localeCompare(b.protocol) ||
      (a.publicPort ?? 0) - (b.publicPort ?? 0) ||
      (a.ip ?? '').localeCompare(b.ip ?? '')
  )
}

function makePort({
  ip,
  privatePort,
  publicPort,
  protocol = 'tcp',
}: {
  ip?: string
  privatePort: number
  publicPort?: number
  protocol?: string
}): XoDockerPort {
  const port: XoDockerPort = { privatePort, protocol }
  if (publicPort !== undefined && publicPort !== 0) {
    port.publicPort = publicPort
    if (ip !== undefined && ip !== '') {
      port.ip = ip
    }
  }
  return port
}

/**
 * Ports of a container list entry (`Ports`).
 */
export function normalizeListPorts(ports: DockerPort[] | undefined): XoDockerPort[] {
  return dedupePorts(
    (ports ?? []).map(({ IP, PrivatePort, PublicPort, Type }) =>
      makePort({ ip: IP, privatePort: PrivatePort, publicPort: PublicPort, protocol: Type })
    )
  )
}

/**
 * Ports of an inspected container (`NetworkSettings.Ports`), e.g.
 * `{ "80/tcp": [{ "HostIp": "0.0.0.0", "HostPort": "8080" }], "443/tcp": null }`.
 */
export function normalizeInspectPorts(ports: DockerPortMap | undefined): XoDockerPort[] {
  const result: XoDockerPort[] = []
  for (const [key, bindings] of Object.entries(ports ?? {})) {
    const [privatePort, protocol = 'tcp'] = key.split('/')
    if (bindings === null || bindings.length === 0) {
      result.push(makePort({ privatePort: Number(privatePort), protocol }))
    } else {
      for (const { HostIp, HostPort } of bindings) {
        result.push(makePort({ ip: HostIp, privatePort: Number(privatePort), publicPort: Number(HostPort), protocol }))
      }
    }
  }
  return dedupePorts(result)
}

// === Labels, networks, mounts

const COMPOSE_LABEL_PREFIX = 'com.docker.compose.'

/**
 * Docker Compose project and service of a container, from its labels.
 */
export function getComposeInfo(labels: Record<string, string> | undefined): XoDockerCompose | undefined {
  const project = labels?.[COMPOSE_LABEL_PREFIX + 'project']
  if (project === undefined || project === '') {
    return undefined
  }
  const get = (name: string): string | undefined => {
    // `labels!`: set, it contains the project
    const value = labels![COMPOSE_LABEL_PREFIX + name]
    return value === '' ? undefined : value
  }
  const compose: XoDockerCompose = { project }
  const service = get('service')
  if (service !== undefined) {
    compose.service = service
  }
  const containerNumber = Number(get('container-number'))
  if (Number.isInteger(containerNumber)) {
    compose.containerNumber = containerNumber
  }
  const oneOff = get('oneoff')
  if (oneOff !== undefined) {
    compose.oneOff = oneOff.toLowerCase() === 'true'
  }
  const workingDir = get('project.working_dir')
  if (workingDir !== undefined) {
    compose.workingDir = workingDir
  }
  const configFiles = get('project.config_files')
  if (configFiles !== undefined) {
    compose.configFiles = configFiles.split(',')
  }
  return compose
}

/**
 * @param networks `NetworkSettings.Networks`
 */
export function normalizeNetworks(networks: Record<string, DockerEndpointSettings> | undefined): XoDockerNetwork[] {
  return Object.entries(networks ?? {}).map(([name, { IPAddress, GlobalIPv6Address }]) => {
    const network: XoDockerNetwork = { name }
    if (IPAddress) {
      network.ipAddress = IPAddress
    }
    if (GlobalIPv6Address) {
      network.ipv6Address = GlobalIPv6Address
    }
    return network
  })
}

export function normalizeMounts(mounts: DockerMountPoint[] | undefined): XoDockerMount[] {
  return (mounts ?? []).map(({ Type, Name, Source, Destination, RW }) => {
    const mount: XoDockerMount = { type: Type, source: Source, destination: Destination, readOnly: !RW }
    if (Name) {
      mount.name = Name
    }
    return mount
  })
}

// === Containers

/**
 * Entry of `GET /containers/json`.
 */
export function normalizeContainerListEntry(entry: DockerContainerSummary): NormalizedDockerContainer {
  const labels = entry.Labels ?? {}
  const { exitCode, health } = parseContainerStatus(entry.Status)
  const container: NormalizedDockerContainer = {
    dockerId: entry.Id,
    name: getContainerName(entry.Names),
    image: entry.Image,
    imageId: entry.ImageID,
    command: entry.Command,
    createdAt: entry.Created * 1e3,
    state: entry.State,
    status: entry.Status,
    exitCode: entry.State === 'exited' || entry.State === 'dead' || entry.State === 'restarting' ? exitCode : undefined,
    health,
    ports: normalizeListPorts(entry.Ports),
    labels,
    compose: getComposeInfo(labels),
    networks: normalizeNetworks(entry.NetworkSettings?.Networks),
    mounts: normalizeMounts(entry.Mounts),
  }
  return container
}

// same format as the `Command` of list entries: arguments containing a space
// are single-quoted (without any escaping, like dockerd does)
function formatCommand(path: string, args: string[] = []): string {
  return [path, ...args.map(arg => (arg.includes(' ') ? `'${arg}'` : arg))].join(' ')
}

/**
 * `GET /containers/{id}/json`.
 *
 * Contains the same fields as a list entry (except `status`, the human readable
 * one), plus the details only available from an inspection.
 */
export function normalizeContainerInspect(data: DockerInspect): NormalizedDockerContainer {
  const {
    // typed as complete objects: dockerd always sends `Config.Image` and
    // `State.Status`
    Config: config = {} as DockerContainerConfig,
    HostConfig: hostConfig = {},
    NetworkSettings: networkSettings = {},
    State: state = {} as DockerContainerStateInfo,
  } = data
  const labels = config.Labels ?? {}
  const status = state.Status
  const health = state.Health
  const lastHealthCheck = health?.Log?.at(-1)
  const restartPolicy = hostConfig.RestartPolicy

  const container: NormalizedDockerContainer = {
    dockerId: data.Id,
    name: getContainerName([data.Name]),
    image: config.Image,
    imageId: data.Image,
    command: formatCommand(data.Path, data.Args),
    createdAt: parseDockerDate(data.Created),
    state: status,
    exitCode: status === 'exited' || status === 'dead' || status === 'restarting' ? state.ExitCode : undefined,
    health: normalizeHealthStatus(health?.Status),
    ports: normalizeInspectPorts(networkSettings.Ports),
    labels,
    compose: getComposeInfo(labels),
    networks: normalizeNetworks(networkSettings.Networks),
    mounts: normalizeMounts(data.Mounts),

    startedAt: parseDockerDate(state.StartedAt),
    finishedAt: parseDockerDate(state.FinishedAt),
    oomKilled: state.OOMKilled,
    error: state.Error || undefined,
    healthCheck:
      health === undefined || normalizeHealthStatus(health.Status) === undefined
        ? undefined
        : {
            failingStreak: health.FailingStreak,
            lastCheckAt: parseDockerDate(lastHealthCheck?.End ?? lastHealthCheck?.Start),
            lastExitCode: lastHealthCheck?.ExitCode,
          },
    restartPolicy: {
      // `Name` is empty when the container was created without restart policy
      name: restartPolicy?.Name || 'no',
      maximumRetryCount: restartPolicy?.MaximumRetryCount ?? 0,
    },
    restartCount: data.RestartCount,
    tty: config.Tty === true,
    hostname: config.Hostname,
    workingDir: config.WorkingDir || undefined,
    user: config.User || undefined,
  }
  return container
}

// === Stats

// every stats value comes from the daemon: only finite numbers are accepted,
// never numeric strings (which the sums would concatenate), objects, NaN or
// Infinity, and every computed value is checked again (huge values overflow)
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
// byte, page, process counters
const isCounter = (value: unknown): value is number => isNumber(value) && value >= 0
const finiteOrNull = (value: unknown): number | null => (isNumber(value) ? value : null)
// arrays included: their properties are read like the ones of any object
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * CPU usage in percent, like `docker stats`: 100 means one full CPU, so the
 * value can go up to `100 * onlineCpus`.
 *
 * `null` when it cannot be computed: first sample of a stream, or of a
 * container which is not running (no `precpu_stats.system_cpu_usage`), no
 * elapsed system time (would give `Infinity`/`NaN`) or counters which went
 * backwards (container restarted between the samples).
 *
 * @param cpuStats `cpu_stats`
 * @param precpuStats `precpu_stats`
 */
export function computeCpuPercent(
  cpuStats: DockerCpuStats | undefined,
  precpuStats: DockerCpuStats | undefined
): { cpuPercent: number | null; onlineCpus: number | undefined } {
  const onlineCpusValue = cpuStats?.online_cpus
  const percpuUsage = cpuStats?.cpu_usage?.percpu_usage
  const onlineCpus =
    // `as number`: a safe integer
    Number.isSafeInteger(onlineCpusValue) && (onlineCpusValue as number) > 0
      ? (onlineCpusValue as number)
      : (Array.isArray(percpuUsage) && percpuUsage.length) || undefined
  const total = cpuStats?.cpu_usage?.total_usage
  const preTotal = precpuStats?.cpu_usage?.total_usage
  const system = cpuStats?.system_cpu_usage
  const preSystem = precpuStats?.system_cpu_usage
  if (
    onlineCpus === undefined ||
    !isCounter(total) ||
    !isCounter(preTotal) ||
    !isCounter(system) ||
    !isCounter(preSystem) ||
    !(preSystem > 0)
  ) {
    return { cpuPercent: null, onlineCpus }
  }
  const cpuDelta = total - preTotal
  const systemDelta = system - preSystem
  if (!(systemDelta > 0) || cpuDelta < 0) {
    return { cpuPercent: null, onlineCpus }
  }
  return { cpuPercent: finiteOrNull((cpuDelta / systemDelta) * onlineCpus * 100), onlineCpus }
}

/**
 * Memory used by a container, without the page cache which can be reclaimed,
 * like `docker stats`:
 *
 * - cgroup v1: `usage - total_inactive_file` (Docker CLI ≥ 20.10), or
 *   `usage - cache` with daemons which do not report `total_inactive_file`
 * - cgroup v2: `usage - inactive_file`
 *
 * @param memoryStats `memory_stats`
 * @returns bytes
 */
export function computeMemoryUsage(memoryStats: DockerMemoryStats | undefined): number | null {
  const usage = memoryStats?.usage
  if (!isCounter(usage)) {
    return null
  }
  // `memoryStats!`: set, it has a `usage`
  const stats = isObject(memoryStats!.stats) ? memoryStats!.stats : {}
  let cache
  if ('total_inactive_file' in stats) {
    cache = stats.total_inactive_file // cgroup v1
  } else if ('inactive_file' in stats) {
    cache = stats.inactive_file // cgroup v2
  } else {
    cache = stats.cache // cgroup v1 (old daemons)
  }
  return isCounter(cache) && cache < usage ? usage - cache : usage
}

/**
 * Sum of the bytes read and written, from `blkio_stats.io_service_bytes_recursive`.
 */
function computeBlockIo(blkioStats: DockerBlkioStats | undefined): {
  blockRead: number | null
  blockWrite: number | null
} {
  const entries = blkioStats?.io_service_bytes_recursive
  if (!Array.isArray(entries)) {
    return { blockRead: null, blockWrite: null }
  }
  let blockRead = 0
  let blockWrite = 0
  for (const entry of entries) {
    if (!isObject(entry) || typeof entry.op !== 'string' || !isCounter(entry.value)) {
      continue
    }
    // `Read`/`Write` on cgroup v1, `read`/`write` on cgroup v2
    const lowerOp = entry.op.toLowerCase()
    if (lowerOp === 'read') {
      blockRead += entry.value
    } else if (lowerOp === 'write') {
      blockWrite += entry.value
    }
  }
  return { blockRead: finiteOrNull(blockRead), blockWrite: finiteOrNull(blockWrite) }
}

function computeNetworkIo(networks: unknown): { networkRx: number | null; networkTx: number | null } {
  if (!isObject(networks)) {
    return { networkRx: null, networkTx: null }
  }
  let networkRx = 0
  let networkTx = 0
  for (const network of Object.values(networks)) {
    if (!isObject(network)) {
      continue
    }
    if (isCounter(network.rx_bytes)) {
      networkRx += network.rx_bytes
    }
    if (isCounter(network.tx_bytes)) {
      networkTx += network.tx_bytes
    }
  }
  return { networkRx: finiteOrNull(networkRx), networkTx: finiteOrNull(networkTx) }
}

/**
 * One object of `GET /containers/{id}/stats` (`stream=false`, or each object
 * of `stream=true`). Never send `one-shot=true`: `precpu_stats` would be empty.
 *
 * Linux containers only: Windows ones have a different CPU accounting, and get
 * a `null` `cpuPercent`.
 *
 * @param value anything: it comes from the daemon, every value is checked
 */
export function normalizeContainerStats(value: unknown): XoDockerContainerStats {
  if (!isObject(value) || Array.isArray(value)) {
    throw new TypeError('stats must be an object')
  }
  // see `DockerStatsSample`: the values are `unknown`
  const stats = value as DockerStatsSample
  const isWindows = stats.os_type === 'windows'
  const { cpuPercent, onlineCpus } = isWindows
    ? { cpuPercent: null, onlineCpus: undefined }
    : computeCpuPercent(stats.cpu_stats, stats.precpu_stats)
  const memoryStats: DockerMemoryStats | undefined = isObject(stats.memory_stats) ? stats.memory_stats : undefined
  const memoryUsage = isWindows
    ? isCounter(memoryStats?.privateworkingset)
      ? memoryStats.privateworkingset
      : null
    : computeMemoryUsage(memoryStats)
  const memoryLimit = isCounter(memoryStats?.limit) && memoryStats.limit > 0 ? memoryStats.limit : null
  return {
    sampledAt: parseDockerDate(stats.read) ?? null,
    cpuPercent,
    onlineCpus,
    memoryUsage,
    memoryLimit,
    memoryPercent:
      memoryUsage !== null && memoryLimit !== null ? finiteOrNull((memoryUsage / memoryLimit) * 100) : null,
    ...computeNetworkIo(stats.networks),
    ...computeBlockIo(stats.blkio_stats),
    pids: isCounter(stats.pids_stats?.current) ? stats.pids_stats.current : null,
  }
}

// === Engine

/**
 * `GET /info`, and optionally `GET /version` for the daemon's API versions.
 */
export function normalizeEngineInfo(info: DockerInfo, version?: DockerVersion): NormalizedDockerEngineInfo {
  const securityOptions = info.SecurityOptions ?? []
  return {
    id: info.ID,
    name: info.Name,
    engineVersion: info.ServerVersion ?? version?.Version,
    apiVersion: version?.ApiVersion,
    minApiVersion: version?.MinAPIVersion,
    operatingSystem: info.OperatingSystem,
    osType: info.OSType,
    kernelVersion: info.KernelVersion,
    architecture: info.Architecture,
    cpus: info.NCPU,
    memory: info.MemTotal,
    storageDriver: info.Driver,
    loggingDriver: info.LoggingDriver,
    cgroupDriver: info.CgroupDriver,
    cgroupVersion: info.CgroupVersion,
    rootless: securityOptions.some(option => option === 'name=rootless' || option.startsWith('name=rootless,')),
    containers: {
      total: info.Containers,
      running: info.ContainersRunning,
      paused: info.ContainersPaused,
      stopped: info.ContainersStopped,
    },
    images: info.Images,
    warnings: info.Warnings ?? [],
  }
}
