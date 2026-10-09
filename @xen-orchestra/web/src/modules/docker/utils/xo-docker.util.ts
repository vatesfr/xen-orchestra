import type {
  DockerHostKeyErrorData,
  DockerStopConfirmedRestartPolicy,
  FrontXoDockerContainer,
} from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { IPV4_REGEX } from '@core/packages/form-validation/custom-rules/ip.regex.ts'
import type { XoDockerContainerAction, XoDockerContainerState, XoDockerLogEntry, XoDockerPort } from '@vates/types'
import { uniqBy } from 'lodash-es'

function isIpv4Address(value: string | undefined): value is string {
  return value !== undefined && IPV4_REGEX.test(value)
}

/**
 * Addresses to offer for the SSH connection to a VM: its IPv4 addresses
 * (the IPv6 ones are typically link-local), deduplicated, the main one first.
 *
 * `addresses` is keyed `<device>/ipv4/<n>` (and the legacy `<device>/ip`).
 */
export function getVmSshCandidateAddresses(vm: Pick<FrontXoVm, 'addresses' | 'mainIpAddress'>): string[] {
  const addresses = new Set<string>()

  if (isIpv4Address(vm.mainIpAddress)) {
    addresses.add(vm.mainIpAddress)
  }

  for (const [key, address] of Object.entries(vm.addresses ?? {})) {
    if (!/\/ipv6\//.test(key) && isIpv4Address(address)) {
      addresses.add(address)
    }
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
  return uniqBy(ports, port => `${port.publicPort}:${port.privatePort}/${port.protocol}`)
}

const LOOPBACK_RE = /^(127\.|::1$|localhost$)/

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
  return getContainerActions(state).find(action => action !== 'restart' && action !== 'pause')
}

/**
 * Docker restarts a container with these policies as soon as it stops on its
 * own, and a user stopping it could believe the action failed: confirm first.
 * Returns the policy to confirm, `undefined` when stopping needs no confirmation.
 *
 * (A manual `docker stop` is honoured by dockerd: it is not restarted until
 * the daemon restarts, or at all with `unless-stopped`.)
 */
export function getStopConfirmedRestartPolicy(
  container: Pick<FrontXoDockerContainer, 'restartPolicy'>
): DockerStopConfirmedRestartPolicy | undefined {
  const policy = container.restartPolicy?.name

  return policy === 'always' || policy === 'unless-stopped' ? policy : undefined
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

  if (host === undefined || host === '' || (port.ip !== undefined && LOOPBACK_RE.test(port.ip))) {
    return undefined
  }

  const hostname = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host

  // the setters validate and normalize the host (an IPv6 address compressed),
  // ignoring an invalid one or truncating it at a delimiter (`/`, `?`…)
  const url = new URL('http://placeholder')
  url.hostname = hostname
  url.port = String(port.publicPort)

  if (url.hostname === 'placeholder' || (!hostname.startsWith('[') && url.hostname !== hostname.toLowerCase())) {
    return undefined
  }

  return { port, url: url.origin }
}

export type DockerApiErrorInfo = {
  status?: number
  /** Docker error code, e.g. `SSH_COOLDOWN` or `DOCKER_API_ERROR` */
  code?: string
  message: string
  /** seconds, for `SSH_COOLDOWN` (429) and `POOL_EXHAUSTED` (503) */
  retryAfter?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * `data` of the body of an `ApiError`: the REST API answers `{ error, data: { code, … } }`
 */
function getApiErrorData(error: ApiError): Record<string, unknown> {
  const data = error.cause?.data

  return isRecord(data) ? data : {}
}

/**
 * What an `ApiError` thrown by `fetchRequest` says: the REST API answers
 * `{ error, data: { code, … } }`; `SSH_COOLDOWN` carries `data.retryAfter`
 * (like the `Retry-After` header, which `fetchRequest` does not expose).
 */
export function parseDockerApiError(error: unknown): DockerApiErrorInfo {
  if (!(error instanceof ApiError)) {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  const { status, cause, message } = error
  const data = getApiErrorData(error)
  const { code, retryAfter } = data

  return {
    status,
    code: typeof code === 'string' ? code : undefined,
    message:
      typeof cause?.error === 'string' ? cause.error : typeof cause?.message === 'string' ? cause.message : message,
    retryAfter: typeof retryAfter === 'number' && retryAfter > 0 ? Math.ceil(retryAfter) : undefined,
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
 * The host key data of a 409 of `POST`/`PATCH /docker-engines`, if it is one
 */
export function getHostKeyErrorData(error: unknown): DockerHostKeyErrorData | undefined {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return undefined
  }

  const { code, fingerprint, expected, actual } = getApiErrorData(error)

  if (code === 'HOST_KEY_UNKNOWN' && typeof fingerprint === 'string') {
    return { code, fingerprint }
  }

  if (code === 'HOST_KEY_MISMATCH' && typeof expected === 'string' && typeof actual === 'string') {
    return { code, expected, actual }
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

// CSI sequences (colors, cursor moves) of a program writing to a terminal
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g

/**
 * Log entries as text, one line each: `<date> message`, with a `stderr` marker
 * on the error stream, the ANSI escape sequences removed
 */
export function formatDockerLogEntries(entries: XoDockerLogEntry[], formatDate: (date: Date) => string): string {
  return entries
    .map(({ timestamp, stream, message }) => {
      const date = timestamp === undefined ? '' : `${formatDate(new Date(timestamp))} `
      const marker = stream === 'stderr' ? '[stderr] ' : ''

      return `${date}${marker}${message.replace(ANSI_ESCAPE_RE, '')}`
    })
    .join('\n')
}
