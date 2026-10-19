import { useXoV2vInventoryJob } from '@/modules/v2v/jobs/xo-v2v-inventory.job.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { V2V_ERROR_CODE, V2V_PLATFORM, type XoV2vConnection } from '@vates/types'

function mountInventoryJob(connection?: XoV2vConnection) {
  return mountComposableWithI18n(() => useXoV2vInventoryJob(connection))
}

describe('run', () => {
  it('posts the connection to the inventory action and resolves the inventory', async () => {
    const inventory = createV2vInventory()
    const fetchMock = stubFetchResponse(200, inventory)
    const connection = createV2vConnection()

    await expect(mountInventoryJob(connection).run()).resolves.toEqual(inventory)
    expect(fetchMock).toHaveBeenCalledWith(
      '/rest/v0/v2v/actions/inventory?sync=true',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ platform: V2V_PLATFORM.VMWARE, connection }),
      })
    )
  })

  it('rejects with the API error the server answered', async () => {
    stubFetchResponse(422, { error: 'invalid credentials', data: { code: V2V_ERROR_CODE.INVALID_CREDENTIALS } })

    await expect(mountInventoryJob(createV2vConnection()).run()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('errorMessage', () => {
  it('reports a missing connection', () => {
    const job = mountInventoryJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(job.t('job:arg:missing-payload'))
  })

  it('reports a connection in progress', () => {
    const job = mountInventoryJob(createV2vConnection())

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(job.t('job:connect:in-progress'))
  })

  it('has no error with a connection when idle', () => {
    const job = mountInventoryJob(createV2vConnection())

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })
})
