import { pifsArg } from '@/jobs/args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const usePifForgetJob = defineJob('pif.forget', [pifsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: pifs => xapi.pif.forget(pifs),
    validate: (isRunning, pifs) => {
      if (pifs.length === 0) {
        throw new JobError(t('job:pif-forget:missing-pif'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pif-forget:in-progress'))
      }

      if (pifs.some(pif => pif.management)) {
        throw new JobError(t('job:pif-forget:is-management-interface'))
      }
    },
  }
})
