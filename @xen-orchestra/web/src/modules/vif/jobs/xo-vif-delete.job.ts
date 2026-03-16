import { xoVifsArg } from '@/modules/vif/jobs/xo-vif-args.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVifDeleteJob = defineJob('vif.delete', [xoVifsArg], () => {
  const { t } = useI18n()

  return {
    async run(vifs: FrontXoVif[]) {
      const results = await Promise.allSettled(
        vifs.map(async vif => {
          return await fetchDelete(`vifs/${vif.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete VIF ${vifs[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vifs: FrontXoVif[]) => {
      if (!vifs || vifs.length === 0) {
        throw new JobError(t('job:vif-delete:missing-vif'))
      }

      if (vifs.some(vif => vif.attached)) {
        throw new JobError(t('job:vif-delete:blocked-operation'))
      }
    },
  }
})
