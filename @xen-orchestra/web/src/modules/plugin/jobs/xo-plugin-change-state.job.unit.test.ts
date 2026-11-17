import { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
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

const loadedPlugin = createPlugin({ loaded: true, unloadable: true })

function mountChangeStateJob(plugin: FrontXoPlugin | undefined, loaded: boolean) {
  return mountComposable(() => useXoPluginChangeStateJob(plugin, loaded)).wrapper.vm
}

describe('run', () => {
  it.each([
    { plugin: unloadedPlugin, loaded: true, action: 'load' },
    { plugin: loadedPlugin, loaded: false, action: 'unload' },
  ])('runs the $action action, waits for the task and syncs the autoload', async ({ plugin, loaded, action }) => {
    await mountChangeStateJob(plugin, loaded).run()

    expect(post).toHaveBeenCalledWith(`plugins/transport-email/actions/${action}`)
    expect(monitorTask).toHaveBeenCalledWith('task-1')
    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: loaded })
  })

  it('succeeds when only the autoload update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    patch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountChangeStateJob(unloadedPlugin, true).run()).resolves.toBeUndefined()
  })

  it('fails, without syncing the autoload, when the task fails', async () => {
    const error = new Error('plugin load failed')
    monitorTask.mockRejectedValue(error)

    await expect(mountChangeStateJob(unloadedPlugin, true).run()).rejects.toBe(error)
    expect(patch).not.toHaveBeenCalled()
  })

  it('does not run when the plugin cannot change state', async () => {
    const job = mountChangeStateJob(loadedPlugin, true)

    await expect(job.run()).rejects.toThrow(t('job:plugin-change-state:already-loaded'))
    expect(post).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  it.each([
    { plugin: unloadedPlugin, loaded: true },
    { plugin: loadedPlugin, loaded: false },
  ])('can run when loaded becomes $loaded', ({ plugin, loaded }) => {
    const job = mountChangeStateJob(plugin, loaded)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it.each([
    { case: 'without plugin', plugin: undefined, loaded: true, key: 'job:plugin-change-state:missing-plugin' },
    {
      case: 'to load a loaded plugin',
      plugin: loadedPlugin,
      loaded: true,
      key: 'job:plugin-change-state:already-loaded',
    },
    {
      case: 'to load a plugin which is not configured',
      plugin: createPlugin({ loaded: false, configured: false }),
      loaded: true,
      key: 'job:plugin-change-state:not-configured',
    },
    {
      case: 'to unload an unloaded plugin',
      plugin: unloadedPlugin,
      loaded: false,
      key: 'job:plugin-change-state:already-unloaded',
    },
    {
      case: 'to unload a plugin which cannot be unloaded',
      plugin: createPlugin({ loaded: true, unloadable: false }),
      loaded: false,
      key: 'job:plugin-change-state:not-unloadable',
    },
  ] as const)('cannot run $case', ({ plugin, loaded, key }) => {
    const job = mountChangeStateJob(plugin, loaded)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t(key))
  })

  it.each([
    { plugin: unloadedPlugin, loaded: true, key: 'job:plugin-change-state:load-in-progress' },
    { plugin: loadedPlugin, loaded: false, key: 'job:plugin-change-state:unload-in-progress' },
  ] as const)('cannot run while it runs, with the $key message', ({ plugin, loaded, key }) => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountChangeStateJob(plugin, loaded)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t(key))
  })
})
