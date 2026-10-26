import { useXoPluginUnloadJob } from '@/modules/plugin/jobs/xo-plugin-unload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { post, patch, monitorTask } = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

// The task collection would open an SSE subscription
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  patch.mockReset()
  monitorTask.mockReset()

  post.mockResolvedValue({ taskId: 'task-1' })
  patch.mockResolvedValue(undefined)
  monitorTask.mockResolvedValue(undefined)
})

const loadedPlugin = createPlugin({ loaded: true, unloadable: true })

function mountUnloadJob(plugin: FrontXoPlugin | undefined) {
  return mountComposable(() => useXoPluginUnloadJob(plugin)).wrapper.vm
}

describe('run', () => {
  it('unloads the plugin, waits for the task and disables its autoload', async () => {
    await mountUnloadJob(loadedPlugin).run()

    expect(post).toHaveBeenCalledWith('plugins/transport-email/actions/unload')
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: false })
  })

  it('succeeds when only the autoload update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    patch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountUnloadJob(loadedPlugin).run()).resolves.toBeUndefined()
  })

  it('fails, without disabling the autoload, when the unload task fails', async () => {
    const error = new Error('plugin unload failed')
    monitorTask.mockRejectedValue(error)

    await expect(mountUnloadJob(loadedPlugin).run()).rejects.toBe(error)
    expect(patch).not.toHaveBeenCalled()
  })

  it('does not run when the plugin cannot be unloaded', async () => {
    const job = mountUnloadJob(createPlugin({ loaded: false }))

    await expect(job.run()).rejects.toThrow(t('job:plugin-unload:already-unloaded'))
    expect(post).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  it('can run on a plugin which can be unloaded', () => {
    const job = mountUnloadJob(loadedPlugin)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountUnloadJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-unload:missing-plugin'))
  })

  it('cannot run on a plugin which is already unloaded', () => {
    const job = mountUnloadJob(createPlugin({ loaded: false }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-unload:already-unloaded'))
  })

  it('cannot run on a plugin which cannot be unloaded', () => {
    const job = mountUnloadJob(createPlugin({ loaded: true, unloadable: false }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-unload:not-unloadable'))
  })

  it('cannot run while the plugin is being unloaded', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountUnloadJob(loadedPlugin)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:plugin-unload:in-progress'))
  })
})
