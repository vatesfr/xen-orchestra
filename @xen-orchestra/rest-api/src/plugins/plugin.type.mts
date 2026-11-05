import type { XoPlugin, XoPluginConfiguration, XoPluginTestData } from '@vates/types'

export type UpdatePluginRequestBody = {
  autoload?: XoPlugin['autoload']
}

export type PluginConfigurationRequestBody = XoPluginConfiguration

export type PluginTestRequestBody = {
  /** data matching the plugin `testSchema` */
  data?: XoPluginTestData
}
