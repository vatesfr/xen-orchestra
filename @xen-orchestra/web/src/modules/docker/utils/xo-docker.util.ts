import {
  DOCKER_STATUS,
  type DockerHostKeyErrorData,
  type DockerStatus,
  type FrontXoDockerContainer,
  type FrontXoDockerEngine,
  type FrontXoDockerEngineInfo,
} from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoDockerContainerAction, XoDockerContainerState, XoDockerLogEntry, XoDockerPort } from '@vates/types'

/**
 * Addresses to offer for the SSH connection to a VM: its IPv4 addresses
 * (the IPv6 ones are typically link-local), deduplicated, the main one first.
 *
 * `addresses` is keyed `<device>/ipv4/<n>` (and the legacy `<device>/ip`).
 */
export function getVmSshCandidateAddresses(vm: Pick<FrontXoVm, 'addresses' | 'mainIpAddress'>): string[] {
  const addresses = new Set<string>()

  if (vm.mainIpAddress !== undefined && vm.mainIpAddress !== '' && !vm.mainIpAddress.includes(':')) {
    addresses.add(vm.mainIpAddress)
  }

  for (const [key, address] of Object.entries(vm.addresses ?? {})) {
    if (/\/ipv6\//.test(key) || address.includes(':')) {
      continue
    }

    addresses.add(address)
  }

  return [...addresses]
}

/**
 * The 12 first characters of a Docker id, like `docker ps`
 */
export function shortContainerId(dockerId: string): string {
  return dockerId.slice(0, 12)
}

/**
 * The name of a container, or its short id when it has none
 */
export function getContainerDisplayName(container: Pick<FrontXoDockerContainer, 'name' | 'dockerId'>): string {
  return container.name ?? shortContainerId(container.dockerId)
}

/**
 * `8080→80` for a published port, `80/tcp` otherwise; the protocol is shown
 * unless it is TCP.
 */
export function formatPortMapping(port: XoDockerPort): string {
  const protocol = port.protocol === 'tcp' ? '' : `/${port.protocol}`

  if (port.publicPort === undefined) {
    return `${port.privatePort}/${port.protocol}`
  }

  return `${port.publicPort}→${port.privatePort}${protocol}`
}

/**
 * Docker lists a port published on all interfaces twice (`0.0.0.0` and `::`)
 */
export function dedupePorts(ports: XoDockerPort[]): XoDockerPort[] {
  const seen = new Set<string>()

  return ports.filter(port => {
    const key = `${port.publicPort}:${port.privatePort}/${port.protocol}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

const LOOPBACK_RE = /^(127\.|::1$|localhost$)/

/**
 * URL opening a published TCP port from the browser, `undefined` when the port
 * is not published or only bound to the loopback interface of the guest.
 */
export function buildPublishedPortUrl(port: XoDockerPort, host: string | undefined): string | undefined {
  if (
    host === undefined ||
    host === '' ||
    port.publicPort === undefined ||
    port.protocol !== 'tcp' ||
    (port.ip !== undefined && LOOPBACK_RE.test(port.ip))
  ) {
    return undefined
  }

  const hostname = host.includes(':') ? `[${host}]` : host

  return `http://${hostname}:${port.publicPort}`
}

/**
 * Lifecycle actions available in a container state, the deletion being a
 * separate action (`canDeleteContainer`)
 */
export function getContainerActions(state: XoDockerContainerState): XoDockerContainerAction[] {
  switch (state) {
    case 'running':
      return ['restart', 'pause', 'stop']
    case 'paused':
      return ['unpause', 'stop']
    case 'restarting':
      return ['stop']
    case 'created':
    case 'exited':
    case 'dead':
      return ['start']
    case 'removing':
      return []
  }
}

export function canDeleteContainer(state: XoDockerContainerState): boolean {
  return state === 'created' || state === 'exited' || state === 'dead'
}

/**
 * The action of the side panel's main button
 */
export function getContainerPrimaryAction(state: XoDockerContainerState): XoDockerContainerAction | undefined {
  switch (state) {
    case 'running':
    case 'restarting':
      return 'stop'
    case 'paused':
      return 'unpause'
    case 'created':
    case 'exited':
    case 'dead':
      return 'start'
    case 'removing':
      return undefined
  }
}

/**
 * Docker restarts a container with these policies as soon as it stops on its
 * own, and a user stopping it could believe the action failed: confirm first.
 *
 * (A manual `docker stop` is honoured by dockerd: it is not restarted until
 * the daemon restarts, or at all with `unless-stopped`.)
 */
export function shouldConfirmContainerStop(container: Pick<FrontXoDockerContainer, 'restartPolicy'>): boolean {
  const policy = container.restartPolicy?.name

  return policy === 'always' || policy === 'unless-stopped'
}

export type ContainerStateAccent = 'success' | 'warning' | 'danger' | 'muted'

/**
 * Accent of the state tag: an exited container is shown in danger whatever its
 * exit code, the code being part of the label
 */
export function getContainerStateAccent({
  state,
  health,
}: Pick<FrontXoDockerContainer, 'state' | 'health'>): ContainerStateAccent {
  switch (state) {
    case 'running':
      return health === 'unhealthy' ? 'warning' : 'success'
    case 'exited':
    case 'dead':
      return 'danger'
    case 'paused':
    case 'restarting':
      return 'warning'
    default:
      return 'muted'
  }
}

/**
 * The published TCP port to offer to open from the browser: only when the
 * container publishes exactly one, and not only on the loopback interface of
 * the guest. Otherwise every port is listed and none is a link.
 */
export function getPublishedPortToOpen(
  ports: XoDockerPort[],
  host: string | undefined
): { port: XoDockerPort; url: string } | undefined {
  const published = dedupePorts(ports).filter(port => port.publicPort !== undefined && port.protocol === 'tcp')

  if (published.length !== 1) {
    return undefined
  }

  const [port] = published
  const url = buildPublishedPortUrl(port, host)

  return url === undefined ? undefined : { port, url }
}

export type DockerApiErrorInfo = {
  status?: number
  /** Docker error code, e.g. `SSH_COOLDOWN` or `DOCKER_API_ERROR` */
  code?: string
  message: string
  /** seconds, for `SSH_COOLDOWN` (429) and `POOL_EXHAUSTED` (503) */
  retryAfter?: number
}

/**
 * What an `ApiError` thrown by `fetchRequest` says: the REST API answers
 * `{ error, data: { code, … } }`; `SSH_COOLDOWN` carries `data.retryAfter`
 * (like the `Retry-After` header, which `fetchRequest` does not expose).
 */
export function parseDockerApiError(error: unknown): DockerApiErrorInfo {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error) }
  }

  const { status, cause, message } = error as { status?: unknown; cause?: unknown; message?: unknown }
  const body = (typeof cause === 'object' && cause !== null ? cause : {}) as {
    error?: unknown
    message?: unknown
    data?: Record<string, unknown>
  }
  const data = body.data ?? {}
  const retryAfter = data.retryAfter

  return {
    status: typeof status === 'number' ? status : undefined,
    code: typeof data.code === 'string' ? data.code : undefined,
    message:
      typeof body.error === 'string'
        ? body.error
        : typeof body.message === 'string'
          ? body.message
          : String(message ?? error),
    retryAfter:
      typeof retryAfter === 'number' && retryAfter > 0
        ? Math.ceil(retryAfter)
        : status === 429 || data.code === 'SSH_COOLDOWN'
          ? 1
          : undefined,
  }
}

