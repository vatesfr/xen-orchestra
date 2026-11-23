import { mockedExport } from '@/test/spy-on-module.ts'
import { type Ref, ref } from 'vue'

export type JobResultState = {
  canRun?: boolean
  isRunning?: boolean
  errorMessage?: string
}

export function createJobResult<TRun>(
  run: TRun,
  { canRun = true, isRunning = false, errorMessage = canRun ? undefined : 'The job cannot run' }: JobResultState = {}
) {
  return { run, canRun: ref(canRun), isRunning: ref(isRunning), errorMessage: ref(errorMessage) }
}

type JobResult<TRun> = ReturnType<typeof createJobResult<TRun>>

type RunSpy = ReturnType<typeof vi.fn>

type JobComposableResult<TRun, TName extends string, TIsRunningName extends string> = Record<TName, TRun> &
  Record<`can${Capitalize<TName>}`, Ref<boolean>> &
  Record<TIsRunningName, Ref<boolean>> &
  Record<`${TName}ErrorMessage`, Ref<string | undefined>>

/**
 * What a composable wrapping a job returns: the job result under the names of its action, e.g. `deleteBackupJobs`,
 * `canDeleteBackupJobs`, `isDeletingBackupJobs` and `deleteBackupJobsErrorMessage` for `'deleteBackupJobs'` and
 * `'isDeletingBackupJobs'`.
 */
export function toJobComposableResult<TRun, TName extends string, TIsRunningName extends string>(
  { run, canRun, isRunning, errorMessage }: JobResult<TRun>,
  name: TName,
  isRunningName: TIsRunningName
) {
  const capitalizedName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`

  return {
    [name]: run,
    [`can${capitalizedName}`]: canRun,
    [isRunningName]: isRunning,
    [`${name}ErrorMessage`]: errorMessage,
  } as JobComposableResult<TRun, TName, TIsRunningName>
}

/**
 * A mocked job, or a composable wrapping one when `toResult` renames its result (see `toJobComposableResult`): `use`
 * is the spy of `job`, the export of a module of `global-module-mocks.ts` (the same spy when the test file replaces
 * the export with `mockModule`), or a fresh spy without `job`, returning the result of `run` in the state the last
 * `setState` gave it. Call `reset()` in `beforeEach`: it resets both spies and the state.
 */
export function createJobStub<TResult = JobResult<RunSpy>>(
  job?: unknown,
  toResult: (result: JobResult<RunSpy>) => TResult = result => result as TResult
) {
  const run = vi.fn()
  // `any` args, as for a `vi.fn()`: a test reads the arguments of a call as the type it expects
  const use = (job === undefined ? vi.fn() : mockedExport(job)) as unknown as ReturnType<
    typeof vi.fn<(...args: any[]) => TResult>
  >

  return {
    run,
    use,
    setState(state?: JobResultState) {
      use.mockReturnValue(toResult(createJobResult(run, state)))
    },
    reset() {
      run.mockReset()
      use.mockReset()
      this.setState()
    },
  }
}
