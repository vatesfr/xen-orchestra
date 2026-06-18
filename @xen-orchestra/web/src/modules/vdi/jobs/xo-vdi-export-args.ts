import type { vdiExportFormat } from '@/shared/constants.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVdiExportFormatArg = defineJobArg<vdiExportFormat>({
  identify: false,
  toArray: false,
})
