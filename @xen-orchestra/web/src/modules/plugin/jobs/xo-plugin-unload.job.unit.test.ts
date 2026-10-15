import { useXoPluginUnloadJob } from '@/modules/plugin/jobs/xo-plugin-unload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

const { fetchPost, fetchPatch, monitorTask } = vi.hoisted(() => ({
  fetchPost: vi.fn(),
  fetchPatch: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchPost,
  fetchPatch,
}))

vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  fetchPost.mockReset().mockResolvedValue({ taskId: 'task-1' })
  fetchPatch.mockReset().mockResolvedValue(undefined)
  monitorTask.mockReset().mockResolvedValue(undefined)
})

function mountJob(plugin: FrontXoPlugin | undefined) {
  return mountComposable(() => ({ ...useXoPluginUnloadJob(plugin), t: useI18n().t })).wrapper.vm
}

const loadedPlugin = createPlugin({ loaded: true, unloadable: true })

describe('validation', () => {
  it('allows unloading a loaded plugin which can be unloaded', () => {
    const job = mountJob(loadedPlugin)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-unload:missing-plugin'),
    })
  })

  it('reports a plugin which is not loaded', () => {
    const job = mountJob(createPlugin({ loaded: false }))

    expect(job.errorMessage).toBe(job.t('job:plugin-unload:already-unloaded'))
  })

  it('reports a plugin which cannot be unloaded', () => {
    const job = mountJob(createPlugin({ loaded: true, unloadable: false }))

    expect(job.errorMessage).toBe(job.t('job:plugin-unload:not-unloadable'))
  })

  it('reports an unload in progress', () => {
    fetchPost.mockReturnValue(new Promise(() => {}))
    const job = mountJob(loadedPlugin)

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:plugin-unload:in-progress'),
    })
  })
})

describe('run', () => {
  it('unloads the plugin, waits for the task and disables its autoload', async () => {
    await mountJob(loadedPlugin).run()

    expect(fetchPost).toHaveBeenCalledWith('plugins/transport-email/actions/unload')
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  it('succeeds when only the autoload update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchPatch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountJob(loadedPlugin).run()).resolves.toBeUndefined()
  })

  it('fails, without disabling the autoload, when the unload task fails', async () => {
    const error = new Error('plugin unload failed')
    monitorTask.mockRejectedValue(error)

    await expect(mountJob(loadedPlugin).run()).rejects.toBe(error)
    expect(fetchPatch).not.toHaveBeenCalled()
  })

  it('does not run when the plugin cannot be unloaded', async () => {
    const job = mountJob(createPlugin({ loaded: false }))

    await expect(job.run()).rejects.toThrow(job.t('job:plugin-unload:already-unloaded'))
    expect(fetchPost).not.toHaveBeenCalled()
  })
})
