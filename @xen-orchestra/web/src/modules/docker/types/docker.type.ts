import type { XoDockerContainer, XoDockerEngine, XoDockerEngineInfo } from '@vates/types'

/**
 * Restart policies making Docker restart a stopped container, hence a
 * confirmation before stopping it
 */
export type DockerStopConfirmedRestartPolicy = 'always' | 'unless-stopped'

export const dockerEngineFields = [
  'id',
  'host',
  'resolvedHost',
  'port',
  'username',
  'socketPath',
  'hostKeyFingerprint',
  // state of the pooled connection: e.g. the container list failed on this engine
  'connectionStatus',
  'error',
] as const satisfies readonly (keyof XoDockerEngine)[]

export type FrontXoDockerEngine = Pick<XoDockerEngine, (typeof dockerEngineFields)[number]>

export const dockerContainerFields = [
  'id',
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
  'healthCheck',
  'restartPolicy',
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
 * Body of `PATCH /docker-engines/{id}`: omitted secrets are kept, a `null`
 * `hostKeyFingerprint` unpins the host key
 */
export type DockerEngineUpdatePayload = Partial<Omit<DockerEngineCreatePayload, '$VM' | 'hostKeyFingerprint'>> & {
  hostKeyFingerprint?: string | null
}

/**
 * `data` of the 409 answers of `POST`/`PATCH /docker-engines`
 */
export type DockerHostKeyErrorData =
  | { code: 'HOST_KEY_UNKNOWN'; fingerprint: string }
  | { code: 'HOST_KEY_MISMATCH'; expected: string; actual: string }
