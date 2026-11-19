import { defineJobArg } from '@core/packages/job'
import type { XoAuthenticationToken } from '@vates/types'

// `validate` reports a missing token, but the job identifies its arguments before
export const xoAuthenticationTokenArg = defineJobArg<XoAuthenticationToken>({
  identify: (token: XoAuthenticationToken | undefined) => token?.id,
  toArray: false,
})

export const xoAuthenticationTokensArg = defineJobArg({
  identify: (token: XoAuthenticationToken) => token.id,
  toArray: true,
})
