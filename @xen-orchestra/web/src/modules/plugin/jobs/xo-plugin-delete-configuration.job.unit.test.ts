import { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

const { fetchDelete } = vi.hoisted(() => ({
  fetchDelete: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchDelete,
}))

beforeEach(() => {
  fetchDelete.mockReset().mockResolvedValue(undefined)
})

const configuredPlugin = createPlugin({
  configurationSchema: { type: 'object' },
  configuration: { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } },
})

function mountJob(plugin: FrontXoPlugin | undefined) {
  return mountComposable(() => ({ ...useXoPluginDeleteConfigurationJob(plugin), t: useI18n().t })).wrapper.vm
}

describe('validation', () => {
  it('allows deleting a saved configuration', () => {
    const job = mountJob(configuredPlugin)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-delete-configuration:missing-plugin'),
    })
  })

  it('reports a plugin without saved configuration, even if it is configured', () => {
    const job = mountJob(
      createPlugin({ configurationSchema: { type: 'object' }, configuration: undefined, configured: true })
    )

    expect(job.errorMessage).toBe(job.t('job:plugin-delete-configuration:no-configuration'))
  })

  it('reports a deletion in progress', () => {
    fetchDelete.mockReturnValue(new Promise(() => {}))
    const job = mountJob(configuredPlugin)

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:delete:in-progress'),
    })
  })
})

describe('run', () => {
  it('deletes the configuration of the plugin', async () => {
    await mountJob(configuredPlugin).run()

    expect(fetchDelete).toHaveBeenCalledWith('plugins/transport-email/configuration')
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    fetchDelete.mockRejectedValue(error)

    await expect(mountJob(configuredPlugin).run()).rejects.toBe(error)
  })
})
