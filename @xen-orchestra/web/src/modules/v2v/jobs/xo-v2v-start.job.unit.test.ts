import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoV2vStartJob } from '@/modules/v2v/jobs/xo-v2v-start.job.ts'
import { buildV2vStartPayload } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createPool } from '@/test/create-pool.ts'
import {
  createV2vStartPayloadInput,
  stubV2vStartAccepted,
  stubV2vStartProblems,
  V2V_START_TASK_ID,
} from '@/test/create-v2v-launch.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import type { XoV2vStartPayload } from '@vates/types'

const POOL = createPool()

const PAYLOAD = buildV2vStartPayload(createV2vStartPayloadInput())

function mountStartJob(pool?: FrontXoPool, payload?: XoV2vStartPayload) {
  return mountComposableWithI18n(() => useXoV2vStartJob(pool, payload))
}

describe('run', () => {
  it('posts the payload to the import route of the pool and resolves the task id', async () => {
    const fetchMock = stubV2vStartAccepted()

    await expect(mountStartJob(POOL, PAYLOAD).run()).resolves.toBe(V2V_START_TASK_ID)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(hasRequested('POST', `pools/${POOL.id}/actions/import_vms_from_vmware`, PAYLOAD)).toBe(true)
  })

  it('rejects with the API error the server answered', async () => {
    stubV2vStartProblems([])

    await expect(mountStartJob(POOL, PAYLOAD).run()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('errorMessage', () => {
  it('reports a launch in progress', () => {
    const job = mountStartJob(POOL, PAYLOAD)

    expectJobRunning(job, job.t('job:v2v-start:in-progress'))
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

  it('can run with a pool and a payload of one VM', () => {
    const job = mountStartJob(POOL, PAYLOAD)

    expect(job.canRun).toBe(true)
  })
})
