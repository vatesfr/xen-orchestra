import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { answerPostsWithTask, taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  taskUtilsMock.reset()

  answerPostsWithTask(post)
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
    expect(monitorTask).toHaveBeenCalledWith('task-of-plugins/transport-email/actions/test')
  })

  itRejectsWithRequestError('fails when the test task fails', {
    request: monitorTask,
    errorMessage: 'email not sent',
    run: () => mountTestJob(testablePlugin).run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run on a loaded testable plugin', mountJob: () => mountTestJob(testablePlugin) }])

  itCannotRun([
    {
      name: 'cannot run without plugin',
      mountJob: () => mountTestJob(undefined),
      errorMessage: t('job:plugin-test:missing-plugin'),
    },
    {
      name: 'cannot run on a plugin which is not testable',
      mountJob: () => mountTestJob(createPlugin({ loaded: true, testable: false })),
      errorMessage: t('job:plugin-test:not-testable'),
    },
    {
      name: 'cannot run on a plugin which is not loaded',
      mountJob: () => mountTestJob(createPlugin({ loaded: false, testable: true })),
      errorMessage: t('job:plugin-test:not-loaded'),
    },
  ])

  it('cannot run while the test is running', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountTestJob(testablePlugin)

    expectJobRunning(job, t('job:plugin-test:in-progress'))
  })
})
