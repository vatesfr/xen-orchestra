import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { patch } = vi.hoisted(() => ({
  patch: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

beforeEach(() => {
  patch.mockReset()

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

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    patch.mockRejectedValue(error)

    await expect(mountAutoloadJob(createPlugin()).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run on any plugin', () => {
    const job = mountAutoloadJob(createPlugin({ loaded: false, configured: false }))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountAutoloadJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-autoload:missing-plugin'))
  })

  it('cannot run while the autoload is being updated', () => {
    patch.mockReturnValue(new Promise(() => {}))
    const job = mountAutoloadJob(createPlugin())

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:edit:in-progress'))
  })
})
