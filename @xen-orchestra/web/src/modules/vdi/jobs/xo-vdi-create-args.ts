import type { NewVdiPayload } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsVdiArg = defineJobArg<NewVdiPayload>({
  identify: payload => `${payload.srId}:${payload.name_label}`,
  toArray: true,
})
