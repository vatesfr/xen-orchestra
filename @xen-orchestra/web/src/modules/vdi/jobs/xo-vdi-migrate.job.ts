import { xoSrIdArg } from '@/modules/storage-repository/jobs/xo-sr-args.ts'
import { xoVdisArg } from '@/modules/vdi/jobs/xo-vdi-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVdiMigrateJob = defineJob('vdi.migrate', [xoVdisArg, xoSrIdArg], () => {
  const { t } = useI18n()

  const { monitorTask } = useXoTaskUtils()

  return {
    async run(vdis: FrontXoVdi[], srId: string): Promise<PromiseSettledResult<{ id: FrontXoVdi['id'] }>[]> {
      const results = await Promise.allSettled<{ id: FrontXoVdi['id'] }>(
        vdis.map(async vdi => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`vdis/${vdi.id}/actions/migrate`, { srId })

          return monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to migrate VDI ${vdis[index].id}:`, result.reason)
        }
      })
      return results
    },

    validate: (isRunning, vdis: FrontXoVdi[] | undefined) => {
      if (!vdis || vdis.length === 0) {
        throw new JobError(t('job:vdi-migrate:missing-vdi'))
      }
      if (isRunning) {
        throw new JobRunningError(t('job:migrate:in-progress'))
      }
    },
  }
})
