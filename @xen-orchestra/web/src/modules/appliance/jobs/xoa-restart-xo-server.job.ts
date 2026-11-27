import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoaRestartXoServerJob = defineJob('xoa.restart-xo-server', [], () => {
  const { t } = useI18n()

  return {
    // TEMP: endpoint à créer côté back
    // xo-server coupe la connexion en redémarrant : la réponse peut ne jamais arriver
    async run() {
      await fetchPost('plugins/xoa/actions/restart-xo-server')
    },

    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:xoa-restart-xo-server:in-progress'))
      }
    },
  }
})
