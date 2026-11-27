import { answerPostsWithTask, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'

type ValidatedJob = { canRun: boolean; errorMessage: string | undefined }

type CannotRunCase<TJob extends ValidatedJob> = {
  name: string
  // Sets up the case, then mounts the job
  mountJob: () => TJob
  // Or built from the mounted job, e.g. with the `t` a `mountComposableWithI18n` job returns
  errorMessage: string | ((job: TJob) => string)
}

/**
 * Registers one test per case where a job (a mounted `defineJob` composable) cannot run, each expecting its error
 * message.
 */
export function itCannotRun<TJob extends ValidatedJob>(cases: CannotRunCase<TJob>[]) {
  it.each(cases.map(({ name, ...rest }) => [name, rest] as const))('%s', (_, { mountJob, errorMessage }) => {
    const job = mountJob()

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(typeof errorMessage === 'function' ? errorMessage(job) : errorMessage)
  })
}

type CanRunCase = {
  name: string
  // Sets up the case, then mounts the job
  mountJob: () => ValidatedJob
}

// Registers one test per case where a job (a mounted `defineJob` composable) can run, without error message
export function itCanRun(cases: CanRunCase[]) {
  it.each(cases.map(({ name, mountJob }) => [name, mountJob] as const))('%s', (_, mountJob) => {
    const job = mountJob()

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })
}

type RequestErrorCase = {
  // The mocked request the job sends, made to fail
  request: { mockRejectedValue: (error: Error) => unknown }
  errorMessage: string
  // Runs the job
  run: () => Promise<unknown>
  // More expectations once the job has rejected
  expectAfter?: () => void
}

// Registers the test of a job rejecting with the error of its request
export function itRejectsWithRequestError(name: string, { request, errorMessage, run, expectAfter }: RequestErrorCase) {
  it(name, async () => {
    const error = new Error(errorMessage)
    request.mockRejectedValue(error)

    await expect(run()).rejects.toBe(error)
    expectAfter?.()
  })
}

type EachResultCase = {
  // What the job runs on, in the test name
  subject: string
  // The request run for each target, failing for the first one
  request: { mockRejectedValueOnce: (error: Error) => unknown }
  errorMessage: string
  // Runs the job on two targets
  run: () => Promise<unknown>
  // What the request answers for the second target
  fulfilledValue?: unknown
  // More expectations once the job has run
  expectAfter?: () => void
}

/**
 * Registers the test every job running a request per target shares: the results of all the targets, without stopping
 * at the first failure.
 */
export function itReportsEachResult({
  subject,
  request,
  errorMessage,
  run,
  fulfilledValue,
  expectAfter,
}: EachResultCase) {
  it(`reports each ${subject} result, without stopping at the first failure`, async () => {
    silenceConsoleError()
    const error = new Error(errorMessage)
    request.mockRejectedValueOnce(error)

    const results = await run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: fulfilledValue },
    ])
    expectAfter?.()
  })
}

type TaskPerTargetCase = Omit<EachResultCase, 'request'> & {
  // What the job does to every target, the name of the test of its requests
  name: string
  // The mocked `fetchPost`, made to answer with a task (`answerPostsWithTask`) before each test
  post: Parameters<typeof answerPostsWithTask>[0] & { mock: { calls: unknown[][] } }
  // The two targets `run` runs the job on, and the action posted on each, at `<collection>/<id>/actions/<action>`
  targets: [{ id: string }, { id: string }]
  collection: string
  action: string
}

/**
 * Registers the tests every job posting an action per target and waiting for its task (the mocked `monitorTask` of
 * `mock-xo-task-utils.ts`) shares: one request and one monitored task per target, then {@link itReportsEachResult}.
 */
export function itMonitorsTaskPerTarget({ name, post, targets, collection, action, ...eachResult }: TaskPerTargetCase) {
  const urls = targets.map(target => `${collection}/${target.id}/actions/${action}`)

  beforeEach(() => {
    answerPostsWithTask(post)
  })

  it(name, async () => {
    await eachResult.run()

    expect(post.mock.calls).toEqual(urls.map(url => [url]))
    expect(taskUtilsMock.monitorTask.mock.calls).toEqual(urls.map(url => [`task-of-${url}`]))
  })

  itReportsEachResult({ ...eachResult, request: taskUtilsMock.monitorTask })
}
