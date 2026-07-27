import { defineJobArg } from '@core/packages/job'

export const xoForceRebootHostArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
