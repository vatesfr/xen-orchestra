import { xoVmArg } from '@/modules/vm/jobs/xo-vm-args'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection'
import { BASE_URL } from '@/shared/utils/fetch.util'
import { defineJob, defineJobArg, JobError } from '@core/packages/job'
import { downloadFile } from '@core/utils/download-file.utils.ts'
import { useI18n } from 'vue-i18n'

export type VmExportType = 'xva' | 'ova'
export type VmExportCompression = 'none' | 'gzip' | 'zstd'

const xoVmExportTypeArg = defineJobArg<VmExportType>({
  identify: type => type,
  toArray: false,
})

const xoVmExportCompressionArg = defineJobArg<VmExportCompression>({
  identify: compression => compression,
  toArray: false,
})

export const useXoVmExportJob = defineJob('vm.export', [xoVmArg, xoVmExportTypeArg, xoVmExportCompressionArg], () => {
  const { t } = useI18n()

  return {
    async run(vm: FrontXoVm, type: VmExportType, compression: VmExportCompression) {
      const params = new URLSearchParams()

      if (type === 'xva' && compression !== 'none') {
        params.set('compress', compression)
      }

      const query = params.size > 0 ? `?${params.toString()}` : ''
      const url = `${BASE_URL}/vms/${vm.id}.${type}${query}`
      const fileName = `${vm.id}.${type}`

      downloadFile(url, fileName)
    },
    validate(_isRunning: boolean, vm?: FrontXoVm) {
      if (!vm) {
        throw new JobError(t('job:vm-export:missing-vm'))
      }
    },
  }
})
