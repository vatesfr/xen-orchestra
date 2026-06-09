import { defineJobArg } from '@core/packages/job'

export const xoVmSnapshotBeforeArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
