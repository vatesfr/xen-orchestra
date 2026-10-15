import { useXoPluginLoadJob } from '@/modules/plugin/jobs/xo-plugin-load.job.ts'
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
  return mountComposable(() => ({ ...useXoPluginLoadJob(plugin), t: useI18n().t })).wrapper.vm
}

const unloadedPlugin = createPlugin({ loaded: false })

describe('validation', () => {
  it('allows loading a configured plugin which is not loaded', () => {
    const job = mountJob(unloadedPlugin)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-load:missing-plugin'),
    })
  })

  it('reports a plugin which is already loaded', () => {
    const job = mountJob(createPlugin({ loaded: true }))

    expect(job.errorMessage).toBe(job.t('job:plugin-load:already-loaded'))
  })

  it('reports a plugin which is not configured', () => {
    const job = mountJob(createPlugin({ loaded: false, configured: false }))

    expect(job.errorMessage).toBe(job.t('job:plugin-load:not-configured'))
  })

  it('reports a load in progress', () => {
    fetchPost.mockReturnValue(new Promise(() => {}))
    const job = mountJob(unloadedPlugin)

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:plugin-load:in-progress'),
    })
  })
})

describe('run', () => {
  it('loads the plugin, waits for the task and enables its autoload', async () => {
    await mountJob(unloadedPlugin).run()

    expect(fetchPost).toHaveBeenCalledWith('plugins/transport-email/actions/load')
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(fetchPatch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('succeeds when only the autoload update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchPatch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountJob(unloadedPlugin).run()).resolves.toBeUndefined()
  })

  it('fails, without enabling the autoload, when the load task fails', async () => {
    const error = new Error('plugin load failed')
    monitorTask.mockRejectedValue(error)

    await expect(mountJob(unloadedPlugin).run()).rejects.toBe(error)
    expect(fetchPatch).not.toHaveBeenCalled()
  })

  it('does not run when the plugin cannot be loaded', async () => {
    const job = mountJob(createPlugin({ loaded: true }))

    await expect(job.run()).rejects.toThrow(job.t('job:plugin-load:already-loaded'))
    expect(fetchPost).not.toHaveBeenCalled()
  })
})
