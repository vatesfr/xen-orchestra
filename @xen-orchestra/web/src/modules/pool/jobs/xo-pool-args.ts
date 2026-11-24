import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { defineJobArg, JobError, JobRunningError } from '@core/packages/job'

export const xoPoolArg = defineJobArg<FrontXoPool>({
  identify: (pool: FrontXoPool | undefined) => pool?.id,
  toArray: false,
})

/** What the jobs of a rolling update refuse: no pool, or the same job already running */
export function validateRollingUpdateJob(
  isRunning: boolean,
  pool: FrontXoPool | undefined,
  messages: { missingPool: string; inProgress: string }
) {
  if (pool === undefined) {
    throw new JobError(messages.missingPool)
  }

  if (isRunning) {
    throw new JobRunningError(messages.inProgress)
  }
}
