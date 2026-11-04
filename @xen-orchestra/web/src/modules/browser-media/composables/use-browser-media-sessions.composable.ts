import {
  BROWSER_MEDIA_SOCKET_PATH,
  getBrowserMediaEndReason,
  getBrowserMediaRefusal,
  parseBrowserMediaMessage,
  readBrowserMediaBlock,
  type BrowserMediaEndReason,
  type BrowserMediaRefusal,
} from '@/modules/browser-media/utils/xo-browser-media.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import type { XoBrowserMediaSession, XoVm } from '@vates/types'
import { createGlobalState, useEventListener } from '@vueuse/core'
import { reactive } from 'vue'

// xo-server sends its session id right away: past it, the connection is stuck
const SESSION_TIMEOUT_MS = 30_000

export type LocalBrowserMediaStatus = 'connecting' | 'inserting' | 'inserted' | 'ejecting' | 'ended'

/** Why a session of this tab ended, unless it was cancelled or ejected from this tab. */
export type LocalBrowserMediaError = {
  reason: BrowserMediaEndReason | Exclude<BrowserMediaRefusal, 'unknown'> | 'read-failed' | 'eject-failed' | 'unknown'
  /** The message of the error, for the reasons that do not explain themselves */
  message?: string
}

/** An ISO served by this browser tab. */
export type LocalBrowserMedia = {
  vmId: XoVm['id']
  name: string
  size: number
  status: LocalBrowserMediaStatus
  /** Set once xo-server has created the session */
  sessionId?: XoBrowserMediaSession['id']
  error?: LocalBrowserMediaError
}

// a session whose ISO the VM may be reading: closing the tab would cut the VM from it
const SERVING_STATUSES: LocalBrowserMediaStatus[] = ['connecting', 'inserting', 'inserted', 'ejecting']

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && typeof error.cause?.error === 'string') {
    return error.cause.error
  }

  return (error as Error).message
}

/**
 * The ISOs served by this browser tab: they survive navigating within XO 6, but closing or reloading the tab ejects
 * them.
 */
