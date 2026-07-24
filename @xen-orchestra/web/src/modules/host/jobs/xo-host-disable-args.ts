import { defineJobArg } from '@core/packages/job'

export const xoEvacuateHostArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
