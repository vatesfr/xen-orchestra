import { useServerCreateAndConnect } from '@/modules/server/composables/use-server-create-and-connect.composable.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { XoServer } from '@vates/types'
import { type MaybeRefOrGetter, toValue } from 'vue'

const createJob = createJobStub(useXoServerCreateJob)
const connectJob = createJobStub(useXoServerConnectJob)
const forgetJob = createJobStub(useXoServerForgetJob)

const SERVER_ID = 'server-1' as XoServer['id']

const PAYLOAD = { host: '192.168.1.10', username: 'root', password: 'secret' }

beforeEach(() => {
  createJob.reset()
  connectJob.reset()
  forgetJob.reset()

  createJob.run.mockResolvedValue([{ status: 'fulfilled', value: SERVER_ID }])
  connectJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
  forgetJob.run.mockResolvedValue([{ status: 'fulfilled', value: undefined }])
})

function mountCreateAndConnect() {
  return mountComposable(() => useServerCreateAndConnect(PAYLOAD)).wrapper.vm
}

function getJobArg(job: typeof createJob) {
  return toValue((job.use.mock.lastCall?.[0] as MaybeRefOrGetter<unknown>[])[0])
}

describe('createAndConnectServer', () => {
  it('creates the server, then connects it', async () => {
    const serverId = await mountCreateAndConnect().createAndConnectServer()

    expect(serverId).toBe(SERVER_ID)
    expect(getJobArg(createJob)).toEqual(PAYLOAD)
    expect(getJobArg(connectJob)).toBe(SERVER_ID)
    expect(createJob.run.mock.invocationCallOrder[0]).toBeLessThan(connectJob.run.mock.invocationCallOrder[0])
    expect(forgetJob.run).not.toHaveBeenCalled()
  })

  it('does not connect a server that could not be created', async () => {
    const error = new Error('Server already exists')
    createJob.run.mockResolvedValue([{ status: 'rejected', reason: error }])

    await expect(mountCreateAndConnect().createAndConnectServer()).rejects.toBe(error)

    expect(connectJob.run).not.toHaveBeenCalled()
    expect(forgetJob.run).not.toHaveBeenCalled()
  })

  it('forgets the server that could not be connected', async () => {
    const error = new Error('Authentication failed')
    connectJob.run.mockResolvedValue([{ status: 'rejected', reason: error }])

    await expect(mountCreateAndConnect().createAndConnectServer()).rejects.toBe(error)

    expect(getJobArg(forgetJob)).toBe(SERVER_ID)
    expect(forgetJob.run).toHaveBeenCalledOnce()
  })
})

describe('forgetServer', () => {
  it('forgets the given server', async () => {
    await mountCreateAndConnect().forgetServer(SERVER_ID)

    expect(getJobArg(forgetJob)).toBe(SERVER_ID)
    expect(forgetJob.run).toHaveBeenCalledOnce()
  })

  it('does not fail when the server could not be forgotten', async () => {
    silenceConsoleError()
    forgetJob.run.mockResolvedValue([{ status: 'rejected', reason: new Error('Server not found') }])

    await expect(mountCreateAndConnect().forgetServer(SERVER_ID)).resolves.toBeUndefined()
  })
})
