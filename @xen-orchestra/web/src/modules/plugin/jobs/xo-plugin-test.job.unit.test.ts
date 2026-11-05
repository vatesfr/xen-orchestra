import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { post, monitorTask } = vi.hoisted(() => ({
  post: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

// The task collection would open an SSE subscription
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  post.mockReset()
  monitorTask.mockReset()

  post.mockResolvedValue({ taskId: 'task-1' })
  monitorTask.mockResolvedValue(undefined)
})

const testablePlugin = createPlugin({ loaded: true, testable: true })

function mountTestJob(plugin: FrontXoPlugin | undefined, data?: unknown) {
  return mountComposable(() => useXoPluginTestJob(plugin, data)).wrapper.vm
}

describe('run', () => {
  it('tests the plugin with the data and waits for the task', async () => {
    await mountTestJob(testablePlugin, { to: 'admin@example.org' }).run()

    expect(post).toHaveBeenCalledWith('plugins/transport-email/actions/test', {
      data: { to: 'admin@example.org' },
    })
    expect(monitorTask).toHaveBeenCalledWith('task-1')
  })

  it('fails when the test task fails', async () => {
    const error = new Error('email not sent')
    monitorTask.mockRejectedValue(error)

    await expect(mountTestJob(testablePlugin).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run on a loaded testable plugin', () => {
    const job = mountTestJob(testablePlugin)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountTestJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-test:missing-plugin'))
  })

  it('cannot run on a plugin which is not testable', () => {
    const job = mountTestJob(createPlugin({ loaded: true, testable: false }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-test:not-testable'))
  })

  it('cannot run on a plugin which is not loaded', () => {
    const job = mountTestJob(createPlugin({ loaded: false, testable: true }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-test:not-loaded'))
  })

  it('cannot run while the test is running', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountTestJob(testablePlugin)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:plugin-test:in-progress'))
  })
})
