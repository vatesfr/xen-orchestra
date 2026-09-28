import { createLogger } from '@xen-orchestra/log'
import type { HttpStatusCodeLiteral } from 'tsoa'

import { ApiError } from './error.helper.mjs'

const log = createLogger('xo:rest-api:docker')

/**
 * Shape of the `DockerError`s thrown by xo-server's Docker transport
 * (`@xen-orchestra/docker-ssh`, which is not a dependency of this package):
 * they are recognized by their name and string code.
 */
export type DockerErrorLike = Error & { code: string; data?: Record<string, unknown> }

export const isDockerError = (error: unknown): error is DockerErrorLike =>
  error instanceof Error && error.name === 'DockerError' && typeof (error as { code?: unknown }).code === 'string'

// the pool is full of busy connections: the client should retry soon
const POOL_EXHAUSTED_RETRY_AFTER = '5'

function getRetryAfter(error: DockerErrorLike): string | undefined {
  switch (error.code) {
    case 'POOL_EXHAUSTED':
      return POOL_EXHAUSTED_RETRY_AFTER
    case 'SSH_COOLDOWN': {
      const retryAfter = error.data?.retryAfter
      return String(typeof retryAfter === 'number' && retryAfter > 0 ? Math.ceil(retryAfter) : 1)
    }
  }
}

// Docker Engine API statuses of errors of the request: 400 bad parameter,
// 404 no such object, 409 conflict (e.g. already paused, in use)
const PASSED_THROUGH_STATUSES = new Set([400, 404, 409])

// the connection context added by xo-server to its errors: logged here, never
// sent to the client
const CONTEXT_FIELDS = new Set(['host', 'port', 'socketPath', 'path'])

// same as xo-server's `MAX_ERROR_MESSAGE_LENGTH`
const MAX_MESSAGE_LENGTH = 512

function truncateMessage(message: string): string {
  return message.length > MAX_MESSAGE_LENGTH ? message.slice(0, MAX_MESSAGE_LENGTH) + '…' : message
}

function getClientData(error: DockerErrorLike): Record<string, unknown> {
  const data = error.data ?? {}
  if (error.code === 'DOCKER_API_ERROR') {
    // written by the daemon: only what the client needs
    const { statusCode, message } = data
    return {
      code: error.code,
      statusCode: typeof statusCode === 'number' ? statusCode : undefined,
      message: typeof message === 'string' ? truncateMessage(message) : undefined,
    }
  }
  const clientData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!CONTEXT_FIELDS.has(key)) {
      clientData[key] = value
    }
  }
  clientData.code = error.code
  return clientData
}

function getStatus(error: DockerErrorLike): HttpStatusCodeLiteral {
  switch (error.code) {
    case 'HOST_KEY_UNKNOWN':
    case 'HOST_KEY_MISMATCH':
      return 409
    case 'TIMEOUT':
      return 504
    case 'SSH_COOLDOWN':
      // refused locally: a recent attempt with the same parameters failed
      return 429
    case 'POOL_EXHAUSTED':
    case 'CONNECTION_CLOSED':
      return 503
    case 'RAW_REQUEST_TOO_LARGE':
      // raw passthrough, docker.maxRawRequestSize
      return 413
    case 'DOCKER_API_ERROR': {
      const statusCode = error.data?.statusCode
      // errors of the request (e.g. 409 pausing a paused container) are passed
      // through, only the ones in the allowlist: a 401/407 from the daemon (or
      // a proxy in front of it) would make the browser prompt for credentials
      // and a 403 would look like a missing XO permission. Every other status
      // is the upstream's fault, `data.statusCode` keeps it.
      return typeof statusCode === 'number' && PASSED_THROUGH_STATUSES.has(statusCode)
        ? (statusCode as HttpStatusCodeLiteral)
        : 502
    }
    default:
      // SSH_* (including SSH_REFUSED_PENALTY), STREAM_LOCAL_*, DOCKER_SOCKET_UNREACHABLE,
      // DOCKER_API_VERSION_UNSUPPORTED…
      //
      // never 401 (`invalidCredentials`): the credentials rejected are the
      // Docker host's, not the XO user's, and a 401 would make the browser
      // prompt for XO credentials
      return 502
  }
}

/**
 * Convert a `DockerError` to an `ApiError` with the right HTTP status, other
 * errors are returned as is.
 *
 * `data.code` is the Docker error code. For `DOCKER_API_ERROR`, only the
 * upstream `statusCode` and the (truncated) `message` are added; for the
 * others, the properties of its `data` (e.g. the observed `fingerprint` of
 * `HOST_KEY_UNKNOWN`, the socket `diagnostic`) are kept, except the connection
 * context (`host`, `port`, `socketPath`, `path`), which is only logged. They
 * never contain secrets: xo-server scrubs them.
 */
export function toDockerApiError(error: unknown): unknown {
  if (!isDockerError(error)) {
    return error
  }
  const status = getStatus(error)
  const retryAfter = getRetryAfter(error)
  // the full error, with its context, stays in the server logs
  if (status >= 500) {
    log.warn(error.message, { error })
  } else {
    log.debug(error.message, { error })
  }
  const apiError = new ApiError(truncateMessage(error.message), status, {
    data: getClientData(error),
    headers: retryAfter === undefined ? undefined : { 'Retry-After': retryAfter },
  })
  apiError.cause = error
  return apiError
}

/**
 * Run `fn`, converting the `DockerError`s it throws, see `toDockerApiError()`.
 */
export async function withDockerErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw toDockerApiError(error)
  }
}

const SECRET_FIELDS = ['password', 'privateKey', 'passphrase'] as const
export const OBFUSCATED = '***obfuscated***'

/**
 * Copy of an engine create/update body safe to store in a task record: the
 * secrets are replaced by `OBFUSCATED` (clearing one, with `null` or `''`, is
 * kept as is).
 */
export function obfuscateDockerEngineParams<T extends object | undefined>(body: T): T {
  if (body === undefined) {
    return body
  }
  const params = { ...body } as Record<string, unknown>
  for (const key of SECRET_FIELDS) {
    const value = params[key]
    if (value !== undefined && value !== null && value !== '') {
      params[key] = OBFUSCATED
    }
  }
  return params as T
}
