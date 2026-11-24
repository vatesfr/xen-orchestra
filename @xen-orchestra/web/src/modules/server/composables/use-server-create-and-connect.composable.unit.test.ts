import { useServerCreateAndConnect } from '@/modules/server/composables/use-server-create-and-connect.composable.ts'
import type { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import type { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import type { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoServer } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

type JobArgs = MaybeRefOrGetter<unknown>[]

const { createRun, connectRun, forgetRun, jobArgs } = vi.hoisted(() => ({
  createRun: vi.fn(),
  connectRun: vi.fn(),
  forgetRun: vi.fn(),
  jobArgs: {} as Record<'create' | 'connect' | 'forget', JobArgs>,
}))

vi.mock(import('@/modules/server/jobs/xo-server-create.job.ts'), () => ({
  useXoServerCreateJob: ((args: JobArgs) => {
    jobArgs.create = args
    return { run: createRun, isRunning: computed(() => false) }
  }) as unknown as typeof useXoServerCreateJob,
}))

vi.mock(import('@/modules/server/jobs/xo-server-connect.job.ts'), () => ({
  useXoServerConnectJob: ((args: JobArgs) => {
    jobArgs.connect = args
    return { run: connectRun, isRunning: computed(() => false) }
  }) as unknown as typeof useXoServerConnectJob,
}))

vi.mock(import('@/modules/server/jobs/xo-server-forget.job.ts'), () => ({
  useXoServerForgetJob: ((args: JobArgs) => {
    jobArgs.forget = args
    return { run: forgetRun, isRunning: computed(() => false) }
  }) as unknown as typeof useXoServerForgetJob,
}))

const SERVER_ID = 'server-1' as XoServer['id']

const PAYLOAD = { host: '192.168.1.10', username: 'root', password: 'secret' }

beforeEach(() => {
  createRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: SERVER_ID }])
  connectRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  forgetRun.mockReset().mockResolvedValue([{ status: 'fulfilled', value: undefined }])
})

function mountCreateAndConnect() {
  return mountComposable(() => useServerCreateAndConnect(PAYLOAD)).wrapper.vm
}

describe('createAndConnectServer', () => {
  it('creates the server, then connects it', async () => {
    const serverId = await mountCreateAndConnect().createAndConnectServer()

    expect(serverId).toBe(SERVER_ID)
    expect(toValue(jobArgs.create[0])).toEqual(PAYLOAD)
    expect(toValue(jobArgs.connect[0])).toBe(SERVER_ID)
    expect(createRun.mock.invocationCallOrder[0]).toBeLessThan(connectRun.mock.invocationCallOrder[0])
    expect(forgetRun).not.toHaveBeenCalled()
  })

  it('does not connect a server that could not be created', async () => {
    const error = new Error('Server already exists')
    createRun.mockResolvedValue([{ status: 'rejected', reason: error }])

    await expect(mountCreateAndConnect().createAndConnectServer()).rejects.toBe(error)

    expect(connectRun).not.toHaveBeenCalled()
    expect(forgetRun).not.toHaveBeenCalled()
  })

  it('forgets the server that could not be connected', async () => {
    const error = new Error('Authentication failed')
    connectRun.mockResolvedValue([{ status: 'rejected', reason: error }])

    await expect(mountCreateAndConnect().createAndConnectServer()).rejects.toBe(error)

    expect(toValue(jobArgs.forget[0])).toBe(SERVER_ID)
    expect(forgetRun).toHaveBeenCalledOnce()
  })
})

describe('forgetServer', () => {
  it('forgets the given server', async () => {
    await mountCreateAndConnect().forgetServer(SERVER_ID)

    expect(toValue(jobArgs.forget[0])).toBe(SERVER_ID)
    expect(forgetRun).toHaveBeenCalledOnce()
  })

  it('does not fail when the server could not be forgotten', async () => {
    silenceConsoleError()
    forgetRun.mockResolvedValue([{ status: 'rejected', reason: new Error('Server not found') }])

    await expect(mountCreateAndConnect().forgetServer(SERVER_ID)).resolves.toBeUndefined()
  })
})
