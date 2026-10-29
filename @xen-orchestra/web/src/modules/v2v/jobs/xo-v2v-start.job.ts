import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask, XoV2vStartPayload } from '@vates/types'
import { useI18n } from 'vue-i18n'

// The pool, not its id: a branded id argument cannot be named in the declaration of the job (TS4023). The job identifies
// its arguments before validating them: a missing pool must not throw here
const poolArg = defineJobArg<FrontXoPool>({
  identify: (pool: FrontXoPool | undefined) => pool?.id,
  toArray: false,
})

const payloadArg = defineJobArg<XoV2vStartPayload>({
  identify: false,
  toArray: false,
})

export const useXoV2vStartJob = defineJob('v2v.start', [poolArg, payloadArg], () => {
  const { t } = useI18n()

  return {
    // An import lasts hours: the task is not monitored, the caller links to it
    async run(pool: FrontXoPool, payload: XoV2vStartPayload): Promise<XoTask['id']> {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
        `pools/${pool.id}/actions/import_vms_from_vmware`,
        payload
      )

      return taskId
    },

    validate(isRunning, pool: FrontXoPool | undefined, payload: XoV2vStartPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:v2v-start:in-progress'))
      }

      if (pool === undefined) {
        throw new JobError(t('job:arg:pool-id-required'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.vms.length === 0) {
        throw new JobError(t('job:v2v-start:missing-vm'))
      }
    },
  }
})
