import { defineJobArg } from '@core/packages/job'
import type { XoAuthenticationToken } from '@vates/types'

export const xoAuthenticationTokenArg = defineJobArg({
  identify: (token: XoAuthenticationToken) => token.id,
  toArray: false,
})

export const xoAuthenticationTokensArg = defineJobArg({
  identify: (token: XoAuthenticationToken) => token.id,
  toArray: true,
})
