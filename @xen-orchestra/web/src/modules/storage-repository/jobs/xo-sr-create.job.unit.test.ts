import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type NewSrRestPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'

const PAYLOAD: NewSrRestPayload = {
  hostId: 'host-456' as FrontXoHost['id'],
  name_label: 'My SR',
  SR_type: 'ext',
  device_config: { device: '/dev/sdb' },
}

function mountCreateJob(payload?: NewSrRestPayload) {
  return mountComposableWithI18n(() => useXoSrCreateJob(payload))
}

describe('run', () => {
  it('posts the payload to the SRs route and resolves the new SR id', async () => {
    stubFetchResponse(201, { id: 'sr-new' })

    await expect(mountCreateJob(PAYLOAD).run()).resolves.toBe('sr-new')
    expect(hasRequested('POST', 'srs', PAYLOAD)).toBe(true)
  })
})

describe('errorMessage', () => {
  it('reports a creation in progress', () => {
    const job = mountCreateJob(PAYLOAD)

    expectJobRunning(job, job.t('job:create:in-progress'))
  })

  it.each([
    { case: 'a missing payload', payload: undefined, key: 'job:arg:missing-payload' },
    { case: 'a missing host', payload: { ...PAYLOAD, hostId: '' as FrontXoHost['id'] }, key: 'job:arg:host-required' },
    { case: 'a missing name', payload: { ...PAYLOAD, name_label: '' }, key: 'job:arg:name-required' },
    {
      case: 'a missing SR type',
      payload: { ...PAYLOAD, SR_type: '' as NewSrRestPayload['SR_type'] },
      key: 'job:arg:sr-type-required',
    },
  ])('reports $case', ({ payload, key }) => {
    const job = mountCreateJob(payload)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t(key))
  })

  it('can run with a complete payload', () => {
    expect(mountCreateJob(PAYLOAD).canRun).toBe(true)
  })
})
