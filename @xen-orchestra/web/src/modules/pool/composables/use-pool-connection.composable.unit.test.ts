import PoolConnectionDrawer from '@/modules/pool/components/drawer/PoolConnectionDrawer.vue'
import { usePoolConnection } from '@/modules/pool/composables/use-pool-connection.composable.ts'
import type { PoolConnectionPayload } from '@/modules/pool/form/use-pool-connection-form.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createServer } from '@/test/create-server.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { flushPromises } from '@vue/test-utils'
import { type Component, type MaybeRefOrGetter, toValue } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: PoolConnectionPayload) => unknown
    onCancel: true
  }
}

type ServerJob = ReturnType<typeof createJobStub>

const createServerJob = createJobStub(useXoServerCreateJob)
const connectServerJob = createJobStub(useXoServerConnectJob)
const forgetServerJob = createJobStub(useXoServerForgetJob)

mockOverlay()

const SERVER = createServer()

const PAYLOAD: PoolConnectionPayload = {
  host: '192.168.1.10',
  username: 'root',
  password: 'secret',
  readOnly: false,
  allowUnauthorized: false,
}

beforeEach(() => {
  overlayMock.reset()
  createServerJob.reset()
  connectServerJob.reset()
  forgetServerJob.reset()
  createServerJob.run.mockResolvedValue([{ status: 'fulfilled', value: SERVER.id }])
  connectServerJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  forgetServerJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
})

function mountPoolConnection() {
  return mountComposable(() => usePoolConnection()).wrapper.vm
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

function getJobArg(job: ServerJob) {
  return toValue((job.use.mock.lastCall?.[0] as MaybeRefOrGetter<unknown>[])[0])
}

async function confirm() {
  getOverlay().events.onConfirm(PAYLOAD)
  await flushPromises()
}

describe('isConnectingPool', () => {
  it.each([
    ['created', createServerJob],
    ['connected', connectServerJob],
    ['forgotten', forgetServerJob],
  ])('is true while the server of the pool is being %s', (_, job) => {
    job.setState({ isRunning: true })

    expect(mountPoolConnection().isConnectingPool).toBe(true)
  })

  it('is false when no server job runs', () => {
    expect(mountPoolConnection().isConnectingPool).toBe(false)
  })
})

describe('openPoolConnectionDrawer', () => {
  it('opens the pool connection drawer', async () => {
    mountPoolConnection().openPoolConnectionDrawer()

    expect((await getOverlay().component()).default).toBe(PoolConnectionDrawer)
    expect(getOverlay().open).toHaveBeenCalledOnce()
  })

  it('closes the drawer when it is cancelled', () => {
    mountPoolConnection()

    expect(getOverlay().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('closes the drawer while the pool connects in the background', () => {
    mountPoolConnection()

    expect(getOverlay().events.onConfirm(PAYLOAD)).toBeUndefined()
  })

  it('creates the server of the pool then connects it', async () => {
    mountPoolConnection()

    await confirm()

    expect(getJobArg(createServerJob)).toEqual(PAYLOAD)
    expect(getJobArg(connectServerJob)).toBe(SERVER.id)
    expect(createServerJob.run.mock.invocationCallOrder[0]).toBeLessThan(
      connectServerJob.run.mock.invocationCallOrder[0]
    )
    expect(forgetServerJob.run).not.toHaveBeenCalled()
  })

  it('forgets the server and logs the failure when its connection failed', async () => {
    const consoleError = silenceConsoleError()
    const error = new Error('Authentication failed')
    connectServerJob.run.mockResolvedValue([{ status: 'rejected', reason: error }])
    mountPoolConnection()

    await confirm()

    expect(forgetServerJob.run).toHaveBeenCalledOnce()
    expect(getJobArg(forgetServerJob)).toBe(SERVER.id)
    expect(consoleError).toHaveBeenCalledWith(`Failed to connect the pool ${PAYLOAD.host}`, error)
  })

  it('has no server to connect nor forget when its creation failed', async () => {
    silenceConsoleError()
    createServerJob.run.mockResolvedValue([{ status: 'rejected', reason: new Error('Server already exists') }])
    mountPoolConnection()

    await confirm()

    expect(connectServerJob.run).not.toHaveBeenCalled()
    expect(forgetServerJob.run).not.toHaveBeenCalled()
  })

  it('does not forget the server of a previous connection when the creation failed', async () => {
    silenceConsoleError()
    connectServerJob.run.mockResolvedValue([{ status: 'rejected', reason: new Error('Authentication failed') }])
    mountPoolConnection()
    await confirm()
    forgetServerJob.run.mockClear()
    createServerJob.run.mockResolvedValue([{ status: 'rejected', reason: new Error('Server already exists') }])

    await confirm()

    expect(forgetServerJob.run).not.toHaveBeenCalled()
  })

  it('logs the failure to forget the server', async () => {
    const consoleError = silenceConsoleError()
    const error = new Error('Server not found')
    connectServerJob.run.mockResolvedValue([{ status: 'rejected', reason: new Error('Authentication failed') }])
    forgetServerJob.run.mockResolvedValue([{ status: 'rejected', reason: error }])
    mountPoolConnection()

    await confirm()

    expect(consoleError).toHaveBeenCalledWith(`Failed to forget the server ${SERVER.id}`, error)
  })
})
