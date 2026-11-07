// available since Node 22
/* global WebSocket */

import { once } from 'node:events'

/**
 * Minimal client of the XO JSON-RPC API (WebSocket on `/api/`), available in all XO versions
 *
 * @param {string} xoUrl e.g. http://localhost
 * @returns {Promise<{ call(method: string, params?: object): Promise<unknown>, close(): void }>}
 */
export async function connectXo(xoUrl) {
  const url = new URL('/api/', xoUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  const socket = new WebSocket(url)
  const pending = new Map()
  let nextId = 0

  socket.addEventListener('message', ({ data }) => {
    const { id, error, result } = JSON.parse(data)
    const callbacks = pending.get(id)
    if (callbacks === undefined) {
      // notifications (events) are ignored
      return
    }
    pending.delete(id)
    if (error === undefined) {
      callbacks.resolve(result)
    } else {
      callbacks.reject(Object.assign(new Error(error.message), { code: error.code, data: error.data }))
    }
  })
  socket.addEventListener('close', () => {
    for (const { reject } of pending.values()) {
      reject(new Error('connection to XO closed'))
    }
    pending.clear()
  })

  const [event] = await Promise.race([once(socket, 'open'), once(socket, 'error')])
  if (event.type === 'error') {
    throw new Error(`cannot connect to ${url}`, { cause: event.error })
  }

  return {
    call(method, params = {}) {
      const id = nextId++
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }))
      })
    },
    close() {
      socket.close()
    },
  }
}
