import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useServerCreateAndConnect } from '@/modules/server/composables/use-server-create-and-connect.composable.ts'
import type { fetchGet } from '@/shared/utils/fetch.util.ts'
import { createServer } from '@/test/create-server.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { ModelBinding } from '@core/packages/validated-form'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { flushPromises } from '@vue/test-utils'
import { type MaybeRefOrGetter, toValue } from 'vue'

type JobArgs = MaybeRefOrGetter<unknown>[]

type NewHostDrawerOptions = {
  events: { onConfirm: () => Promise<unknown> }
}

type NewHostDrawerProps = {
  hostInputBindings: ModelBinding<string>
  usernameInputBindings: ModelBinding<string>
  passwordInputBindings: ModelBinding<string>
  allowUnauthorizedCheckboxBindings: ModelBinding<boolean>
}

const { createAndConnectServer, forgetServer, addHostRun, get, jobArgs } = vi.hoisted(() => ({
  createAndConnectServer: vi.fn(),
  forgetServer: vi.fn(),
  addHostRun: vi.fn(),
  get: vi.fn(),
  jobArgs: {} as Record<'serverPayload' | 'addHost', unknown>,
}))

vi.mock(import('@/modules/server/composables/use-server-create-and-connect.composable.ts'), () => ({
  useServerCreateAndConnect: ((payload: MaybeRefOrGetter<unknown>) => {
    jobArgs.serverPayload = payload
    return { createAndConnectServer, forgetServer }
  }) as unknown as typeof useServerCreateAndConnect,
}))

vi.mock(import('@/modules/pool/jobs/xo-pool-add-host.job.ts'), () => ({
  useXoPoolAddHostJob: ((...args: JobArgs) => {
    jobArgs.addHost = args
    return { run: addHostRun }
  }) as unknown as typeof useXoPoolAddHostJob,
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchGet: get as unknown as typeof fetchGet,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const POOL_ID = 'pool-1' as FrontXoPool['id']

const SERVER = createServer({ id: 'server-1' as ReturnType<typeof createServer>['id'] })

const PAYLOAD = { host: '192.168.1.10', username: 'root', password: 'secret', allowUnauthorized: false }

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  createAndConnectServer.mockReset().mockResolvedValue(SERVER.id)
  forgetServer.mockReset().mockResolvedValue(undefined)
  addHostRun.mockReset().mockResolvedValue(undefined)
  get.mockReset().mockResolvedValue(SERVER)
})

function mountNewHost() {
  const result = mountComposable(() => usePoolNewHost(POOL_ID)).wrapper.vm
  const drawer = overlayMock.getOverlay<NewHostDrawerOptions>()

  return { result, drawer }
}

function openDrawer() {
  const { result, drawer } = mountNewHost()

  result.addNewHost()

  const props: NewHostDrawerProps = drawer.open.mock.lastCall?.[0].props

  return { result, drawer, props }
}

function fillForm(props: NewHostDrawerProps) {
  props.hostInputBindings['onUpdate:modelValue'](PAYLOAD.host)
  props.usernameInputBindings['onUpdate:modelValue'](PAYLOAD.username)
  props.passwordInputBindings['onUpdate:modelValue'](PAYLOAD.password)
}

async function confirm(drawer: NewHostDrawerOptions) {
  const result = await drawer.events.onConfirm()
  await flushPromises()

  return result
}

describe('addNewHost', () => {
  it('opens the drawer with an empty form', async () => {
    const { result, drawer, props } = openDrawer()
    fillForm(props)

    result.addNewHost()

    const reopenedProps: NewHostDrawerProps = drawer.open.mock.lastCall?.[0].props

    expect(reopenedProps.hostInputBindings.modelValue).toBe('')
    expect(reopenedProps.usernameInputBindings.modelValue).toBe('')
    expect(reopenedProps.passwordInputBindings.modelValue).toBe('')
  })
})

describe('on confirm', () => {
  it('keeps the drawer open when the form is invalid', async () => {
    const { drawer } = openDrawer()

    expect(await confirm(drawer)).toBe(KEEP_OVERLAY_OPEN)
    expect(createAndConnectServer).not.toHaveBeenCalled()
  })

  it('connects the host to XO, adds it to the pool, then forgets its server', async () => {
    const { drawer, props } = openDrawer()
    fillForm(props)

    expect(await confirm(drawer)).toBeUndefined()

    expect(toValue(jobArgs.serverPayload as MaybeRefOrGetter<unknown>)).toEqual(PAYLOAD)
    expect(get).toHaveBeenCalledWith(`servers/${SERVER.id}`)
    expect((jobArgs.addHost as JobArgs).map(arg => toValue(arg))).toEqual([POOL_ID, { hostId: SERVER.master }])
    expect(forgetServer).toHaveBeenCalledWith(SERVER.id)

    const callOrder = [createAndConnectServer, addHostRun, forgetServer].map(run => run.mock.invocationCallOrder[0])

    expect(callOrder).toEqual([...callOrder].sort((a, b) => a - b))
  })

  it('forgets the server when adding the host to the pool failed', async () => {
    silenceConsoleError()
    addHostRun.mockRejectedValue(new Error('Host is not compatible'))
    const { drawer, props } = openDrawer()
    fillForm(props)

    await confirm(drawer)

    expect(forgetServer).toHaveBeenCalledExactlyOnceWith(SERVER.id)
  })

  it('does not add the host when its server could not be created or connected', async () => {
    silenceConsoleError()
    createAndConnectServer.mockRejectedValue(new Error('Authentication failed'))
    const { drawer, props } = openDrawer()
    fillForm(props)

    await confirm(drawer)

    expect(addHostRun).not.toHaveBeenCalled()
    expect(forgetServer).not.toHaveBeenCalled()
  })
})
