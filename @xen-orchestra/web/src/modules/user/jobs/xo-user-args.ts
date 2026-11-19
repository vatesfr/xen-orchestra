import { defineJobArg } from '@core/packages/job'
import type { XoUser } from '@vates/types'

// `validate` reports a missing user, but the job identifies its arguments before
export const xoUserArg = defineJobArg<XoUser>({
  identify: (user: XoUser | undefined) => user?.id,
  toArray: false,
})
