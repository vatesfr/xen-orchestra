import { useXoPluginLoadJob } from '@/modules/plugin/jobs/xo-plugin-load.job.ts'
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

const unloadedPlugin = createPlugin({ loaded: false })

function mountLoadJob(plugin: FrontXoPlugin | undefined) {
  return mountComposable(() => useXoPluginLoadJob(plugin)).wrapper.vm
}

describe('run', () => {
  it('loads the plugin, waits for the task and enables its autoload', async () => {
    await mountLoadJob(unloadedPlugin).run()

    expect(post).toHaveBeenCalledWith('plugins/transport-email/actions/load')
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: true })
  })

  it('succeeds when only the autoload update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    patch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountLoadJob(unloadedPlugin).run()).resolves.toBeUndefined()
  })

  it('fails, without enabling the autoload, when the load task fails', async () => {
    const error = new Error('plugin load failed')
    monitorTask.mockRejectedValue(error)

    await expect(mountLoadJob(unloadedPlugin).run()).rejects.toBe(error)
    expect(patch).not.toHaveBeenCalled()
  })

  it('does not run when the plugin cannot be loaded', async () => {
    const job = mountLoadJob(createPlugin({ loaded: true }))

    await expect(job.run()).rejects.toThrow(t('job:plugin-load:already-loaded'))
    expect(post).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  it('can run on a plugin which can be loaded', () => {
    const job = mountLoadJob(unloadedPlugin)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountLoadJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-load:missing-plugin'))
  })

  it('cannot run on a plugin which is already loaded', () => {
    const job = mountLoadJob(createPlugin({ loaded: true }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-load:already-loaded'))
  })

  it('cannot run on a plugin which is not configured', () => {
    const job = mountLoadJob(createPlugin({ loaded: false, configured: false }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-load:not-configured'))
  })

  it('cannot run while the plugin is being loaded', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountLoadJob(unloadedPlugin)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:plugin-load:in-progress'))
  })
})
