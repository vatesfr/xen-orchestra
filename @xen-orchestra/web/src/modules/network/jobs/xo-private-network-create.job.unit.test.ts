import {
  type NewPrivateNetworkPayload,
  useXoPrivateNetworkCreateJob,
} from '@/modules/network/jobs/xo-private-network-create.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { TUNNEL_PROTOCOL, type XoNetwork } from '@vates/types'

const { monitorTask } = taskUtilsMock

mockXoTaskUtils()

const TASK_ID = 'task-1'

const NETWORK_IDS = ['network-1', 'network-2'] as XoNetwork['id'][]

beforeEach(() => {
  taskUtilsMock.reset()
})

function createPayload(overrides: Partial<NewPrivateNetworkPayload> = {}): NewPrivateNetworkPayload {
  return {
    poolIds: [createPool().id, OTHER_POOL_ID],
    pifIds: ['pif-1', 'pif-2'] as FrontXoPif['id'][],
    name: 'Private network',
    description: '',
    encapsulation: TUNNEL_PROTOCOL.GRE,
    encrypted: false,
    ...overrides,
  }
}

function mountCreateJob(payloads: NewPrivateNetworkPayload[]) {
  return mountComposableWithI18n(() => useXoPrivateNetworkCreateJob(() => payloads))
}

describe('run', () => {
  it('posts the private network to the SDN controller route', async () => {
    stubFetchResponse(202, { taskId: TASK_ID })
    monitorTask.mockResolvedValue({ networkIds: NETWORK_IDS })
    const payload = createPayload()

    await mountCreateJob([payload]).run()

    expect(hasRequested('POST', 'plugins/sdn-controller/pools/actions/create_private_network', payload)).toBe(true)
  })

  it('resolves the ids of the networks created by the task, one per pool', async () => {
    stubFetchResponse(202, { taskId: TASK_ID })
    monitorTask.mockImplementation(async taskId => (taskId === TASK_ID ? { networkIds: NETWORK_IDS } : undefined))

    expect(await mountCreateJob([createPayload()]).run()).toEqual([{ status: 'fulfilled', value: NETWORK_IDS }])
  })

  it('rejects the creation when the task fails', async () => {
    const error = new Error('XAPI failure')
    stubFetchResponse(202, { taskId: TASK_ID })
    monitorTask.mockRejectedValue(error)

    expect(await mountCreateJob([createPayload()]).run()).toEqual([{ status: 'rejected', reason: error }])
  })
})

describe('errorMessage', () => {
  it('can run with a complete payload', () => {
    expect(mountCreateJob([createPayload()]).canRun).toBe(true)
  })

  it('reports a creation in progress', () => {
    const job = mountCreateJob([createPayload()])

    expectJobRunning(job, job.t('job:create:in-progress'))
  })

  it('reports a missing payload', () => {
    const job = mountCreateJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:missing-payload'))
  })

  it('reports a payload without pool', () => {
    const job = mountCreateJob([createPayload({ poolIds: [], pifIds: [] })])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:pool-id-required'))
  })

  it('reports a pool without PIF', () => {
    const job = mountCreateJob([createPayload({ pifIds: ['pif-1'] as FrontXoPif['id'][] })])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:pif-per-pool-required'))
  })

  it('reports a missing name', () => {
    const job = mountCreateJob([createPayload({ name: '' })])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:name-required'))
  })

  it('reports a missing encapsulation', () => {
    const job = mountCreateJob([createPayload({ encapsulation: undefined })])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:encapsulation-required'))
  })
})
