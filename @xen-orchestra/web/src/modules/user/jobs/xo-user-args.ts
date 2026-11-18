import { defineJobArg } from '@core/packages/job'
import type { XoUser } from '@vates/types'

export const xoUserArg = defineJobArg({
  identify: (user: XoUser) => user.id,
  toArray: false,
})
