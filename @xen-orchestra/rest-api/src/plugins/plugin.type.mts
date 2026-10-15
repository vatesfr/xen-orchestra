import type { XoPlugin } from '@vates/types'

export type UpdatePluginRequestBody = {
  autoload?: XoPlugin['autoload']
}

export type PluginConfigurationRequestBody = Record<string, unknown>

export type PluginTestRequestBody = {
  /** data matching the plugin `testSchema` */
  data?: unknown
}
