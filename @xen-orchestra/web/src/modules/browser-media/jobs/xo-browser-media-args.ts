import { defineJobArg } from '@core/packages/job'

// picked when running the job, so it is not part of its identity
export const xoBrowserMediaIsoFileArg = defineJobArg<File | undefined>({
  identify: false,
  toArray: false,
})
