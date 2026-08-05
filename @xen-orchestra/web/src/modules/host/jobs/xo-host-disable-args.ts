import { defineJobArg } from '@core/packages/job'

export const xoHostDisableEvacuateHostArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
