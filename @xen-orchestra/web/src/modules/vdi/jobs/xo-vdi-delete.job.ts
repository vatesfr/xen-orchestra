import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { xoVdisArg } from '@/modules/vdi/jobs/xo-vdi-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVdiDeleteJob = defineJob('vdi.delete', [xoVdisArg, xoVmArg], () => {
  const { t } = useI18n()
  const { useGetVbdsByIds } = useXoVbdCollection()

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

    validate: (isRunning, vdis: FrontXoVdi[], vm: FrontXoVm | undefined) => {
      if (!vdis || vdis.length === 0) {
        throw new JobError(t('job:vdi-delete:missing-vdi'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      const attachedVbds = vdis.flatMap(vdi => useGetVbdsByIds(vdi.$VBDs).value).filter(vbd => vbd.attached)

      if (attachedVbds.length === 0) {
        return
      }

      if (attachedVbds.some(vbd => vbd.VM === vm?.id)) {
        throw new JobError(t('vm-running'))
      }

      throw new JobError(t('vdi-in-use'))
    },
  }
})
