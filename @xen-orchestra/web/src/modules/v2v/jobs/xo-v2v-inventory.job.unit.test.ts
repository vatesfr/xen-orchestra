import { useXoV2vInventoryJob } from '@/modules/v2v/jobs/xo-v2v-inventory.job.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { hasRequested } from '@/test/fetch-requests.ts'
import { itCannotRun, itCanRun } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { stubV2vInvalidCredentialsResponse } from '@/test/stub-v2v-invalid-credentials-response.ts'
import { V2V_PLATFORM, type XoV2vConnection } from '@vates/types'

function mountInventoryJob(connection?: XoV2vConnection) {
  return mountComposableWithI18n(() => useXoV2vInventoryJob(connection))
}

describe('run', () => {
  it('posts the connection to the inventory route and resolves the inventory', async () => {
    const inventory = createV2vInventory()
    stubFetchResponse(200, inventory)
    const connection = createV2vConnection()

    await expect(mountInventoryJob(connection).run()).resolves.toEqual(inventory)
    expect(hasRequested('POST', 'v2v/inventory', { platform: V2V_PLATFORM.VMWARE, connection })).toBe(true)
  })

  it('rejects with the API error the server answered', async () => {
    stubV2vInvalidCredentialsResponse()

    await expect(mountInventoryJob(createV2vConnection()).run()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('errorMessage', () => {
  itCannotRun([
    {
      name: 'reports a missing connection',
      mountJob: () => mountInventoryJob(undefined),
      errorMessage: job => job.t('job:arg:missing-payload'),
    },
  ])

  it('reports a connection in progress', () => {
    const job = mountInventoryJob(createV2vConnection())

    expectJobRunning(job, job.t('job:connect:in-progress'))
  })

  itCanRun([{ name: 'can run with a connection', mountJob: () => mountInventoryJob(createV2vConnection()) }])
})
