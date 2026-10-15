import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

const { fetchPatch } = vi.hoisted(() => ({
  fetchPatch: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchPatch,
}))

beforeEach(() => {
  fetchPatch.mockReset().mockResolvedValue(undefined)
})

function mountJob(plugin: FrontXoPlugin | undefined, autoload = true) {
  return mountComposable(() => ({ ...useXoPluginAutoloadJob(plugin, autoload), t: useI18n().t })).wrapper.vm
}

describe('validation', () => {
  it('allows updating the autoload of any plugin', () => {
    const job = mountJob(createPlugin({ loaded: false, configured: false }))

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-autoload:missing-plugin'),
    })
  })

  it('reports an update in progress', () => {
    fetchPatch.mockReturnValue(new Promise(() => {}))
    const job = mountJob(createPlugin())

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:edit:in-progress'),
    })
  })
})

describe('run', () => {
  it('enables the autoload of the plugin', async () => {
    await mountJob(createPlugin({ autoload: false }), true).run()

    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('disables the autoload of the plugin', async () => {
    await mountJob(createPlugin({ autoload: true }), false).run()

    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    fetchPatch.mockRejectedValue(error)

    await expect(mountJob(createPlugin()).run()).rejects.toBe(error)
  })
})
