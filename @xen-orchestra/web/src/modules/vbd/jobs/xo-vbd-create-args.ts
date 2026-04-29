import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsVbdArg = defineJobArg<NewVbdPayload>({
  identify: payload => `${payload.VM}:${payload.VDI}`,
  toArray: true,
})
