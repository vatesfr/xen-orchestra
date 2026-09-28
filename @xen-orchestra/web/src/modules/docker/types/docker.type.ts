import type { XoDockerContainer, XoDockerEngine, XoDockerEngineInfo } from '@vates/types'

/**
 * State of the Docker engine of a VM: the `status` of `GET /docker-engines/{id}/info`
 */
export const DOCKER_STATUS = {
  CONNECTED: 'connected',
  UNREACHABLE: 'unreachable',
  AUTH_FAILED: 'auth-failed',
  HOST_KEY_MISMATCH: 'host-key-mismatch',
} as const

/**
 * Restart policies making Docker restart a stopped container, hence a
 * confirmation before stopping it
 */
export type DockerStopConfirmedRestartPolicy = 'always' | 'unless-stopped'

export const dockerEngineFields = [
  'id',
  '$VM',
  '$pool',
  'label',
  'host',
  'resolvedHost',
  'port',
  'username',
  'socketPath',
  'hostKeyFingerprint',
  'hostKeyAlgorithm',
  'hasPassword',
  'hasPrivateKey',
  'connectionStatus',
  'error',
] as const satisfies readonly (keyof XoDockerEngine)[]

export type FrontXoDockerEngine = Pick<XoDockerEngine, (typeof dockerEngineFields)[number]>

export const dockerContainerFields = [
  'id',
  '$engine',
  '$VM',
  'dockerId',
  'name',
  'image',
  'command',
  'createdAt',
  'state',
  'status',
  'exitCode',
  'health',
  'ports',
  'labels',
  'compose',
  'networks',
  'mounts',
  'startedAt',
  'finishedAt',
  'oomKilled',
  'healthCheck',
  'restartPolicy',
  'restartCount',
  // only with `stats=true`
  'stats',
  'statsPending',
] as const satisfies readonly (keyof XoDockerContainer)[]

export type FrontXoDockerContainer = Pick<XoDockerContainer, (typeof dockerContainerFields)[number]>

export type FrontXoDockerEngineInfo = XoDockerEngineInfo

/**
 * Body of `POST /docker-engines`
 */
export type DockerEngineCreatePayload = {
  $VM: string
  host?: string
  port: number
  username: string
  privateKey: string
  passphrase?: string
  socketPath?: string
  hostKeyFingerprint?: string
}

/**
 * Body of `PATCH /docker-engines/{id}`: omitted secrets are kept
 */
export type DockerEngineUpdatePayload = Partial<Omit<DockerEngineCreatePayload, '$VM'>>

/**
 * `data` of the 409 answers of `POST`/`PATCH /docker-engines`
 */
export type DockerHostKeyErrorData =
  | { code: 'HOST_KEY_UNKNOWN'; fingerprint: string; algorithm?: string }
  | { code: 'HOST_KEY_MISMATCH'; expected: string; actual: string; algorithm?: string }
