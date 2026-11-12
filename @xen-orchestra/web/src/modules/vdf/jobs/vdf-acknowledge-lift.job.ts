import { vdfPoolIdArg } from '@/modules/vdf/jobs/vdf-args.ts'
import type { VdfOutsideTagChange } from '@/modules/vdf/types.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// the id of a pool history's tag change
const vdfTagChangeIdArg = defineJobArg<number>({ identify: true, toArray: false })

// A quarantine lifted outside XO, acknowledged (vdf#141): the plugin records
// who and when on the entry, and no longer lists it as an alert.
export const useVdfAcknowledgeLiftJob = defineJob(
  'vdf.acknowledge-quarantine-lifted',
  [vdfPoolIdArg, vdfTagChangeIdArg],
  () => {
    const { t } = useI18n()

    return {
      async run(poolId, entry) {
        try {
          return await fetchPost<VdfOutsideTagChange>(
            `plugins/vdf/pools/${poolId}/actions/acknowledge_quarantine_lifted`,
            { entry }
          )
        } catch (error) {
          // the plugin answers with { error }
          throw new JobError(
            ((error as Error).cause as { error?: string } | undefined)?.error ?? (error as Error).message
          )
        }
      },

      validate(isRunning, poolId, entry) {
        if (isRunning) {
          throw new JobRunningError(t('firewall:outside:quarantine-lifted:acknowledging'))
        }

        if (poolId === undefined || entry === undefined) {
          throw new JobError(t('job:arg:missing-payload'))
        }
      },
    }
  }
)
