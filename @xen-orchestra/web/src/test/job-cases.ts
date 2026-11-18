import { silenceConsoleError } from '@/test/silence-console-error.ts'

type ValidatedJob = { canRun: boolean; errorMessage: string | undefined }

type CannotRunCase = {
  name: string
  // Sets up the case, then mounts the job
  mountJob: () => ValidatedJob
  errorMessage: string
}

/**
 * Registers one test per case where a job (a mounted `defineJob` composable) cannot run, each expecting its error
 * message.
 */
export function itCannotRun(cases: CannotRunCase[]) {
  // Not `it.each`: its `$name` would quote and truncate the name
  for (const { name, mountJob, errorMessage } of cases) {
    it(name, () => {
      const job = mountJob()

      expect(job.canRun).toBe(false)
      expect(job.errorMessage).toBe(errorMessage)
    })
  }
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
