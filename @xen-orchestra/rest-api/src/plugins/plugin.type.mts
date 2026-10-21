import type { XoPlugin, XoPluginConfiguration, XoPluginTestData } from '@vates/types'

export type UpdatePluginRequestBody = {
  autoload?: XoPlugin['autoload']
}

export type PluginConfigurationRequestBody = XoPluginConfiguration

// `null` removes an optional property
type NullablePartial<T> = { [K in keyof T]?: undefined extends T[K] ? T[K] | null : T[K] }

export type PluginConfigurationPatchRequestBody = NullablePartial<XoPluginConfiguration>

export type PluginTestRequestBody = {
  /** data matching the plugin `testSchema` */
  data?: XoPluginTestData
}
