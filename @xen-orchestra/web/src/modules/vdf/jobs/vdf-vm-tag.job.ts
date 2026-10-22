import { vdfTagArg, vdfTagPresentArg, vdfVmsArg } from '@/modules/vdf/jobs/vdf-args.ts'
import { fetchDelete, fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// Group membership and quarantine are VM tags: unlike policy edits, they
// take effect at once (agents follow XAPI events), there is no draft.
export const useVdfVmTagJob = defineJob('vdf.vm-tag', [vdfVmsArg, vdfTagArg, vdfTagPresentArg], () => {
  const { t } = useI18n()

  return {
    run(vms, tag, present) {
      const path = (vmId: string) => `vms/${vmId}/tags/${encodeURIComponent(tag)}`

      return Promise.all(
        vms
          .filter(vm => vm.tags.includes(tag) !== present)
          .map(vm => (present ? fetchRequest(path(vm.id), { method: 'PUT' }) : fetchDelete(path(vm.id))))
      )
    },

    validate(isRunning, vms, tag) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:tags:in-progress'))
      }

      if (vms.length === 0 || !tag) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
