import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoPluginArg = defineJobArg({
  identify: (plugin: FrontXoPlugin) => plugin.id,
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
