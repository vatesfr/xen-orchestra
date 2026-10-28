import { xoPifsArg } from '@/modules/pif/jobs/xo-pif-args.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPifForgetJob = defineJob('pif.forget', [xoPifsArg], () => {
  const { t } = useI18n()

  return {
    async run(pifs: FrontXoPif[]) {
      const results = await Promise.allSettled(pifs.map(pif => fetchDelete(`pifs/${pif.id}`)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to forget PIF ${pifs[index].device}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, pifs: FrontXoPif[]) => {
      if (!pifs || pifs.length === 0) {
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
