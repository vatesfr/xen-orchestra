import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { xoVdisArg } from '@/modules/vdi/jobs/xo-vdi-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVdiDeleteJob = defineJob('vdi.delete', [xoVdisArg], () => {
  const { t } = useI18n()
  const { getVbdsByIds } = useXoVbdCollection()

  return {
    async run(vdis: FrontXoVdi[]) {
      const results = await Promise.allSettled(
        vdis.map(async vdi => {
          return await fetchDelete(`vdis/${vdi.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete VDI ${vdis[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vdis: FrontXoVdi[]) => {
      if (!vdis || vdis.length === 0) {
        throw new JobError(t('job:vdi-delete:missing-vdi'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (vdis.some(vdi => getVbdsByIds(vdi.$VBDs).some(vbd => vbd.attached))) {
        throw new JobError(t('job:vdi-delete:vbd-attached'))
      }
    },
  }
})
