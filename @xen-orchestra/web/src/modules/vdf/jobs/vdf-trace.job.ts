import { vdfPoolIdArg } from '@/modules/vdf/jobs/vdf-args.ts'
import type { VdfTraceRequest, VdfTraceResult } from '@/modules/vdf/types.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

const vdfTraceRequestArg = defineJobArg<VdfTraceRequest>({ identify: false, toArray: false })

// A trace is read-only: the agents simulate one packet through the flows
// installed on the hosts involved, nothing is sent and no state changes.
export const useVdfTraceJob = defineJob('vdf.trace', [vdfPoolIdArg, vdfTraceRequestArg], () => {
  const { t } = useI18n()

  return {
    async run(poolId, request) {
      try {
        return await fetchPost<VdfTraceResult>(`plugins/vdf/pools/${poolId}/actions/trace`, request)
      } catch (error) {
        // the plugin answers with { error } on a failed trace
        throw new JobError(
          ((error as Error).cause as { error?: string } | undefined)?.error ?? (error as Error).message
        )
      }
    },

    validate(isRunning, poolId, request) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:trace:in-progress'))
      }

      if (poolId === undefined || request === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
