import { useBrowserMediaSessionsStore } from '@/modules/browser-media/stores/browser-media-sessions.store.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import type { XoBrowserMediaSession, XoVm } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const VM_ID = 'vm-1' as XoVm['id']
const SESSION_ID = 'session-1' as XoBrowserMediaSession['id']
const ISO_SIZE = 64 * 1024

/** The connection to xo-server: what the store sends, and what xo-server answers. */
class FakeWebSocket extends EventTarget {
  static readonly OPEN = 1

  static last: FakeWebSocket | undefined

  readyState = FakeWebSocket.OPEN
  binaryType = 'blob'
  send = vi.fn()

  close = vi.fn(() => this.#close(1000))

  constructor(readonly url: URL) {
    super()
    FakeWebSocket.last = this
  }

  open() {
    this.dispatchEvent(new Event('open'))
  }

  receive(message: object) {
    this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(message) }))
  }

  closeFromServer(code: number) {
    this.#close(code)
  }

  #close(code: number) {
    this.readyState = 3
    this.dispatchEvent(Object.assign(new Event('close'), { code }))
  }
}

vi.stubGlobal('WebSocket', FakeWebSocket)

function setup() {
  setActivePinia(createPinia())

  return useBrowserMediaSessionsStore()
}

/** Starts an insertion, up to xo-server announcing its session: `requestInsertion` decides what happens next. */
async function startInsertion(store: ReturnType<typeof setup>, requestInsertion = vi.fn(async () => {})) {
  const file = new File([new Uint8Array(ISO_SIZE)], 'debian.iso')
  const insertion = store.insert(VM_ID, file, requestInsertion)
  // it may fail before the test awaits it
  insertion.catch(() => {})

  const socket = FakeWebSocket.last!
  socket.open()
  socket.receive({ session: SESSION_ID })
  await flushPromises()

  return { insertion, socket, requestInsertion }
}

describe('insert', () => {
  it('announces the ISO to xo-server, then asks for its insertion with the session of xo-server', async () => {
    const store = setup()

    const { insertion, socket, requestInsertion } = await startInsertion(store)
    await insertion

    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({ name: 'debian.iso', size: ISO_SIZE })
    expect(requestInsertion).toHaveBeenCalledWith(SESSION_ID)
    expect(store.getLocalSession(VM_ID)).toMatchObject({ status: 'inserted', sessionId: SESSION_ID })
    expect(store.getLocalSession(VM_ID)?.insertedAt).toBeTypeOf('number')
  })

  it('answers the reads of xo-server and counts the bytes read', async () => {
    const store = setup()
    const { insertion, socket } = await startInsertion(store)
    await insertion

    socket.receive({ id: 7, offset: 0, length: 2048 })
    await vi.waitFor(() => expect(socket.send).toHaveBeenCalledTimes(2))

    // 4 bytes of request id, then the requested bytes
    expect((socket.send.mock.calls[1][0] as Uint8Array).byteLength).toBe(4 + 2048)
    expect(store.getLocalSession(VM_ID)?.bytesRead).toBe(2048)
  })

  it('ends with the reason xo-server refused the insertion for', async () => {
    const store = setup()
    const refusal = new ApiError('Conflict', {
      status: 409,
      cause: { error: 'incorrect state', data: { property: 'empty', expected: true } },
    })

    const { insertion, socket } = await startInsertion(
      store,
      vi.fn(() => Promise.reject(refusal))
    )

    await expect(insertion).rejects.toBe(refusal)
    expect(store.getLocalSession(VM_ID)).toMatchObject({ status: 'ended', error: { reason: 'cd-not-empty' } })
    expect(socket.close).toHaveBeenCalled()
  })

  it('ends with the reason xo-server closed the connection for', async () => {
    const store = setup()
    const { insertion, socket } = await startInsertion(store)
    await insertion

    socket.closeFromServer(4408)

    expect(store.getLocalSession(VM_ID)).toMatchObject({ status: 'ended', error: { reason: 'idle' } })
    expect(store.hasEnded(SESSION_ID)).toBe(true)
  })
})

describe('cancel', () => {
  it('stops serving the ISO, and ignores the outcome of the insertion', async () => {
    const store = setup()
    let rejectInsertion!: (error: Error) => void
    const { insertion, socket } = await startInsertion(
      store,
      vi.fn(() => new Promise<void>((_resolve, reject) => (rejectInsertion = reject)))
    )

    store.cancel(VM_ID)
    rejectInsertion(new Error('the browser disconnected during the insertion'))

    await expect(insertion).resolves.toBeUndefined()
    expect(socket.close).toHaveBeenCalled()
    expect(store.getLocalSession(VM_ID)).toBeUndefined()
    expect(store.hasEnded(SESSION_ID)).toBe(true)
  })
})

describe('eject', () => {
  it('forgets the session once xo-server has released it', async () => {
    const store = setup()
    const { insertion, socket } = await startInsertion(store)
    await insertion
    const requestEject = vi.fn(async () => {})

    await store.eject(VM_ID, requestEject)

    expect(requestEject).toHaveBeenCalledWith(SESSION_ID)
    expect(socket.close).toHaveBeenCalled()
    expect(store.getLocalSession(VM_ID)).toBeUndefined()
    expect(store.hasEnded(SESSION_ID)).toBe(true)
  })

  it('keeps serving the ISO when the ejection fails, so that it can be retried', async () => {
    const store = setup()
    const { insertion } = await startInsertion(store)
    await insertion

    await expect(store.eject(VM_ID, () => Promise.reject(new Error('VDI in use')))).rejects.toThrow('VDI in use')

    expect(store.getLocalSession(VM_ID)).toMatchObject({
      status: 'inserted',
      error: { reason: 'eject-failed', message: 'VDI in use' },
    })
  })
})

describe('dismiss', () => {
  it('forgets a session which has ended', async () => {
    const store = setup()
    const { insertion, socket } = await startInsertion(store)
    await insertion
    socket.closeFromServer(4410)

    store.dismiss(VM_ID)

    expect(store.getLocalSession(VM_ID)).toBeUndefined()
  })
})

describe('closing the tab', () => {
  it('asks for a confirmation while an ISO is served', async () => {
    const store = setup()
    const { insertion } = await startInsertion(store)
    await insertion

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })
})
