// DTOs of the Docker engines reached through SSH (xo-server `xo-mixins/docker.mjs`)
//
// Dates are milliseconds since the epoch. Optional values which do not apply
// are omitted, except the stats values which are `null` when they cannot be
// computed.

export type XoDockerContainerState = 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead'

export type XoDockerContainerHealth = 'starting' | 'healthy' | 'unhealthy'

export type XoDockerContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause'

export type XoDockerPort = {
  /** only for a published port, absent when published on all interfaces of an old daemon */
  ip?: string
  privatePort: number
  /** absent when the port is not published */
  publicPort?: number
  protocol: string
}

export type XoDockerCompose = {
  project: string
  service?: string
  containerNumber?: number
  oneOff?: boolean
  workingDir?: string
  configFiles?: string[]
}

export type XoDockerNetwork = {
  name: string
  ipAddress?: string
  ipv6Address?: string
}

export type XoDockerMount = {
  type: string
  name?: string
  source: string
  destination: string
  readOnly: boolean
}

export type XoDockerHealthCheck = {
  failingStreak: number
  lastCheckAt?: number
  lastExitCode?: number
}

export type XoDockerRestartPolicy = {
  /** `no` when the container has no restart policy */
  name: string
  maximumRetryCount: number
}

/**
 * Stats of one container, like `docker stats`
 */
export type XoDockerContainerStats = {
  sampledAt: number | null
  /** 100 means one full CPU: can go up to `100 * onlineCpus` */
  cpuPercent: number | null
  onlineCpus?: number
  /** bytes, without the reclaimable page cache */
  memoryUsage: number | null
  memoryLimit: number | null
  memoryPercent: number | null
  networkRx: number | null
  networkTx: number | null
  blockRead: number | null
  blockWrite: number | null
  pids: number | null
}

export type XoDockerComposeSummary = {
  projects: { name: string; containers: number; running: number }[]
}

export type XoDockerError = {
  /** DockerError code, e.g. `SSH_AUTH_FAILED` */
  code: string
  message: string
  data?: Record<string, unknown>
}

export type XoDockerEngineInfoConnected = {
  status: 'connected'
  asOf: number
  /** the daemon's ID, not the engine's */
  daemonId?: string
  name?: string
  engineVersion?: string
  /** the Docker API version negotiated by XO */
  apiVersion?: string
  /** the newest Docker API version of the daemon */
  daemonApiVersion?: string
  minApiVersion?: string
  operatingSystem?: string
  osType?: string
  kernelVersion?: string
  architecture?: string
  cpus?: number
  /** bytes */
  memory?: number
  storageDriver?: string
  loggingDriver?: string
  cgroupDriver?: string
  cgroupVersion?: string
  rootless: boolean
  containers: { total?: number; running?: number; paused?: number; stopped?: number }
  images?: number
  warnings: string[]
  compose: XoDockerComposeSummary
}

export type XoDockerEngineInfoDisconnected = {
  status: 'unreachable' | 'auth-failed' | 'host-key-mismatch'
  asOf: number
  error: XoDockerError
}

/**
 * Live information about an engine: `status` tells whether it could be reached
 */
export type XoDockerEngineInfo = XoDockerEngineInfoConnected | XoDockerEngineInfoDisconnected

export type XoDockerSocketDiagnostic = {
  code: 'socket-missing' | 'not-a-socket' | 'permission-denied' | 'forwarding-disabled' | 'probe-failed'
  message: string
}

export type XoDockerEngineTestResult = {
  ok: boolean
  apiVersion?: string
  engineVersion?: string
  /** observed SSH host key, `SHA256:…` */
  fingerprint?: string
  algorithm?: string
  error?: XoDockerError
  /** only when the Docker socket could not be opened */
  diagnostic?: XoDockerSocketDiagnostic
}

export type XoDockerLogEntry = {
  /** RFC 3339 date with nanoseconds, absent with `timestamps: false` */
  timestamp?: string
  stream: 'stdout' | 'stderr'
  message: string
}

export type XoDockerLogs = {
  entries: XoDockerLogEntry[]
  /** the logs have been cut: at `docker.maxLogsSize`, or when reading them timed out */
  truncated: boolean
  /** reading stopped at `docker.logsTimeout` (overall) or `docker.logsIdleTimeout` (no data) */
  timedOut: boolean
  asOf: number
}

/**
 * Failure of one engine in a container listing
 */
export type XoDockerContainerListError = {
  $engine: string
  $VM?: string
  code: string
  message: string
}
