import type { JobArg, JobIdentity } from '@core/packages/job/define-job-arg'
import { JobError, JobRunningError } from '@core/packages/job/job-error'
import { useJobStore } from '@core/packages/job/use-job-store'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray as convertToArray } from '@core/utils/to-array.utils'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export type JobRunArgs<TJobArgs> = TJobArgs extends [infer TJobArg, ...infer TRest]
  ? TJobArg extends JobArg<infer TType, infer TToArray>
    ? [TToArray extends true ? TType[] : TType, ...JobRunArgs<TRest>]
    : []
  : []

export type JobValidateArgs<TJobArgs> = TJobArgs extends [infer TJobArg, ...infer TRest]
  ? TJobArg extends JobArg<infer TType, infer TToArray>
    ? [TToArray extends true ? TType[] : TType | undefined, ...JobValidateArgs<TRest>]
    : []
  : []

export type JobUseArgs<TJobArgs> = TJobArgs extends [infer TJobArg, ...infer TRest]
  ? TJobArg extends JobArg<infer TType, infer TToArray>
    ? [
        TToArray extends true ? MaybeRefOrGetter<MaybeArray<TType | undefined>> : MaybeRefOrGetter<TType | undefined>,
        ...JobUseArgs<TRest>,
      ]
    : []
  : []

export type JobSetup<TJobArgs extends JobArg[], TRunResult> = () => {
  run: (...args: JobRunArgs<TJobArgs>) => TRunResult
  validate: (isRunning: boolean, ...args: JobValidateArgs<TJobArgs>) => void
}

export type Job<TRunResult> = {
  run: () => Promise<TRunResult>
  canRun: ComputedRef<boolean>
  error: ComputedRef<JobError | undefined>
  errorMessage: ComputedRef<string | undefined>
  isRunning: ComputedRef<boolean>
}

export function defineJob<const TJobArgs extends JobArg[], TRunResult>(
  name: string,
  jobArgs: TJobArgs,
  setup: JobSetup<TJobArgs, TRunResult>
) {
  const jobId = Symbol('jobId')

  return (...useArgs: JobUseArgs<TJobArgs>) => {
    const config = setup()
    const jobStore = useJobStore()

    const args = computed(() =>
      useArgs.map((useArg, index) => {
        if (jobArgs[index].toArray) {
          return convertToArray(toValue(useArg))
        }

        return toValue(useArg)
      })
    )

    const identities = computed<JobIdentity[][]>(() =>
      args.value.map<JobIdentity[]>((arg, index) => {
        const { toArray, identify } = jobArgs[index]

        if (identify === false) {
          return [undefined]
        }

        if (identify === true) {
          return convertToArray(arg)
        }

        if (toArray) {
          return arg.map(identify)
        }

        return [identify(arg)]
      })
    )

    function validate() {
      config.validate(jobStore.isRunning(jobId, identities.value), ...(args.value as JobValidateArgs<TJobArgs>))
    }

    const error = computed(() => {
      try {
        validate()

        return undefined
      } catch (error) {
        if (error instanceof JobError) {
          error.args = args.value
          error.jobName = name

          return error
        }

        return new JobError('Unknown job error', name, args.value)
      }
    })

    const isRunning = computed(() => error.value instanceof JobRunningError)

    const errorMessage = computed(() => error.value?.message)

    const canRun = computed(() => error.value === undefined)

    async function run() {
      validate()

      const runId = jobStore.start(jobId, identities.value)

      try {
        return await config.run(...(args.value as JobRunArgs<TJobArgs>))
      } finally {
        jobStore.stop(runId)
      }
    }

    return {
      run,
      canRun,
      error,
      errorMessage,
      isRunning,
    } satisfies Job<TRunResult>
  }
}
