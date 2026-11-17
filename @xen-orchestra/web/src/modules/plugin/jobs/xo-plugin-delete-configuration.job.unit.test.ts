import { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { remove } = vi.hoisted(() => ({
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  remove.mockReset()

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

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    remove.mockRejectedValue(error)

    await expect(mountDeleteConfigurationJob(configuredPlugin).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run on an unloaded plugin with a saved configuration', () => {
    const job = mountDeleteConfigurationJob(configuredPlugin)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountDeleteConfigurationJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-delete-configuration:missing-plugin'))
  })

  it('cannot run on a plugin without saved configuration, even if it is configured', () => {
    const job = mountDeleteConfigurationJob(
      createPlugin({ configurationSchema: { type: 'object' }, configuration: undefined, configured: true })
    )

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-delete-configuration:no-configuration'))
  })

  it('cannot run on a loaded plugin, as the API rejects it', () => {
    const job = mountDeleteConfigurationJob(createPlugin({ ...configuredPlugin, loaded: true }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-delete-configuration:loaded'))
  })

  it('cannot run while the configuration is being deleted', () => {
    remove.mockReturnValue(new Promise(() => {}))
    const job = mountDeleteConfigurationJob(configuredPlugin)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:delete:in-progress'))
  })
})
