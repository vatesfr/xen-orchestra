import { serveBrowserMedia } from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { createGlobalState, useEventListener } from '@vueuse/core'
import { reactive } from 'vue'

export type BrowserMediaSessionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed'

export type BrowserMediaSession = {
  fileName: string
  status: BrowserMediaSessionStatus
  // set once xo-server has created the session
  id?: string
  error?: string
}

/**
 * The ISO is served by this browser tab: its sessions survive navigating within XO 6, but closing or reloading the tab
 * disconnects them.
 */
export const useBrowserMediaSessions = createGlobalState(() => {
  const sessions = reactive(new Map<FrontXoVm['id'], BrowserMediaSession>())

  // kept out of the reactive state: a proxied WebSocket cannot be used
  const sockets = new Map<FrontXoVm['id'], WebSocket>()

  // asks for a confirmation, as it would cut a VM from its ISO
  useEventListener(window, 'beforeunload', event => {
    if ([...sessions.values()].some(session => session.status === 'connected')) {
      event.preventDefault()
    }
  })

  function start(vmId: FrontXoVm['id'], fileName: string) {
    sessions.set(vmId, { fileName, status: 'connecting' })

    // the reactive version, so that updates are tracked
    return sessions.get(vmId) as BrowserMediaSession
  }

  function fail(vmId: FrontXoVm['id'], error: Error) {
    const session = sessions.get(vmId)

    if (session === undefined) {
      return
    }

    session.status = 'failed'
    session.error = error.message
    sockets.get(vmId)?.close()
  }

  async function serve(vmId: FrontXoVm['id'], socketPath: string, file: File) {
    const socket = await serveBrowserMedia(socketPath, file, error => fail(vmId, error))

    sockets.set(vmId, socket)

    socket.addEventListener('close', () => {
      sockets.delete(vmId)

      const session = sessions.get(vmId)

      if (session !== undefined && session.status !== 'failed') {
        session.status = 'disconnected'
      }
    })
  }

  /**
   * Also waits for xo-server to release the storage. A session xo-server already released is simply forgotten.
   */
  async function remove(vmId: FrontXoVm['id']) {
    const session = sessions.get(vmId)

    if (session === undefined) {
      return
    }

    sockets.get(vmId)?.close()

    if (session.id !== undefined) {
      try {
        await fetchDelete(`browser-media/${session.id}`)
      } catch (error) {
        if (!(error instanceof ApiError && error.status === HttpCodes.NotFound)) {
          // kept, so that it can be retried
          session.error = (error as Error).message
          throw error
        }
      }
    }

    sessions.delete(vmId)
  }

  return { sessions, start, serve, fail, remove }
})
