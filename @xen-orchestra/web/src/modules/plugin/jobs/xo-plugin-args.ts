import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { defineJobArg } from '@core/packages/job'

// `validate` reports a missing plugin, but the job identifies its arguments before
export const xoPluginArg = defineJobArg<FrontXoPlugin>({
  identify: (plugin: FrontXoPlugin | undefined) => plugin?.id,
  toArray: false,
})

export const xoPluginPayloadArg = defineJobArg<unknown>({
  identify: false,
  toArray: false,
})

export const xoPluginStateArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
