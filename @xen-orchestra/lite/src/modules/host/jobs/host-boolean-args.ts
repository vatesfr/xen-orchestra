import { defineJobArg } from '@core/packages/job'

export const hostBooleanArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
