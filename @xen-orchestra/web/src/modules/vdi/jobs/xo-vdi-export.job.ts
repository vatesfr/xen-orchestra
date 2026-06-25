import { xoVdiArg } from '@/modules/vdi/jobs/xo-vdi-args.ts'
import { xoVdiExportFormatArg } from '@/modules/vdi/jobs/xo-vdi-export-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { VdiExportFormat } from '@/shared/constants.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { downloadFile } from '@core/utils/download-file.utils.ts'
import { useI18n } from 'vue-i18n'

export const useXoVdiExportJob = defineJob('vdi.export', [xoVdiArg, xoVdiExportFormatArg], () => {
  const { t } = useI18n()

  return {
    async run(vdi: FrontXoVdi, format: VdiExportFormat) {
      const url = `${BASE_URL}/vdis/${vdi.id}.${format}`
      const fileName = `${vdi.id}.${format}`
      downloadFile(url, fileName)
    },

    validate: (isRunning, vdi: FrontXoVdi | undefined, format: VdiExportFormat | undefined) => {
      if (!vdi) {
        throw new JobError(t('job:vdi-export:missing-vdi'))
      }

      if (!format) {
        throw new JobError(t('job:vdi-export:format-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:export:in-progress'))
      }
    },
  }
})
