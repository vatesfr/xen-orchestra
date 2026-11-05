import { ApiError } from '@/shared/error/api.error.ts'

// must match xo-server's limits
const MAX_READ_LENGTH = 1024 * 1024
const MAX_READ_ID = 0xffffffff
const SECTOR_SIZE = 512
const MIN_ISO_SIZE = 32 * 1024
const MAX_ISO_SIZE = 128 * 1024 ** 3

// codes xo-server closes the WebSocket with
const CLOSE_INVALID = 4400
const CLOSE_IDLE = 4408
const CLOSE_EJECTED = 4410
const CLOSE_UNAVAILABLE = 4503

export const BROWSER_MEDIA_SOCKET_PATH = '/api/browser-media'

export function isValidIsoSize(size: number) {
  return size >= MIN_ISO_SIZE && size <= MAX_ISO_SIZE && size % SECTOR_SIZE === 0
}

export type BrowserMediaReadRequest = {
  id: number
  offset: number
  length: number
}

export type BrowserMediaMessage = { type: 'session'; sessionId: string } | ({ type: 'read' } & BrowserMediaReadRequest)

/**
 * xo-server first sends `{ "session": string }`, then read requests `{ id, offset, length }`.
 *
 * @throws if the message is neither, or asks for bytes outside the file
 */
export function parseBrowserMediaMessage(message: unknown, fileSize: number): BrowserMediaMessage {
  if (typeof message !== 'string') {
    throw new Error('Unexpected binary message')
  }

  const { session, id, offset, length } = JSON.parse(message) ?? {}

  if (typeof session === 'string' && session !== '') {
    return { type: 'session', sessionId: session }
  }

  if (
    !Number.isInteger(id) ||
    id < 0 ||
    id > MAX_READ_ID ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(length) ||
    length < 1 ||
    length > MAX_READ_LENGTH ||
    offset + length > fileSize
  ) {
    throw new Error('Invalid read request')
  }

  return { type: 'read', id, offset, length }
}

/**
 * The reply is binary: the request id as a big-endian uint32, followed by the requested bytes.
 */
export async function readBrowserMediaBlock(file: Blob, { id, offset, length }: BrowserMediaReadRequest) {
  const bytes = await file.slice(offset, offset + length).arrayBuffer()

  if (bytes.byteLength !== length) {
    throw new Error('Short read')
  }

  const reply = new Uint8Array(length + 4)
  new DataView(reply.buffer).setUint32(0, id)
  reply.set(new Uint8Array(bytes), 4)

  return reply
}

/** Why xo-server ended a session, from the close code of its WebSocket. */
export type BrowserMediaEndReason = 'ejected' | 'idle' | 'unavailable' | 'protocol' | 'lost'

export function getBrowserMediaEndReason(code: number): BrowserMediaEndReason {
  switch (code) {
    case CLOSE_EJECTED:
      return 'ejected'
    case CLOSE_IDLE:
      return 'idle'
    case CLOSE_UNAVAILABLE:
      return 'unavailable'
    case CLOSE_INVALID:
      return 'protocol'
    default:
      // e.g. 1006: the connection was lost, or refused before it was established
      return 'lost'
  }
}

/** Why xo-server refused to insert the ISO, when it is a known reason. */
export type BrowserMediaRefusal =
  | 'cd-not-empty'
  | 'cd-drive-requires-halted-vm'
  | 'bad-power-state'
  | 'high-availability'
  | 'unknown'

/**
 * xo-server reports refused insertions as `incorrect state` errors: their `data` tells which check failed.
 */
export function getBrowserMediaRefusal(error: unknown): BrowserMediaRefusal {
  if (!(error instanceof ApiError)) {
    return 'unknown'
  }

  const data = error.cause?.data as { property?: string; expected?: unknown } | undefined

  switch (data?.property) {
    case 'empty':
      return 'cd-not-empty'
    case 'high_availability':
      return 'high-availability'
    case 'power_state':
      return data.expected === 'Halted' ? 'cd-drive-requires-halted-vm' : 'bad-power-state'
    default:
      return 'unknown'
  }
}
