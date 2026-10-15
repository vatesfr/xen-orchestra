import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

const { fetchPut } = vi.hoisted(() => ({
  fetchPut: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchPut,
}))

beforeEach(() => {
  fetchPut.mockReset().mockResolvedValue(undefined)
})

const configurablePlugin = createPlugin({ configurationSchema: { type: 'object' } })

function mountJob(plugin: FrontXoPlugin | undefined, configuration?: unknown) {
  return mountComposable(() => ({ ...useXoPluginConfigureJob(plugin, configuration), t: useI18n().t })).wrapper.vm
}

describe('validation', () => {
  it('allows configuring a plugin with a configuration schema', () => {
    const job = mountJob(configurablePlugin)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-configure:missing-plugin'),
    })
  })

  it('reports a plugin which is not configurable', () => {
    const job = mountJob(createPlugin({ configurationSchema: undefined }))

    expect(job.errorMessage).toBe(job.t('job:plugin-configure:not-configurable'))
  })

  it('reports a configuration in progress', () => {
    fetchPut.mockReturnValue(new Promise(() => {}))
    const job = mountJob(configurablePlugin)

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:edit:in-progress'),
    })
  })
})

describe('run', () => {
  it('saves the configuration of the plugin', async () => {
    await mountJob(configurablePlugin, { host: 'smtp.example.org' }).run()

    expect(fetchPut).toHaveBeenCalledWith('plugins/transport-email/configuration', { host: 'smtp.example.org' })
  })

  it('saves an empty configuration when there is none', async () => {
    await mountJob(configurablePlugin, undefined).run()

    expect(fetchPut).toHaveBeenCalledWith('plugins/transport-email/configuration', {})
  })

  it('propagates the error of the request', async () => {
    const error = new Error('invalid configuration')
    fetchPut.mockRejectedValue(error)

    await expect(mountJob(configurablePlugin).run()).rejects.toBe(error)
  })
})
