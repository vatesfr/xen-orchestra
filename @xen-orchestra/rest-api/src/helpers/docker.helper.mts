import type { HttpStatusCodeLiteral } from 'tsoa'

import { ApiError } from './error.helper.mjs'

/**
 * Shape of the `DockerError`s thrown by xo-server's Docker transport
 * (`packages/xo-server/src/_docker/errors.mjs`), which cannot be imported
 * here: they are recognized by their name and string code.
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
    case 'DOCKER_API_ERROR': {
      const statusCode = error.data?.statusCode
      // errors of the request (e.g. 409 pausing a paused container) are passed
      // through, errors of the daemon are the upstream's fault
      return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
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
 * `data.code` is the Docker error code, the other properties of its `data`
 * (e.g. the observed `fingerprint` of `HOST_KEY_UNKNOWN`, the socket
 * `diagnostic`) are kept. They never contain secrets: xo-server scrubs them.
 */
export function toDockerApiError(error: unknown): unknown {
  if (!isDockerError(error)) {
    return error
  }
  const retryAfter = getRetryAfter(error)
  const apiError = new ApiError(error.message, getStatus(error), {
    data: { ...error.data, code: error.code },
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
