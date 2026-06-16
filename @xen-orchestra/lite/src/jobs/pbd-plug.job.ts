import { pbdsArg } from '@/jobs/args'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const usePbdPlugJob = defineJob('pbd.plug', [pbdsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: pbds => xapi.pbd.plug(pbds.map(pbd => pbd.$ref)),
    validate: (isRunning, pbds) => {
      if (pbds.length === 0) {
        throw new JobError(t('job:pbd-plug:missing-pbd'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }

      if (pbds.some(pbd => pbd.currently_attached)) {
        throw new JobError(t('job:pbd-plug:pbd-connected'))
      }
    },
  }
})
