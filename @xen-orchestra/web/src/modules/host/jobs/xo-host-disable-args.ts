import { defineJobArg } from '@core/packages/job'

export const xoHostDisableArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
