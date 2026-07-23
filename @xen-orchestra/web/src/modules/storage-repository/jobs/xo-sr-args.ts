import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoSrArg = defineJobArg({
  identify: (sr: FrontXoSr) => sr.id,
  toArray: true,
})

export const xoSrIdArg = defineJobArg<string>({
  identify: false,
  toArray: false,
})
