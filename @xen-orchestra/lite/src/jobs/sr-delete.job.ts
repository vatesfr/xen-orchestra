import { srsArg } from '@/jobs/args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useSrDeleteJob = defineJob('sr.delete', [srsArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    async run(srs) {
      const results = await Promise.allSettled(srs.map(sr => xapi.sr.destroy(sr.$ref)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete SR ${srs[index]?.uuid}:`, result.reason)
        }
      })

      return results
    },
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
