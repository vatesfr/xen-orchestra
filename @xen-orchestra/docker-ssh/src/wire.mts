// Docker Engine API wire shapes, as documented for API 1.43 (`MAX_API_VERSION`)
// and read by this package. Internal: the XO DTOs are in `@vates/types`.
//
// Only the fields read by the transport and the normalizers are listed, the
// daemon sends more (hence the index signatures), and older API versions may
// omit some of them. These types are what the daemon is expected to send, they
// are not checked, except for the stats: a hostile or buggy daemon controls
// every value (see `normalizeContainerStats()`), which are therefore
// `unknown`.

/** `GET /version` */
export type DockerVersion = {
  Version?: string
  ApiVersion?: string
  MinAPIVersion?: string
  [key: string]: unknown
}

/** `GET /info` */
export type DockerInfo = {
  ID?: string
  Name?: string
  ServerVersion?: string
  OperatingSystem?: string
  OSType?: string
  KernelVersion?: string
  Architecture?: string
  NCPU?: number
  MemTotal?: number
  Driver?: string
  LoggingDriver?: string
  CgroupDriver?: string
  CgroupVersion?: string
  SecurityOptions?: string[] | null
  Containers?: number
  ContainersRunning?: number
  ContainersPaused?: number
  ContainersStopped?: number
  Images?: number
  Warnings?: string[] | null
  [key: string]: unknown
}

export type DockerContainerState = 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead'

/** entry of `Ports` in `GET /containers/json` */
export type DockerPort = {
  IP?: string
  PrivatePort: number
  PublicPort?: number
  Type: string
  [key: string]: unknown
}

/** `NetworkSettings.Ports` of `GET /containers/{id}/json`, e.g. `{ "80/tcp": [{ "HostIp": "0.0.0.0", "HostPort": "8080" }], "443/tcp": null }` */
export type DockerPortMap = Record<string, { HostIp: string; HostPort: string }[] | null>

/** value of `NetworkSettings.Networks` */
export type DockerEndpointSettings = {
  IPAddress?: string
  GlobalIPv6Address?: string
  [key: string]: unknown
}

export type DockerMountPoint = {
  Type: string
  Name?: string
  Source: string
  Destination: string
  RW: boolean
  [key: string]: unknown
}

/** entry of `GET /containers/json` */
export type DockerContainerSummary = {
  Id: string
  Names?: string[]
  Image: string
  ImageID: string
  Command: string
  /** seconds since the epoch */
  Created: number
  State: DockerContainerState
  /** human readable, e.g. `Up 5 minutes (healthy)` */
  Status?: string
  Ports?: DockerPort[]
  Labels?: Record<string, string>
  NetworkSettings?: { Networks?: Record<string, DockerEndpointSettings>; [key: string]: unknown }
  Mounts?: DockerMountPoint[]
  [key: string]: unknown
}

/** `Config` of `GET /containers/{id}/json` */
export type DockerContainerConfig = {
  Image: string
  Labels?: Record<string, string>
  Tty?: boolean
  Hostname?: string
  WorkingDir?: string
  User?: string
  /** never exposed: it routinely contains secrets */
  Env?: string[]
  [key: string]: unknown
}

export type DockerHealthCheckResult = {
  Start?: string
  End?: string
  ExitCode?: number
  Output?: string
  [key: string]: unknown
}

/** `State` of `GET /containers/{id}/json` */
export type DockerContainerStateInfo = {
  Status: DockerContainerState
  ExitCode?: number
  OOMKilled?: boolean
  Error?: string
  /** RFC 3339, Go's zero date when not set */
  StartedAt?: string
  FinishedAt?: string
  /** only for a container with a health check */
  Health?: {
    Status?: string
    FailingStreak: number
    Log?: DockerHealthCheckResult[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** `GET /containers/{id}/json` */
export type DockerInspect = {
  Id: string
  /** with a leading `/` */
  Name: string
  /** image ID */
  Image: string
  Path: string
  Args?: string[]
  /** RFC 3339 */
  Created?: string
  RestartCount?: number
  Config?: DockerContainerConfig
  HostConfig?: {
    RestartPolicy?: { Name?: string; MaximumRetryCount?: number }
    [key: string]: unknown
  }
  NetworkSettings?: {
    Ports?: DockerPortMap
    Networks?: Record<string, DockerEndpointSettings>
    [key: string]: unknown
  }
  State?: DockerContainerStateInfo
  Mounts?: DockerMountPoint[]
  [key: string]: unknown
}

// === Stats: never trusted
//
// The objects are typed as such so that they can be read with optional
// chaining, which gives `undefined` whatever they really are: the keys read are
// not properties of the prototypes of the primitives.

/** `cpu_stats` and `precpu_stats` */
export type DockerCpuStats = {
  online_cpus?: unknown
  cpu_usage?: { total_usage?: unknown; percpu_usage?: unknown; [key: string]: unknown }
  system_cpu_usage?: unknown
  [key: string]: unknown
}

/** `memory_stats` */
export type DockerMemoryStats = {
  usage?: unknown
  limit?: unknown
  /** cgroup counters, e.g. `inactive_file` */
  stats?: unknown
  /** Windows */
  privateworkingset?: unknown
  [key: string]: unknown
}

/** `blkio_stats` */
export type DockerBlkioStats = {
  /** `{ op, value }` entries */
  io_service_bytes_recursive?: unknown
  [key: string]: unknown
}

/** one object of `GET /containers/{id}/stats` */
export type DockerStatsSample = {
  /** RFC 3339 */
  read?: unknown
  os_type?: unknown
  cpu_stats?: DockerCpuStats
  precpu_stats?: DockerCpuStats
  memory_stats?: DockerMemoryStats
  /** interface name → `{ rx_bytes, tx_bytes }` */
  networks?: unknown
  blkio_stats?: DockerBlkioStats
  pids_stats?: { current?: unknown; [key: string]: unknown }
  [key: string]: unknown
}
