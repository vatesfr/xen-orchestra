import { srsArg } from '@/jobs/args'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useSrDeleteJob = defineJob('sr.delete', [srsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: srs => xapi.sr.destroy(srs.map(sr => sr.$ref)),
    validate: (isRunning, srs) => {
      if (srs.length === 0) {
        throw new JobError(t('job:sr-delete:missing-sr'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
