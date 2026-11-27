import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoaProxyRemoveJob = defineJob('xoa.remove-proxy', [], () => {
  const { t } = useI18n()

  return {
    async run() {
      await fetchDelete('plugins/xoa/proxy')
    },

    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
