import { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { answerPostsWithTask, taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)
const patch = mockedExport(fetchPatch)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()

  answerPostsWithTask(post)
  patch.mockResolvedValue(undefined)
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
    expect(monitorTask).toHaveBeenCalledWith(`task-of-plugins/transport-email/actions/${action}`)
    expect(patch).toHaveBeenCalledWith('plugins/transport-email', { autoload: loaded })
  })

  it('succeeds when only the autoload update fails', async () => {
    silenceConsoleError()
    patch.mockRejectedValue(new Error('autoload update failed'))

    await expect(mountChangeStateJob(unloadedPlugin, true).run()).resolves.toBeUndefined()
  })

  itRejectsWithRequestError('fails, without syncing the autoload, when the task fails', {
    request: monitorTask,
    errorMessage: 'plugin load failed',
    run: () => mountChangeStateJob(unloadedPlugin, true).run(),
    expectAfter: () => expect(patch).not.toHaveBeenCalled(),
  })

  it('does not run when the plugin cannot change state', async () => {
    const job = mountChangeStateJob(loadedPlugin, true)

    await expect(job.run()).rejects.toThrow(t('job:plugin-change-state:already-loaded'))
    expect(post).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  itCanRun(
    [
      { plugin: unloadedPlugin, loaded: true },
      { plugin: loadedPlugin, loaded: false },
    ].map(({ plugin, loaded }) => ({
      name: `can run when loaded becomes ${loaded}`,
      mountJob: () => mountChangeStateJob(plugin, loaded),
    }))
  )

  itCannotRun(
    (
      [
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
      ] as const
    ).map(({ case: name, plugin, loaded, key }) => ({
      name: `cannot run ${name}`,
      mountJob: () => mountChangeStateJob(plugin, loaded),
      errorMessage: t(key),
    }))
  )

  it.each([
    { plugin: unloadedPlugin, loaded: true, key: 'job:plugin-change-state:load-in-progress' },
    { plugin: loadedPlugin, loaded: false, key: 'job:plugin-change-state:unload-in-progress' },
  ] as const)('cannot run while it runs, with the $key message', ({ plugin, loaded, key }) => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountChangeStateJob(plugin, loaded)

    expectJobRunning(job, t(key))
  })
})
