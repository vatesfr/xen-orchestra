import { fetchDelete, fetchPost } from '@/shared/utils/fetch.util.ts'
import { shallowReactive } from 'vue'

type Session = {
  name: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  id?: string
  socket?: WebSocket
  error?: string
  disconnecting?: boolean
}

// Tab-owned: navigating between VM pages must not interrupt an installation.
export const browserMediaSessions = shallowReactive(new Map<string, Session>())

function errorMessage(error: unknown) {
  const cause = (error as { cause?: { message?: string } })?.cause
  return cause?.message ?? (error instanceof Error ? error.message : String(error))
}

export async function connectBrowserMedia(vmId: string, file: File) {
  if (browserMediaSessions.has(vmId)) return
  const state = shallowReactive<Session>({ name: file.name, status: 'connecting' })
  browserMediaSessions.set(vmId, state)
  try {
    if (file.size < 32768 || file.size % 512 !== 0 || file.size > 128 * 1024 ** 3) {
      throw new Error('Choose a sector-aligned ISO between 32 KiB and 128 GiB.')
    }
    const session = await fetchPost<{ id: string; socket: string }>('browser-media', {
      id: vmId,
      name: file.name,
      size: file.size,
    })
    state.id = session.id
    const socket = new WebSocket(new URL(session.socket, window.location.origin.replace(/^http/, 'ws')))
    state.socket = socket
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error('Connection timed out'))
        socket.close()
      }, 15000)
      socket.onerror = () => {
        clearTimeout(timer)
        reject(new Error('Cannot connect virtual media'))
      }
      socket.onclose = () => {
        clearTimeout(timer)
        if (state.status !== 'error') state.status = 'disconnected'
        reject(new Error('Media disconnected'))
      }
      socket.onmessage = async ({ data }) => {
        try {
          const request = JSON.parse(data)
          if (request.ready) {
            clearTimeout(timer)
            resolve()
            return
          }
          const { id, offset, length } = request
          if (
            !Number.isInteger(id) ||
            id < 0 ||
            id > 0xffffffff ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            !Number.isInteger(length) ||
            length < 1 ||
            length > 1024 * 1024 ||
            offset + length > file.size
          )
            throw new Error('Invalid media read')
          const bytes = await file.slice(offset, offset + length).arrayBuffer()
          if (bytes.byteLength !== length) throw new Error('Short media read')
          const reply = new Uint8Array(length + 4)
          new DataView(reply.buffer).setUint32(0, id)
          reply.set(new Uint8Array(bytes), 4)
          if (socket.readyState === WebSocket.OPEN) socket.send(reply)
        } catch (error) {
          state.error = errorMessage(error)
          state.status = 'error'
          socket.close()
        }
      }
    })
    await fetchPost(`browser-media/${session.id}/attach`)
    if (socket.readyState !== WebSocket.OPEN) throw new Error('Media disconnected')
    state.status = 'connected'
  } catch (error) {
    state.status = 'error'
    state.error = errorMessage(error)
    state.socket?.close()
    if (state.id !== undefined) fetchDelete(`browser-media/${state.id}`).catch(() => {})
  }
}

export async function disconnectBrowserMedia(vmId: string) {
  const state = browserMediaSessions.get(vmId)
  if (state === undefined || state.disconnecting) return
  state.disconnecting = true
  state.socket?.close()
  try {
    if (state.id !== undefined && state.status !== 'error' && state.status !== 'disconnected') {
      await fetchDelete(`browser-media/${state.id}`)
    }
    browserMediaSessions.delete(vmId)
  } catch (error) {
    state.status = 'error'
    state.error = errorMessage(error)
  } finally {
    state.disconnecting = false
  }
}
