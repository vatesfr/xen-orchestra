import { vifArg } from '@/modules/vif/jobs/vif-args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useVifDeleteJob = defineJob('vif.delete', [vifArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: vif => xapi.vif.delete(vif.$ref),
    validate: (isRunning, vif) => {
      if (vif === undefined) {
        throw new JobError(t('job:vif-delete:missing-vif'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (vif.currently_attached) {
        throw new JobError(t('vif-connected'))
      }
    },
  }
})
