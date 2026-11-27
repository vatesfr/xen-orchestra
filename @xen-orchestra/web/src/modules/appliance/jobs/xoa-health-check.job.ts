import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoaHealthCheckJob = defineJob('xoa.health-check', [], () => {
  const { t } = useI18n()

  return {
    // TEMP: endpoint à créer côté back (vide le cache du check puis le relance, comme `xoa.clearCheckCache` en XO 5)
    async run() {
      await fetchPost('plugins/xoa/health-check/actions/run')
    },

    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:xoa-health-check:in-progress'))
      }
    },
  }
})
