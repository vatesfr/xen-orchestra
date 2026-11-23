import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const patch = mockedExport(fetchPatch)

beforeEach(() => {
  patch.mockResolvedValue(undefined)
})

function mountAutoloadJob(plugin: FrontXoPlugin | undefined, autoload = true) {
  return mountComposable(() => useXoPluginAutoloadJob(plugin, autoload)).wrapper.vm
}

describe('run', () => {
  it('enables the autoload of the plugin', async () => {
    await mountAutoloadJob(createPlugin({ autoload: false }), true).run()

    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('disables the autoload of the plugin', async () => {
    await mountAutoloadJob(createPlugin({ autoload: true }), false).run()

    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: patch,
    errorMessage: 'request failed',
    run: () => mountAutoloadJob(createPlugin()).run(),
  })
})

describe('validate', () => {
  itCanRun([
    {
      name: 'can run on any plugin',
      mountJob: () => mountAutoloadJob(createPlugin({ loaded: false, configured: false })),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run without plugin',
      mountJob: () => mountAutoloadJob(undefined),
      errorMessage: t('job:plugin-autoload:missing-plugin'),
    },
  ])

  it('cannot run while the autoload is being updated', () => {
    patch.mockReturnValue(new Promise(() => {}))
    const job = mountAutoloadJob(createPlugin())

    expectJobRunning(job, t('job:edit:in-progress'))
  })
})
