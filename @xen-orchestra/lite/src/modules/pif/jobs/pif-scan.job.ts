import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const usePifScanJob = defineJob('pif.scan', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: host => xapi.pif.scan(host.$ref),
    validate: (isRunning, host) => {
      if (!host) {
        throw new JobError(t('job:pif-scan:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pif-scan:in-progress'))
      }
    },
  }
})
