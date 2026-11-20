import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const put = mockedExport(fetchPut)

beforeEach(() => {
  put.mockResolvedValue(undefined)
})

const configurablePlugin = createPlugin({ configurationSchema: { type: 'object' } })

function mountConfigureJob(plugin: FrontXoPlugin | undefined, configuration?: unknown) {
  return mountComposable(() => useXoPluginConfigureJob(plugin, configuration)).wrapper.vm
}

describe('run', () => {
  it('saves the configuration of the plugin', async () => {
    await mountConfigureJob(configurablePlugin, { host: 'smtp.example.org' }).run()

    expect(put).toHaveBeenCalledWith('plugins/transport-email/configuration', { host: 'smtp.example.org' })
  })

  it('saves an empty configuration when there is none', async () => {
    await mountConfigureJob(configurablePlugin, undefined).run()

    expect(put).toHaveBeenCalledWith('plugins/transport-email/configuration', {})
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: put,
    errorMessage: 'invalid configuration',
    run: () => mountConfigureJob(configurablePlugin).run(),
  })
})

describe('validate', () => {
  itCanRun([
    { name: 'can run on a plugin with a configuration schema', mountJob: () => mountConfigureJob(configurablePlugin) },
  ])

  itCannotRun([
    {
      name: 'cannot run without plugin',
      mountJob: () => mountConfigureJob(undefined),
      errorMessage: t('job:plugin-configure:missing-plugin'),
    },
    {
      name: 'cannot run on a plugin which is not configurable',
      mountJob: () => mountConfigureJob(createPlugin({ configurationSchema: undefined })),
      errorMessage: t('job:plugin-configure:not-configurable'),
    },
  ])

  it('cannot run while the configuration is being saved', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountConfigureJob(configurablePlugin)

    expectJobRunning(job, t('job:edit:in-progress'))
  })
})
