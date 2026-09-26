import { ApiError } from '@/shared/error/api.error.ts'

// must match xo-server's limit
const MAX_READ_LENGTH = 1024 * 1024
const MAX_READ_ID = 0xffffffff
const READY_TIMEOUT_MS = 15_000

export type BrowserMediaReadRequest = {
  id: number
  offset: number
  length: number
}

/**
 * xo-server sends `{ "ready": true }` once, then read requests `{ id, offset, length }`.
 *
 * @throws if the message is neither, or asks for bytes outside the file
 */
export function parseBrowserMediaMessage(message: string, fileSize: number): BrowserMediaReadRequest | 'ready' {
  const { ready, id, offset, length } = JSON.parse(message)

  if (ready === true) {
    return 'ready'
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

  return { id, offset, length }
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

/**
 * Connect to xo-server and serve `file` until the socket closes.
 *
 * Resolves once xo-server is ready to read. Afterwards, an invalid request or a failed read closes the socket and is
 * reported to `onError`.
 */
export function serveBrowserMedia(socketPath: string, file: Blob, onError: (error: Error) => void) {
  const url = new URL(socketPath, window.location.origin.replace(/^http/, 'ws'))
  const socket = new WebSocket(url)

  return new Promise<WebSocket>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.close()
      reject(new Error('xo-server did not get ready in time'))
    }, READY_TIMEOUT_MS)

    socket.addEventListener('close', () => {
      clearTimeout(timeout)
      reject(new Error('Connection closed by xo-server'))
    })

    socket.addEventListener('message', async ({ data }) => {
      try {
        const request = parseBrowserMediaMessage(data, file.size)

        if (request === 'ready') {
          clearTimeout(timeout)
          resolve(socket)

          return
        }

        const reply = await readBrowserMediaBlock(file, request)

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(reply)
        }
      } catch (error) {
        socket.close()
        onError(error as Error)
      }
    })
  })
}

export type BrowserMediaErrorReason = 'cd-not-empty' | 'cd-drive-requires-halted-vm' | 'unknown'

/**
 * xo-server reports refused attachments as `incorrect state` errors: their `data` tells which check failed.
 */
export function getBrowserMediaErrorReason(error: unknown): BrowserMediaErrorReason {
  if (!(error instanceof ApiError)) {
    return 'unknown'
  }

  const data = error.cause?.data as { property?: string; expected?: unknown } | undefined

  if (data?.property === 'empty') {
    return 'cd-not-empty'
  }

  if (data?.property === 'power_state' && data.expected === 'Halted') {
    return 'cd-drive-requires-halted-vm'
  }

  return 'unknown'
}
