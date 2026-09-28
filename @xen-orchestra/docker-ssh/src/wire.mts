// Docker Engine API wire shapes read by this package. Internal: the XO DTOs are
// in `@vates/types`.
//
// Built from the types generated from Docker's OpenAPI specifications
// (`docker-api.gen.mts`, see `scripts/generate-api-types.mjs`): only the fields
// read by the transport and the normalizers are picked, their types come from
// the spec. The daemon sends more (hence the index signatures), and older API
// versions may omit some of them. Departures from the spec are commented.
//
// These types are what the daemon is expected to send, they are not checked,
// except for the stats: a hostile or buggy daemon controls every value (see
// `normalizeContainerStats()`), which are therefore `unknown`.

import type { definitions as Api } from './docker-api.gen.mjs'

/** the fields `K` of the spec definition `T`, the others being allowed but unknown */
type Wire<T, K extends keyof T> = Pick<T, K> & { [key: string]: unknown }

/**
 * `T` with the fields `K` required: sent by every daemon, relied upon by the
 * normalizers (an intersection, not `Omit`, which would lose the properties of a
 * type with an index signature)
 */
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> }

/** `GET /version` */
export type DockerVersion = Wire<Api['SystemVersion'], 'Version' | 'ApiVersion' | 'MinAPIVersion'>

/** `GET /info` */
export type DockerInfo = Wire<
  Api['SystemInfo'],
  | 'ID'
  | 'Name'
  | 'ServerVersion'
  | 'OperatingSystem'
  | 'OSType'
  | 'KernelVersion'
  | 'Architecture'
  | 'NCPU'
  | 'MemTotal'
  | 'Driver'
  | 'LoggingDriver'
  | 'CgroupDriver'
  | 'CgroupVersion'
  | 'Containers'
  | 'ContainersRunning'
  | 'ContainersPaused'
  | 'ContainersStopped'
  | 'Images'
> & {
  // not in the spec: `null` when empty
  SecurityOptions?: Api['SystemInfo']['SecurityOptions'] | null
  Warnings?: Api['SystemInfo']['Warnings'] | null
}

export type DockerContainerState = NonNullable<Api['ContainerState']['Status']>

/** entry of `Ports` in `GET /containers/json` */
export type DockerPort = Wire<Api['Port'], 'IP' | 'PrivatePort' | 'PublicPort' | 'Type'>

/**
 * `NetworkSettings.Ports` of `GET /containers/{id}/json`, e.g.
 * `{ "80/tcp": [{ "HostIp": "0.0.0.0", "HostPort": "8080" }], "443/tcp": null }`
 * (not in the spec: `null` for an exposed port which is not published)
 */
export type DockerPortMap = Record<string, WithRequired<Api['PortBinding'], 'HostIp' | 'HostPort'>[] | null>

/** value of `NetworkSettings.Networks` */
export type DockerEndpointSettings = Wire<Api['EndpointSettings'], 'IPAddress' | 'GlobalIPv6Address'>

export type DockerMountPoint = WithRequired<
  Wire<Api['MountPoint'], 'Type' | 'Name' | 'Source' | 'Destination' | 'RW'>,
  'Type' | 'Source' | 'Destination' | 'RW'
>

/** entry of `GET /containers/json` */
export type DockerContainerSummary = WithRequired<
  Wire<
    Api['ContainerSummary'],
    'Id' | 'Names' | 'Image' | 'ImageID' | 'Command' | 'Created' | 'Status' | 'Ports' | 'Labels' | 'Mounts'
  >,
  'Id' | 'Image' | 'ImageID' | 'Command' | 'Created'
> & {
  // the spec says `string`
  State: DockerContainerState
  NetworkSettings?: { Networks?: Record<string, DockerEndpointSettings>; [key: string]: unknown }
  Mounts?: DockerMountPoint[]
}

/** `Config` of `GET /containers/{id}/json` */
export type DockerContainerConfig = WithRequired<
  Wire<Api['ContainerConfig'], 'Image' | 'Labels' | 'Tty' | 'Hostname' | 'WorkingDir' | 'User' | 'Env'>,
  'Image'
>

export type DockerHealthCheckResult = Wire<Api['HealthcheckResult'], 'Start' | 'End' | 'ExitCode' | 'Output'>

/** `State` of `GET /containers/{id}/json` */
export type DockerContainerStateInfo = WithRequired<
  Wire<Api['ContainerState'], 'Status' | 'ExitCode' | 'OOMKilled' | 'Error' | 'StartedAt' | 'FinishedAt'>,
  'Status'
> & {
  /** only for a container with a health check */
  Health?: WithRequired<Wire<Api['Health'], 'Status' | 'FailingStreak'>, 'FailingStreak'> & {
    Log?: DockerHealthCheckResult[]
  }
}

/** `GET /containers/{id}/json` */
export type DockerInspect = WithRequired<
  Wire<Api['ContainerInspectResponse'], 'Id' | 'Name' | 'Image' | 'Path' | 'Args' | 'Created' | 'RestartCount'>,
  'Id' | 'Name' | 'Image' | 'Path'
> & {
  Config?: DockerContainerConfig
  HostConfig?: { RestartPolicy?: Api['RestartPolicy']; [key: string]: unknown }
  NetworkSettings?: {
    Ports?: DockerPortMap
    Networks?: Record<string, DockerEndpointSettings>
    [key: string]: unknown
  }
  State?: DockerContainerStateInfo
  Mounts?: DockerMountPoint[]
}

// === Stats: never trusted
//
// The keys come from the spec (API 1.48, the first one documenting the stats),
// every value is `unknown`: the objects are typed as such so that they can be
// read with optional chaining, which gives `undefined` whatever they really
// are (the keys read are not properties of the prototypes of the primitives).
// No index signature: reading a key which is not in the spec does not compile.

type Untrusted<T> = { [K in keyof T]?: unknown }

/** `cpu_stats` and `precpu_stats` */
export type DockerCpuStats = Omit<Untrusted<Api['ContainerCPUStats']>, 'cpu_usage'> & {
  cpu_usage?: Untrusted<Api['ContainerCPUUsage']>
}

/** `memory_stats` (`stats`: cgroup counters, e.g. `inactive_file`; `privateworkingset`: Windows) */
export type DockerMemoryStats = Untrusted<Api['ContainerMemoryStats']>

/** `blkio_stats` (`io_service_bytes_recursive`: `{ op, value }` entries) */
export type DockerBlkioStats = Untrusted<Api['ContainerBlkioStats']>

/** one object of `GET /containers/{id}/stats` */
export type DockerStatsSample = Omit<
  Untrusted<Api['ContainerStatsResponse']>,
  'cpu_stats' | 'precpu_stats' | 'memory_stats' | 'blkio_stats' | 'pids_stats'
> & {
  cpu_stats?: DockerCpuStats
  precpu_stats?: DockerCpuStats
  memory_stats?: DockerMemoryStats
  blkio_stats?: DockerBlkioStats
  pids_stats?: Untrusted<Api['ContainerPidsStats']>
  /** sent by the daemon (e.g. `windows`), missing from the spec */
  os_type?: unknown
}
