import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

const { fetchPost, monitorTask } = vi.hoisted(() => ({
  fetchPost: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), async importOriginal => ({
  ...(await importOriginal()),
  fetchPost,
}))

vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  fetchPost.mockReset().mockResolvedValue({ taskId: 'task-1' })
  monitorTask.mockReset().mockResolvedValue(undefined)
})

const testablePlugin = createPlugin({ loaded: true, testable: true })

function mountJob(plugin: FrontXoPlugin | undefined, data?: unknown) {
  return mountComposable(() => ({ ...useXoPluginTestJob(plugin, data), t: useI18n().t })).wrapper.vm
}

describe('validation', () => {
  it('allows testing a loaded testable plugin', () => {
    const job = mountJob(testablePlugin)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({ canRun: true, errorMessage: undefined })
  })

  it('prevents running without plugin', () => {
    const job = mountJob(undefined)

    expect({ canRun: job.canRun, errorMessage: job.errorMessage }).toEqual({
      canRun: false,
      errorMessage: job.t('job:plugin-test:missing-plugin'),
    })
  })

  it('reports a plugin which is not testable', () => {
    const job = mountJob(createPlugin({ loaded: true, testable: false }))

    expect(job.errorMessage).toBe(job.t('job:plugin-test:not-testable'))
  })

  it('reports a plugin which is not loaded', () => {
    const job = mountJob(createPlugin({ loaded: false, testable: true }))

    expect(job.errorMessage).toBe(job.t('job:plugin-test:not-loaded'))
  })

  it('reports a test in progress', () => {
    fetchPost.mockReturnValue(new Promise(() => {}))
    const job = mountJob(testablePlugin)

    void job.run()

    expect({ isRunning: job.isRunning, errorMessage: job.errorMessage }).toEqual({
      isRunning: true,
      errorMessage: job.t('job:plugin-test:in-progress'),
    })
  })
})

describe('run', () => {
  it('tests the plugin with the data and waits for the task', async () => {
    await mountJob(testablePlugin, { to: 'admin@example.org' }).run()

    expect(fetchPost).toHaveBeenCalledWith('plugins/transport-email/actions/test', {
      data: { to: 'admin@example.org' },
    })
    expect(monitorTask).toHaveBeenCalledWith('task-1')
  })

  it('fails when the test task fails', async () => {
    const error = new Error('email not sent')
    monitorTask.mockRejectedValue(error)

    await expect(mountJob(testablePlugin).run()).rejects.toBe(error)
  })
})
