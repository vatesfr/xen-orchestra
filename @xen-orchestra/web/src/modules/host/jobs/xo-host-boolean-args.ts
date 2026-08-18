import { defineJobArg } from '@core/packages/job'

export const xoHostBooleanArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
