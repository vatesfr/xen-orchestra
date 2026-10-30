import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoV2vStartJob } from '@/modules/v2v/jobs/xo-v2v-start.job.ts'
import { buildV2vStartPayload } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createPool } from '@/test/create-pool.ts'
import { createV2vStartPayloadInput } from '@/test/create-v2v-launch.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import type { XoV2vStartPayload } from '@vates/types'

const POOL = createPool()

const PAYLOAD = buildV2vStartPayload(createV2vStartPayloadInput())

function mountStartJob(pool?: FrontXoPool, payload?: XoV2vStartPayload) {
  return mountComposableWithI18n(() => useXoV2vStartJob(pool, payload))
}

describe('run', () => {
  it('posts the payload to the import route of the pool and resolves the task id', async () => {
    const fetchMock = stubFetchResponse(202, { taskId: 'task-1' })

    await expect(mountStartJob(POOL, PAYLOAD).run()).resolves.toBe('task-1')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(hasRequested('POST', `pools/${POOL.id}/actions/import_vms_from_vmware`, PAYLOAD)).toBe(true)
  })

  it('rejects with the API error the server answered', async () => {
    stubFetchResponse(422, { error: 'the migration cannot be started', data: { errors: [] } })

    await expect(mountStartJob(POOL, PAYLOAD).run()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('errorMessage', () => {
  it('reports a launch in progress', () => {
    const job = mountStartJob(POOL, PAYLOAD)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(job.t('job:v2v-start:in-progress'))
  })

  it('reports a missing pool', () => {
    const job = mountStartJob(undefined, PAYLOAD)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:pool-id-required'))
  })

  it('reports a missing payload', () => {
    const job = mountStartJob(POOL, undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:missing-payload'))
  })

  it('reports a payload without VMs', () => {
    const job = mountStartJob(POOL, { ...PAYLOAD, vms: [] })

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:v2v-start:missing-vm'))
  })

  it('has no error with a pool and a payload of one VM when idle', () => {
    const job = mountStartJob(POOL, PAYLOAD)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })
})
