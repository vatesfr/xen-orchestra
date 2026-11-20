import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import type { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import type { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
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

const { createServerRun, connectServerRun, forgetServerRun, addHostRun, get, jobArgs } = vi.hoisted(() => ({
  createServerRun: vi.fn(),
  connectServerRun: vi.fn(),
  forgetServerRun: vi.fn(),
  addHostRun: vi.fn(),
  get: vi.fn(),
  jobArgs: {} as Record<'create' | 'connect' | 'forget' | 'addHost', unknown>,
}))

vi.mock(import('@/modules/server/jobs/xo-server-create.job.ts'), () => ({
  useXoServerCreateJob: ((args: JobArgs) => {
    jobArgs.create = args
    return { run: createServerRun }
  }) as unknown as typeof useXoServerCreateJob,
}))

vi.mock(import('@/modules/server/jobs/xo-server-connect.job.ts'), () => ({
  useXoServerConnectJob: ((args: JobArgs) => {
    jobArgs.connect = args
    return { run: connectServerRun }
  }) as unknown as typeof useXoServerConnectJob,
}))

vi.mock(import('@/modules/server/jobs/xo-server-forget.job.ts'), () => ({
  useXoServerForgetJob: ((args: JobArgs) => {
    jobArgs.forget = args
    return { run: forgetServerRun }
  }) as unknown as typeof useXoServerForgetJob,
}))

vi.mock(import('@/modules/pool/jobs/xo-pool-add-host.job.ts'), () => ({
  useXoPoolAddHostJob: ((arg: MaybeRefOrGetter<unknown>) => {
    jobArgs.addHost = arg
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
  createServerRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: SERVER.id }])
  connectServerRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  forgetServerRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  addHostRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
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
    expect(createServerRun).not.toHaveBeenCalled()
  })

  it('connects the host to XO, adds it to the pool, then forgets its server', async () => {
    const { drawer, props } = openDrawer()
    fillForm(props)

    expect(await confirm(drawer)).toBeUndefined()

    expect(toValue((jobArgs.create as JobArgs)[0])).toEqual(PAYLOAD)
    expect(toValue((jobArgs.connect as JobArgs)[0])).toBe(SERVER.id)
    expect(get).toHaveBeenCalledWith(`servers/${SERVER.id}`)
    expect(toValue(jobArgs.addHost as MaybeRefOrGetter<unknown>)).toEqual({ poolId: POOL_ID, hostId: SERVER.master })
    expect(toValue((jobArgs.forget as JobArgs)[0])).toBe(SERVER.id)

    const callOrder = [createServerRun, connectServerRun, addHostRun, forgetServerRun].map(
      run => run.mock.invocationCallOrder[0]
    )

    expect(callOrder).toEqual([...callOrder].sort((a, b) => a - b))
  })

  it('forgets the server when adding the host to the pool failed', async () => {
    silenceConsoleError()
    addHostRun.mockResolvedValue([{ status: 'rejected', reason: new Error('Host is not compatible') }])
    const { drawer, props } = openDrawer()
    fillForm(props)

    await confirm(drawer)

    expect(forgetServerRun).toHaveBeenCalledOnce()
  })

  it('forgets the server without adding the host when its connection failed', async () => {
    silenceConsoleError()
    connectServerRun.mockResolvedValue([{ status: 'rejected', reason: new Error('Authentication failed') }])
    const { drawer, props } = openDrawer()
    fillForm(props)

    await confirm(drawer)

    expect(addHostRun).not.toHaveBeenCalled()
    expect(forgetServerRun).toHaveBeenCalledOnce()
  })

  it('has no server to forget when its creation failed', async () => {
    silenceConsoleError()
    createServerRun.mockResolvedValue([{ status: 'rejected', reason: new Error('Server already exists') }])
    const { drawer, props } = openDrawer()
    fillForm(props)

    await confirm(drawer)

    expect(connectServerRun).not.toHaveBeenCalled()
    expect(addHostRun).not.toHaveBeenCalled()
    expect(forgetServerRun).not.toHaveBeenCalled()
  })
})
