import {
  type EditUpdateSettingsPayload,
  useXoaUpdateSettingsEditJob,
} from '@/modules/appliance/jobs/xoa-update-settings-edit.job.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const put = mockedExport(fetchPut)

beforeEach(() => {
  put.mockResolvedValue(undefined)
})

const payload: EditUpdateSettingsPayload = {
  channel: 'stable',
  dailyCheck: true,
}

function mountEditJob(settingsPayload: EditUpdateSettingsPayload | undefined) {
  return mountComposable(() => useXoaUpdateSettingsEditJob(settingsPayload)).wrapper.vm
}

describe('run', () => {
  it('saves the update channel', async () => {
    await mountEditJob(payload).run()

    expect(put).toHaveBeenCalledWith('plugins/xoa/updates/channel', { channel: 'stable' })
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: put,
    errorMessage: 'unknown channel',
    run: () => mountEditJob(payload).run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run with a channel', mountJob: () => mountEditJob(payload) }])

  itCannotRun([
    {
      name: 'cannot run without payload',
      mountJob: () => mountEditJob(undefined),
      errorMessage: t('job:arg:missing-payload'),
    },
    {
      name: 'cannot run without channel',
      mountJob: () => mountEditJob({ ...payload, channel: '' }),
      errorMessage: t('job:arg:channel-required'),
    },
  ])

  it('cannot run while the settings are being saved', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountEditJob(payload)

    expectJobRunning(job, t('job:edit:in-progress'))
  })
})
