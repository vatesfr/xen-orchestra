// Shared CHAP (RFC 1994) primitives for both login directions: the target as
// authenticator, the initiator as responder. Kept in one place so the MD5
// computation and large-binary codec agree byte-for-byte between the two
// (cross-tested against each other in loopback).
//
// RFC 7143 §11.1.4 pins CHAP to MD5 (algorithm id 5) — a wire-format
// requirement, not a security choice.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** The only CHAP algorithm iSCSI defines / we support: MD5 (RFC 7143 §11.1.4). */
export const CHAP_ALGORITHM_MD5 = 5

/** Default challenge length in bytes; 16 is what open-iscsi and most targets use. */
const DEFAULT_CHALLENGE_LENGTH = 16

/**
 * Compute a CHAP response: `MD5(id ‖ secret ‖ challenge)` (RFC 1994 §4.1).
 *
 * `id` is the single CHAP_I octet (0-255) — the raw byte, NOT its ASCII decimal.
 * `secret` is the shared secret (a string is hashed as its UTF-8 bytes).
 */
export function computeResponse(id: number, secret: string | Buffer, challenge: Buffer): Buffer {
  return createHash('md5')
    .update(Buffer.from([id & 0xff]))
    .update(secret)
    .update(challenge)
    .digest()
}

/**
 * Encode a binary value (CHAP_C / CHAP_R) as an iSCSI hex-constant, e.g.
 * `0xa1b2…` (RFC 7143 §5.1). We always emit hex; {@link decodeChapValue} accepts
 * both hex and base64 so we interoperate with peers that send either.
 */
export function encodeChapValue(value: Buffer): string {
  return '0x' + value.toString('hex')
}

/**
 * Decode an iSCSI large-binary value: `0x`/`0X` hex-constant or `0b`/`0B`
 * base64-constant (RFC 7143 §5.1). Throws on an unrecognized encoding.
 */
export function decodeChapValue(value: string): Buffer {
  const prefix = value.slice(0, 2)
  const body = value.slice(2)
  if (prefix === '0x' || prefix === '0X') {
    return Buffer.from(body, 'hex')
  }
  if (prefix === '0b' || prefix === '0B') {
    return Buffer.from(body, 'base64')
  }
  throw new Error(`unsupported CHAP value encoding: ${value.slice(0, 2)}…`)
}

/** Generate a random CHAP challenge (CHAP_C). */
export function generateChallenge(length: number = DEFAULT_CHALLENGE_LENGTH): Buffer {
  return randomBytes(length)
}

/** Generate a random CHAP identifier (CHAP_I), a single octet. */
export function generateId(): number {
  return randomBytes(1)[0]
}

/** Parse a CHAP_A value (`"5"` or a `"5,6,7"` preference list) into algorithm ids. */
export function parseAlgorithmList(value: string): number[] {
  return value
    .split(',')
    .map(part => Number.parseInt(part.trim(), 10))
    .filter(id => Number.isInteger(id))
}

/**
 * Pick the algorithm we will use from the ones the peer offered: MD5 if present,
 * else `undefined` (we only implement MD5, so an offer without it must fail —
 * never fall back to the first offered id).
 */
export function selectAlgorithm(offered: readonly number[]): number | undefined {
  return offered.includes(CHAP_ALGORITHM_MD5) ? CHAP_ALGORITHM_MD5 : undefined
}

/**
 * Constant-time comparison of an expected response against a received one. A
 * wrong-length `got` (or the length-mismatch `timingSafeEqual` would throw on)
 * counts as a failed authentication, not an exception.
 */
export function verifyResponse(expected: Buffer, got: Buffer): boolean {
  return expected.length === got.length && timingSafeEqual(expected, got)
}
