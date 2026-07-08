import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoHostArg = defineJobArg({
  identify: (host: FrontXoHost | undefined) => host?.id,
  toArray: false,
})

export const xoEvacuateHostArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