export const useBrowserMediaSessions = createGlobalState(() => {
  const localSessions = reactive(new Map<XoVm['id'], LocalBrowserMedia>())

  // kept out of the reactive state: a proxied WebSocket cannot be used
  const sockets = new Map<XoVm['id'], WebSocket>()

  // xo-server sessions this tab ended: the polled list of xo-server may still have them for a while, e.g. while
  // xo-server undoes a cancelled insertion
  const endedSessionIds = reactive(new Set<XoBrowserMediaSession['id']>())

  function forget(session: LocalBrowserMedia) {
    if (session.sessionId !== undefined) {
      endedSessionIds.add(session.sessionId)
    }
  }

  function hasEnded(sessionId: XoBrowserMediaSession['id']) {
    return endedSessionIds.has(sessionId)
  }

  // asks for a confirmation, since it would eject the ISO from the VM
  useEventListener(window, 'beforeunload', event => {
    if ([...localSessions.values()].some(session => SERVING_STATUSES.includes(session.status))) {
      event.preventDefault()
    }
  })

  /** The session of this tab for `vmId`, the reactive version, so that its updates are tracked. */
  function getLocalSession(vmId: XoVm['id']) {
    return localSessions.get(vmId)
  }

  function isCurrent(session: LocalBrowserMedia) {
    return localSessions.get(session.vmId) === session
  }

  function closeSocket(vmId: XoVm['id']) {
    const socket = sockets.get(vmId)

    if (socket !== undefined) {
      sockets.delete(vmId)
      socket.close(1000)
    }
  }

  function fail(session: LocalBrowserMedia, error: LocalBrowserMediaError) {
    if (!isCurrent(session) || session.status === 'ended') {
      return
    }

    session.status = 'ended'
    session.error = error
    forget(session)
    closeSocket(session.vmId)
  }

  /**
   * Serve `file` to xo-server, and resolve with the id of its session.
   */
  function connect(session: LocalBrowserMedia, file: File) {
    const url = new URL(BROWSER_MEDIA_SOCKET_PATH, window.location.origin.replace(/^http/, 'ws'))
    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    sockets.set(session.vmId, socket)

    return new Promise<XoBrowserMediaSession['id']>((resolve, reject) => {
      const timeout = setTimeout(() => {
        fail(session, { reason: 'lost' })
        reject(new Error('xo-server did not answer in time'))
      }, SESSION_TIMEOUT_MS)

      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ name: file.name, size: file.size }))
      })

      socket.addEventListener('message', ({ data }) => {
        let message

        try {
          message = parseBrowserMediaMessage(data, file.size)
        } catch (error) {
          console.error('Invalid message from xo-server:', error)
          fail(session, { reason: 'protocol' })

          return
        }

        if (message.type === 'session') {
          clearTimeout(timeout)
          session.sessionId = message.sessionId as XoBrowserMediaSession['id']
          resolve(session.sessionId)

          return
        }

        readBrowserMediaBlock(file, message).then(
          reply => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(reply)
            }
          },
          // e.g. the file was moved or deleted meanwhile
          error => fail(session, { reason: 'read-failed', message: getErrorMessage(error) })
        )
      })

      socket.addEventListener('close', ({ code }) => {
        clearTimeout(timeout)
        reject(new Error('Connection closed by xo-server'))

        // not closed by this tab: ended by xo-server, or the connection was lost
        if (sockets.get(session.vmId) === socket) {
          sockets.delete(session.vmId)
          fail(session, { reason: getBrowserMediaEndReason(code) })
        }
      })
    })
  }

  /**
   * Serve `file` from this tab, and insert it in the CD drive of the VM.
   *
   * Resolves once it is inserted, or once the insertion is cancelled. Rejects if it fails: the session then ends, with
   * its error.
   */
  async function insert(vmId: XoVm['id'], file: File) {
    localSessions.set(vmId, { vmId, name: file.name, size: file.size, status: 'connecting' })
    const session = getLocalSession(vmId) as LocalBrowserMedia

    try {
      const sessionId = await connect(session, file)

      session.status = 'inserting'
      // synchronous, so that a refusal comes with its reason
      await fetchPost(`vms/${vmId}/actions/insert_browser_iso?sync=true`, { browserMediaId: sessionId })
    } catch (error) {
      if (!isCurrent(session)) {
        // cancelled meanwhile
        return
      }

      // a no-op if the session already ended with its own reason, e.g. xo-server closed the connection
      const refusal = getBrowserMediaRefusal(error)
      fail(
        session,
        refusal === 'unknown' ? { reason: 'unknown', message: getErrorMessage(error) } : { reason: refusal }
      )

      throw error
    }

    if (isCurrent(session) && session.status === 'inserting') {
      session.status = 'inserted'
    }
  }

  /** Stop serving an ISO which is not inserted yet: xo-server undoes what the insertion did so far. */
  function cancel(vmId: XoVm['id']) {
    const session = localSessions.get(vmId)

    if (session !== undefined) {
      forget(session)
    }

    closeSocket(vmId)
    localSessions.delete(vmId)
  }

  /**
   * Eject the ISO this tab serves, and wait for xo-server to release it.
   */
  async function eject(vmId: XoVm['id']) {
    const session = getLocalSession(vmId)

    if (session?.sessionId === undefined) {
      cancel(vmId)

      return
    }

    session.status = 'ejecting'
    session.error = undefined

    try {
      await fetchPost(`browser-media/${session.sessionId}/actions/eject?sync=true`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // already released by xo-server
      } else if (isCurrent(session)) {
        // kept, so that it can be retried while the tab still serves it
        session.status = sockets.has(vmId) ? 'inserted' : 'ended'
        session.error = { reason: 'eject-failed', message: getErrorMessage(error) }

        throw error
      }
    }

    if (isCurrent(session)) {
      forget(session)
      closeSocket(vmId)
      localSessions.delete(vmId)
    }
  }

  /** Once its error has been seen: forget a session which has ended, or only the error of a failed eject. */
  function dismiss(vmId: XoVm['id']) {
    const session = localSessions.get(vmId)

    if (session?.status === 'ended') {
      localSessions.delete(vmId)
    } else if (session !== undefined) {
      session.error = undefined
    }
  }

  return { localSessions, getLocalSession, hasEnded, insert, cancel, eject, dismiss }
})
