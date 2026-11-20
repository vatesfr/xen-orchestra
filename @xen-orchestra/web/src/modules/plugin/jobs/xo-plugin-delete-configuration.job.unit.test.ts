import { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const remove = mockedExport(fetchDelete)

beforeEach(() => {
  remove.mockResolvedValue(undefined)
})

const configuredPlugin = createPlugin({
  loaded: false,
  configurationSchema: { type: 'object' },
  configuration: { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } },
})

function mountDeleteConfigurationJob(plugin: FrontXoPlugin | undefined) {
  return mountComposable(() => useXoPluginDeleteConfigurationJob(plugin)).wrapper.vm
}

describe('run', () => {
  it('deletes the configuration of the plugin', async () => {
    await mountDeleteConfigurationJob(configuredPlugin).run()

    expect(remove).toHaveBeenCalledWith('plugins/transport-email/configuration')
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: remove,
    errorMessage: 'request failed',
    run: () => mountDeleteConfigurationJob(configuredPlugin).run(),
  })
})

describe('validate', () => {
  itCanRun([
    {
      name: 'can run on an unloaded plugin with a saved configuration',
      mountJob: () => mountDeleteConfigurationJob(configuredPlugin),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run without plugin',
      mountJob: () => mountDeleteConfigurationJob(undefined),
      errorMessage: t('job:plugin-delete-configuration:missing-plugin'),
    },
    {
      name: 'cannot run on a plugin without saved configuration, even if it is configured',
      mountJob: () =>
        mountDeleteConfigurationJob(
          createPlugin({ configurationSchema: { type: 'object' }, configuration: undefined, configured: true })
        ),
      errorMessage: t('job:plugin-delete-configuration:no-configuration'),
    },
    {
      name: 'cannot run on a loaded plugin, as the API rejects it',
      mountJob: () => mountDeleteConfigurationJob(createPlugin({ ...configuredPlugin, loaded: true })),
      errorMessage: t('job:plugin-delete-configuration:loaded'),
    },
  ])

  it('cannot run while the configuration is being deleted', () => {
    remove.mockReturnValue(new Promise(() => {}))
    const job = mountDeleteConfigurationJob(configuredPlugin)

    expectJobRunning(job, t('job:delete:in-progress'))
  })
})
