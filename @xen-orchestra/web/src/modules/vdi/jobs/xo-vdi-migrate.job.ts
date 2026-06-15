import { xoVdisArg } from '@/modules/vdi/jobs/xo-vdi-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

const xoSrIdArg = defineJobArg<string>({
  identify: false,
  toArray: false,
})

export const useXoVdiMigrateJob = defineJob('vdi.migrate', [xoVdisArg, xoSrIdArg], () => {
  const { t } = useI18n()

  return {
    async run(vdis: FrontXoVdi[], srId: string) {
      const results = await Promise.allSettled(vdis.map(vdi => fetchPost(`vdis/${vdi.id}/actions/migrate`, { srId })))
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
