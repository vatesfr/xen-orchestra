import type { VdiExportFormat } from '@/shared/constants.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVdiExportFormatArg = defineJobArg<VdiExportFormat>({
  identify: false,
  toArray: false,
})
