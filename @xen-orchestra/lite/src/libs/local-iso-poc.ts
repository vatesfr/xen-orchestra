import { reactive } from 'vue'

type State = { name: string; status: string; id?: string; token?: string; bytes: number; stopped: boolean }
export const mediaSessions = reactive(new Map<string, State>())
const host = import.meta.env.PROD ? window.location.origin : import.meta.env.VITE_XO_HOST

async function request(action: string, session: string, body: unknown) {
  const response = await fetch(
    `${host}/services/plugin/xolite-media-poc/${action}?session_id=${encodeURIComponent(session)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!response.ok) throw new Error(`Host media endpoint: HTTP ${response.status}`)
  const result = await response.json()
  if (result.error) throw new Error(result.error)
  return result.result
}

export async function listMedia(session: string) {
  return request('list', session, { session }) as Promise<
    Array<{ vm: string; name: string; attached: boolean; closed: boolean }>
  >
}

export async function connectMedia(vm: string, file: File, session: string) {
  if (mediaSessions.has(vm)) return
  const state = reactive<State>({ name: file.name, status: 'Connecting…', bytes: 0, stopped: false })
  mediaSessions.set(vm, state)
  let pump: Promise<void> | undefined
  try {
    const created = await request('create', session, { session, vm, name: file.name, size: file.size })
    state.id = created.id
    state.token = created.token
    pump = (async () => {
      while (!state.stopped) {
        const reads = (await request('poll', session, { id: state.id, token: state.token })) as Array<{
          id: number
          offset: number
          length: number
        }>
        await Promise.all(
          reads.map(async read => {
            if (
              !Number.isSafeInteger(read.offset) ||
              !Number.isSafeInteger(read.length) ||
              read.offset < 0 ||
              read.length < 1 ||
              read.length > 1024 ** 2 ||
              read.offset + read.length > file.size
            )
              throw new Error('Invalid file range requested')
            const bytes = await file.slice(read.offset, read.offset + read.length).arrayBuffer()
            const url = `${host}/services/plugin/xolite-media-poc/reply?session_id=${encodeURIComponent(session)}&id=${state.id}&read=${read.id}`
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream', 'X-Media-Token': state.token! },
              body: bytes,
            })
            const result = await response.json()
            if (result.error) throw new Error(result.error)
            state.bytes += bytes.byteLength
          })
        )
      }
    })()
    pump.catch(error => {
      if (!state.stopped) {
        state.status = `Disconnected: ${error.message}`
        state.stopped = true
      }
    })
    await request('attach', session, { id: state.id, token: state.token })
    if (!state.stopped) state.status = 'Connected — keep this tab open'
  } catch (error) {
    state.status = `Failed: ${error instanceof Error ? error.message : String(error)}`
    if (state.id) {
      try {
        await request('disconnect', session, { id: state.id, token: state.token })
      } catch {}
    }
    state.stopped = true
  }
}

export async function disconnectMedia(vm: string, session: string) {
  const state = mediaSessions.get(vm)
  if (!state) return
  state.status = 'Disconnecting…'
  try {
    // Continue supplying reads until the host finishes ejecting its CD.
    if (state.id) await request('disconnect', session, { id: state.id, token: state.token })
    state.stopped = true
    mediaSessions.delete(vm)
  } catch (error) {
    state.status = `Cleanup pending: ${error instanceof Error ? error.message : String(error)}`
  }
}
