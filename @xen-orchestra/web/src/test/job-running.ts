type RunnableJob = {
  run: () => Promise<unknown>
  isRunning: boolean
  errorMessage: string | undefined
}

/**
 * Starts a job whose request never settles, then expects it running and reporting `message`, its "in progress" error.
 * The test stubs the request beforehand (a pending promise), or relies on the pending `fetch` of `setup.ts`.
 */
export function expectJobRunning(job: RunnableJob, message: string) {
  void job.run()

  expect(job.isRunning).toBe(true)
  expect(job.errorMessage).toBe(message)
}
