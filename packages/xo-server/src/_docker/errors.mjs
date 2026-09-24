// Error codes of the Docker transport (SSH → docker.sock).
//
// They are stable identifiers meant to be consumed by the API/UI, the message
// is only informative.

export const SSH_AUTH_FAILED = 'SSH_AUTH_FAILED'
export const SSH_UNREACHABLE = 'SSH_UNREACHABLE'
// generic SSH failure which does not fit in a more specific code (protocol
// error, handshake failure, disconnection by the server…)
export const SSH_ERROR = 'SSH_ERROR'
// the SSH server closed the connection before the handshake shortly after
// other failures from XO: probably OpenSSH's PerSourcePenalties (>= 9.8)
// refusing XO's address for a while
export const SSH_REFUSED_PENALTY = 'SSH_REFUSED_PENALTY'
// refused locally, without connecting: a recent attempt with the same
// parameters failed (authentication, host key, handshake), see
// `docker.authFailureCooldown`; `data.retryAfter` is in seconds
export const SSH_COOLDOWN = 'SSH_COOLDOWN'
export const HOST_KEY_UNKNOWN = 'HOST_KEY_UNKNOWN'
export const HOST_KEY_MISMATCH = 'HOST_KEY_MISMATCH'
export const STREAM_LOCAL_FORWARDING_DISABLED = 'STREAM_LOCAL_FORWARDING_DISABLED'
export const DOCKER_SOCKET_UNREACHABLE = 'DOCKER_SOCKET_UNREACHABLE'
// the SSH server is not (detected as) OpenSSH, `direct-streamlocal@openssh.com`
// cannot be used
export const STREAM_LOCAL_UNSUPPORTED = 'STREAM_LOCAL_UNSUPPORTED'
export const DOCKER_API_ERROR = 'DOCKER_API_ERROR'
export const DOCKER_API_VERSION_UNSUPPORTED = 'DOCKER_API_VERSION_UNSUPPORTED'
export const TIMEOUT = 'TIMEOUT'
export const POOL_EXHAUSTED = 'POOL_EXHAUSTED'
// the request was interrupted (or never sent) because `close()` was called
export const CONNECTION_CLOSED = 'CONNECTION_CLOSED'

// SSH_MSG_CHANNEL_OPEN_FAILURE reason codes (RFC 4254 § 5.1)
export const SSH_OPEN_ADMINISTRATIVELY_PROHIBITED = 1
export const SSH_OPEN_CONNECT_FAILED = 2

// keys which must never end up in an error (data or cause)
const SENSITIVE_KEYS = new Set(['passphrase', 'password', 'privateKey', 'authHandler', 'agent', 'sock'])

/**
 * Returns a shallow copy of `value` without any sensitive entries.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function scrub(value) {
  if (value === null || typeof value !== 'object' || Buffer.isBuffer(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(scrub)
  }
  const result = {}
  for (const key of Object.keys(value)) {
    if (!SENSITIVE_KEYS.has(key)) {
      result[key] = scrub(value[key])
    }
  }
  return result
}

/**
 * Copy of an ssh2 error that only keeps the fields useful for diagnosis.
 *
 * ssh2 errors do not reference the connection config in this version but
 * nothing prevents a future version (or some intermediate code) to attach it,
 * so rebuild a clean error instead of keeping the original object.
 *
 * @param {unknown} error
 * @returns {Error | undefined}
 */
function sanitizeCause(error) {
  if (error === undefined || error === null) {
    return undefined
  }
  if (!(error instanceof Error)) {
    return new Error(String(error))
  }
  const copy = new Error(error.message)
  copy.name = error.name
  copy.stack = error.stack
  for (const key of ['code', 'level', 'reason', 'description', 'errno', 'syscall', 'address', 'port', 'fatal']) {
    if (error[key] !== undefined) {
      copy[key] = error[key]
    }
  }
  if (error.cause !== undefined) {
    copy.cause = sanitizeCause(error.cause)
  }
  return copy
}

