import { errorOf } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// a VDF lock to remove (vdf#41); `clear`: its allowed addresses too
export type VdfUnlockRequest = { vifId: string; clear: boolean }

const vdfUnlockRequestsArg = defineJobArg({
  identify: (request: VdfUnlockRequest) => request.vifId,
  toArray: true,
})

// Removing VDF locks: the plugin removes each VIF's vdf:locking key, and
// empties its allowed addresses if asked (XAPI ignores them on an unlocked
// VIF). It applies at once.
export const useVdfUnlockJob = defineJob('vdf.unlock-vifs', [vdfUnlockRequestsArg], () => {
  const { t } = useI18n()

  return {
    async run(requests) {
      try {
        for (const request of requests) {
          await fetchPost(`plugins/vdf/vifs/${request.vifId}/actions/vdf_unlock`, { clear: request.clear })
        }
      } catch (error) {
        throw new JobError(errorOf(error).message)
      }
    },

    validate(isRunning, requests) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:lock:in-progress'))
      }

      if (requests.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
