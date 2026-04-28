import { xoVbdsArg } from '@/modules/vbd/jobs/xo-vbd-args.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVbdDeleteJob = defineJob('vbd.delete', [xoVbdsArg], () => {
  const { t } = useI18n()

  return {
    async run(vbds: FrontXoVbd[]) {
      const results = await Promise.allSettled(
        vbds.map(async vbd => {
          return await fetchDelete(`vbds/${vbd.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete VBD ${vbds[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vbds: FrontXoVbd[]) => {
      if (!vbds || vbds.length === 0) {
        throw new JobError(t('job:vbd-delete:missing-vbd'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (vbds.some(vbd => vbd.attached)) {
        throw new JobError(t('job:vbd-delete:vbd-attached'))
      }
    },
  }
})
