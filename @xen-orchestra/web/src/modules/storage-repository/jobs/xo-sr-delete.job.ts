import { xoSrArg } from '@/modules/storage-repository/jobs/xo-sr-args.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoSrDeleteJob = defineJob('sr.delete', [xoSrArg], () => {
  const { t } = useI18n()

  return {
    async run(srs: FrontXoSr[]) {
      const results = await Promise.allSettled(
        srs.map(async sr => {
          return await fetchDelete(`srs/${sr.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete SR ${srs[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, srs: FrontXoSr[] | undefined) => {
      if (!srs || srs.length === 0) {
        throw new JobError(t('job:sr-delete:missing-sr'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
