// Cooldown of the SSH attempts which failed in a way that OpenSSH (>= 9.8)
// penalizes with PerSourcePenalties: authentication failures, and handshakes
// aborted before authentication (host key refused, connection lost…).
//
// Too many of them in a short window make the SSH server refuse every
// connection from XO's address, for all the engines behind it. After such a
// failure, new manual attempts (create, update, test) with the *same*
// parameters are refused locally for `cooldown` ms (SSH_COOLDOWN); changing
// the parameters (e.g. fixing the key) is allowed right away.
//
// It also recognizes the symptom of a penalty: the server closing the
// connection before the handshake (`Connection lost before handshake`) soon
// after failures from XO → SSH_REFUSED_PENALTY with a hint.
//
// Keys are opaque strings (e.g. `engine:<id>`, `target:<host>:<port>`), the
// identity is an opaque hash of the attempt's parameters.

import {
  DockerError,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  isDockerError,
  SSH_AUTH_FAILED,
  SSH_COOLDOWN,
  SSH_ERROR,
  SSH_REFUSED_PENALTY,
} from './errors.mjs'

export const DEFAULT_COOLDOWN = 10e3
// OpenSSH's default maximum penalty (`PerSourcePenalties max:600`)
export const DEFAULT_PENALTY_WINDOW = 10 * 60e3

// errors which, raised while connecting, arm the cooldown
const TRIGGER_CODES = new Set([HOST_KEY_MISMATCH, HOST_KEY_UNKNOWN, SSH_AUTH_FAILED, SSH_ERROR, SSH_REFUSED_PENALTY])

const PENALTY_HINT =
  'the SSH server closed the connection before the handshake: the SSH server may be temporarily refusing this address (OpenSSH PerSourcePenalties), after recent failed attempts from XO'

const isHandshakeLoss = (error: unknown): boolean =>
  isDockerError(error) &&
  error.code === SSH_ERROR &&
  typeof error.cause?.message === 'string' &&
  error.cause.message.startsWith('Connection lost before handshake')

export class SshCooldown {
  #cooldown: number
  // key → { identity, code, until }
  #entries = new Map<string, { identity: string; code: string; until: number }>()
  // key → time of the last failure (any identity)
  #lastFailures = new Map<string, number>()
  #now: () => number
  #penaltyWindow: number

  /**
   * @param opts.cooldown ms, 0 disables the refusal (not the SSH_REFUSED_PENALTY mapping)
   * @param opts.penaltyWindow ms after a failure during which a lost handshake is reported as SSH_REFUSED_PENALTY
   * @param opts.now for tests
   */
  constructor({
    cooldown = DEFAULT_COOLDOWN,
    penaltyWindow = DEFAULT_PENALTY_WINDOW,
    now = Date.now,
  }: { cooldown?: number; penaltyWindow?: number; now?: () => number } = {}) {
    this.#cooldown = cooldown
    this.#penaltyWindow = penaltyWindow
    this.#now = now
  }

  /** number of tracked keys, for tests */
  get size(): number {
    return new Set([...this.#entries.keys(), ...this.#lastFailures.keys()]).size
  }

  #prune(now: number) {
    for (const [key, entry] of this.#entries) {
      if (entry.until <= now) {
        this.#entries.delete(key)
      }
    }
    for (const [key, time] of this.#lastFailures) {
      if (time + this.#penaltyWindow <= now) {
        this.#lastFailures.delete(key)
      }
    }
  }

  /**
   * @throws {DockerError} SSH_COOLDOWN if one of the keys failed recently with the same identity
   */
  check(keys: string[], identity: string): void {
    const now = this.#now()
    this.#prune(now)
    let until = 0
    let code: string | undefined
    for (const key of keys) {
      const entry = this.#entries.get(key)
      if (entry !== undefined && entry.identity === identity && entry.until > until) {
        until = entry.until
        code = entry.code
      }
    }
    if (until !== 0) {
      const retryAfter = Math.max(1, Math.ceil((until - now) / 1e3))
      throw new DockerError(
        SSH_COOLDOWN,
        `a recent SSH attempt with the same parameters failed (${code}): retry in ${retryAfter} s, or change the parameters`,
        { data: { lastCode: code, retryAt: until, retryAfter } }
      )
    }
  }

  /**
   * Record a connection failure, and convert it if it looks like a penalty.
   *
   * @returns the error to throw instead of `error`
   */
  onFailure<E>(keys: string[], identity: string, error: E): E | DockerError {
    if (!isDockerError(error) || !TRIGGER_CODES.has(error.code) || error.data?.failFast) {
      return error
    }
    const now = this.#now()
    this.#prune(now)
    let result: DockerError = error
    if (isHandshakeLoss(error) && keys.some(key => this.#lastFailures.has(key))) {
      result = new DockerError(SSH_REFUSED_PENALTY, PENALTY_HINT, { data: error.data, cause: error.cause })
    }
    for (const key of keys) {
      this.#lastFailures.set(key, now)
      if (this.#cooldown > 0) {
        this.#entries.set(key, { identity, code: result.code, until: now + this.#cooldown })
      }
    }
    return result
  }

  /**
   * Forget the cooldown of keys after a success (not the failure history: a
   * penalty may still be running for other parameters).
   */
  clear(keys: string[]): void {
    for (const key of keys) {
      this.#entries.delete(key)
    }
  }
}