export type DockerContainersSummary = {
  total: number
  running: number
  paused: number
  stopped: number
  composeProjects: { name: string; containers: number; running: number }[]
}

/**
 * Counters of the containers summary card, derived from the container list so
 * that they always agree with the table.
 */
export function summarizeContainers(containers: Pick<FrontXoDockerContainer, 'state' | 'compose'>[]) {
  const summary: DockerContainersSummary = { total: 0, running: 0, paused: 0, stopped: 0, composeProjects: [] }
  const projects = new Map<string, DockerContainersSummary['composeProjects'][number]>()

  for (const { state, compose } of containers) {
    summary.total++

    if (state === 'running' || state === 'restarting') {
      summary.running++
    } else if (state === 'paused') {
      summary.paused++
    } else if (state !== 'removing') {
      summary.stopped++
    }

    if (compose !== undefined) {
      let project = projects.get(compose.project)

      if (project === undefined) {
        project = { name: compose.project, containers: 0, running: 0 }
        projects.set(compose.project, project)
      }

      project.containers++

      if (state === 'running') {
        project.running++
      }
    }
  }

  summary.composeProjects = [...projects.values()].sort((a, b) => a.name.localeCompare(b.name))

  return summary
}

/**
 * Status of the Docker engine of a VM: `not-configured` without engine, else
 * the status reported by its info (`undefined` while unknown).
 */
export function getDockerStatus(
  engine: FrontXoDockerEngine | undefined,
  info: Pick<FrontXoDockerEngineInfo, 'status'> | undefined
): DockerStatus | undefined {
  if (engine === undefined) {
    return DOCKER_STATUS.NOT_CONFIGURED
  }

  return info?.status
}

/**
 * The host key data of a 409 of `POST`/`PATCH /docker-engines`, if it is one
 */
export function getHostKeyErrorData(error: unknown): DockerHostKeyErrorData | undefined {
  if (typeof error !== 'object' || error === null || (error as { status?: unknown }).status !== 409) {
    return undefined
  }

  const data = (error as { cause?: { data?: Record<string, unknown> } }).cause?.data

  if (data?.code === 'HOST_KEY_UNKNOWN' && typeof data.fingerprint === 'string') {
    return data as DockerHostKeyErrorData
  }

  if (data?.code === 'HOST_KEY_MISMATCH' && typeof data.actual === 'string') {
    return data as DockerHostKeyErrorData
  }

  return undefined
}

export const SSH_FINGERPRINT_RE = /^SHA256:[A-Za-z0-9+/]{43}=?$/

export function isSshFingerprint(value: string): boolean {
  return SSH_FINGERPRINT_RE.test(value.trim())
}

export function isSshPrivateKey(value: string): boolean {
  return value.trimStart().startsWith('-----BEGIN ')
}

/**
 * Log entries as text, one line each: `2026-09-25 08:42:01 message`, with a
 * `stderr` marker on the error stream (the date is the engine's, in UTC)
 */
export function formatDockerLogEntries(entries: XoDockerLogEntry[]): string {
  return entries
    .map(({ timestamp, stream, message }) => {
      const date = timestamp === undefined ? '' : `${timestamp.slice(0, 19).replace('T', ' ')} `
      const marker = stream === 'stderr' ? '[stderr] ' : ''

      return `${date}${marker}${message}`
    })
    .join('\n')
}
