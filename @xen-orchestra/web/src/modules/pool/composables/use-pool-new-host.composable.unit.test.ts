import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import { useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useServerCreateAndConnect } from '@/modules/server/composables/use-server-create-and-connect.composable.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { createServer } from '@/test/create-server.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
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

const createAndConnectServer = vi.fn()
const forgetServer = vi.fn()

const useCreateAndConnect = mockedExport(useServerCreateAndConnect)
const get = mockedExport(fetchGet)

const addHostJob = createJobStub(useXoPoolAddHostJob)

mockXoCollections('pool')

mockOverlay()

const POOL = createPool({ id: 'pool-1' as FrontXoPool['id'] })

const SERVER = createServer({ id: 'server-1' as ReturnType<typeof createServer>['id'] })

const PAYLOAD = { host: '192.168.1.10', username: 'root', password: 'secret', allowUnauthorized: false }

beforeEach(() => {
  vi.restoreAllMocks()
  overlayMock.reset()
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
  addHostJob.reset()
  createAndConnectServer.mockReset().mockResolvedValue(SERVER.id)
  forgetServer.mockReset().mockResolvedValue(undefined)
  useCreateAndConnect.mockReturnValue({ createAndConnectServer, forgetServer })
  addHostJob.run.mockResolvedValue(undefined)
  get.mockResolvedValue(SERVER)
})

function mountNewHost() {
  const result = mountComposable(() => usePoolNewHost(POOL.id)).wrapper.vm
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

    expect(toValue(useCreateAndConnect.mock.lastCall?.[0] as MaybeRefOrGetter<unknown>)).toEqual(PAYLOAD)
    expect(get).toHaveBeenCalledWith(`servers/${SERVER.id}`)
    expect((addHostJob.use.mock.lastCall as JobArgs).map(arg => toValue(arg))).toEqual([POOL, { hostId: SERVER.master }])
    expect(forgetServer).toHaveBeenCalledWith(SERVER.id)

    const callOrder = [createAndConnectServer, addHostJob.run, forgetServer].map(run => run.mock.invocationCallOrder[0])

    expect(callOrder).toEqual([...callOrder].sort((a, b) => a - b))
  })

  it('forgets the server when adding the host to the pool failed', async () => {
    silenceConsoleError()
    addHostJob.run.mockRejectedValue(new Error('Host is not compatible'))
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

    expect(addHostJob.run).not.toHaveBeenCalled()
    expect(forgetServer).not.toHaveBeenCalled()
  })
})
