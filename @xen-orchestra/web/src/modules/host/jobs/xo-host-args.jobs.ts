import { defineJobArg } from '@core/packages/job'
import type { XoHost } from '@vates/types'

export const xoHostArg = defineJobArg({
  identify: (host: XoHost | undefined) => host?.id,
  toArray: false,
})