export class DockerError extends Error {
  /**
   * @param {string} code one of the exported codes
   * @param {string} message
   * @param {{ data?: object, cause?: unknown }} [opts]
   */
  constructor(code, message, { data, cause } = {}) {
    const sanitizedCause = sanitizeCause(cause)
    super(message, sanitizedCause === undefined ? undefined : { cause: sanitizedCause })
    this.name = 'DockerError'
    this.code = code
    if (data !== undefined) {
      this.data = scrub(data)
    }
  }
}

/**
 * @param {unknown} error
 * @returns {error is DockerError}
 */
export const isDockerError = error => error instanceof DockerError

const isAbortOrTimeout = error => error?.name === 'AbortError' || error?.name === 'TimeoutError'

/**
 * Convert an error raised by ssh2 (or by the transport around it) to a
 * DockerError.
 *
 * Already converted errors are returned as is.
 *
 * @param {unknown} error
 * @param {{ host?: string, port?: number, socketPath?: string }} [context] non-sensitive context added to `data`
 * @returns {DockerError}
 */
export function fromSshError(error, context = {}) {
  if (isDockerError(error)) {
    return error
  }

  const data = { ...context }

  if (isAbortOrTimeout(error)) {
    return new DockerError(TIMEOUT, 'operation timed out or was aborted', { data, cause: error })
  }

  const level = error?.level
  if (level === 'client-authentication') {
    return new DockerError(SSH_AUTH_FAILED, 'SSH authentication failed', { data, cause: error })
  }
  if (level === 'client-timeout') {
    // either the ready timeout (connect + handshake + auth) or the keepalive
    // timeout
    return new DockerError(SSH_UNREACHABLE, 'SSH server did not answer in time', { data, cause: error })
  }
  if (level === 'client-socket' || level === 'client-dns') {
    return new DockerError(SSH_UNREACHABLE, 'SSH server is unreachable', { data, cause: error })
  }

  // channel open failure, see onChannelOpenFailure() in ssh2/lib/utils.js
  //
  // `reason` is the numeric code from SSH_MSG_CHANNEL_OPEN_FAILURE, or `''`
  // when the server closed the channel instead of answering. The server's
  // description is only available in the message (no dedicated property).
  const reason = error?.reason
  if (reason !== undefined) {
    data.reason = reason
    data.description = String(error.message).replace(/^\(SSH\) Channel open failure: /, '')
    if (reason === SSH_OPEN_ADMINISTRATIVELY_PROHIBITED) {
      return new DockerError(
        STREAM_LOCAL_FORWARDING_DISABLED,
        'stream local forwarding is disabled on the SSH server',
        {
          data,
          cause: error,
        }
      )
    }
    if (reason === SSH_OPEN_CONNECT_FAILED) {
      // OpenSSH (checked with 10.0) answers CONNECT_FAILED with the
      // description `open failed` in every case: missing socket, permission
      // denied, *and* AllowStreamLocalForwarding/DisableForwarding (in
      // serverloop.c, `reason` keeps its CONNECT_FAILED default for
      // `direct-streamlocal@openssh.com`), so the cause cannot be
      // distinguished from the client side.
      //
      // ADMINISTRATIVELY_PROHIBITED is still handled above for other servers.
      return new DockerError(
        DOCKER_SOCKET_UNREACHABLE,
        'cannot open the Docker socket through SSH (missing socket, missing permission, or stream local forwarding disabled)',
        { data, cause: error }
      )
    }
    return new DockerError(SSH_ERROR, 'SSH channel open failure', { data, cause: error })
  }

  // thrown synchronously by `Client#connect()` when the key cannot be used
  // (unparsable, wrong passphrase…), the message does not contain the key
  if (
    typeof error?.message === 'string' &&
    (error.message.startsWith('Cannot parse privateKey') || error.message.startsWith('privateKey value does not'))
  ) {
    return new DockerError(SSH_AUTH_FAILED, 'the SSH private key cannot be used', { data, cause: error })
  }

  if (typeof error?.message === 'string' && error.message.startsWith('strictVendor enabled')) {
    return new DockerError(STREAM_LOCAL_UNSUPPORTED, 'the SSH server does not support stream local forwarding', {
      data,
      cause: error,
    })
  }

  return new DockerError(SSH_ERROR, 'SSH error', { data, cause: error })
}
