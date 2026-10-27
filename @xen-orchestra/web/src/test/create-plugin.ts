import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'

// The JSON schema form is generic: tests describe any plugin, not only the ones typed in `@vates/types`
type PluginOverrides = Partial<
  Omit<
    FrontXoPlugin,
    'configuration' | 'configurationPresets' | 'configurationSchema' | 'testSchema' | 'testable' | 'unloadable'
  > & {
    configuration: Record<string, unknown>
    configurationPresets: Record<string, Record<string, unknown>>
    configurationSchema: JsonSchema
    testSchema: JsonSchema
    testable: boolean
    unloadable: boolean
  }
>

export const PLUGIN_CONFIGURATION_SCHEMA = {
  type: 'object',
  properties: { host: { type: 'string' } },
} satisfies JsonSchema

/**
 * Builds a fully-populated FrontXoPlugin for use in tests. Pass overrides to
 * tweak only the fields relevant to the case under test.
 */
export function createPlugin(overrides: PluginOverrides = {}): FrontXoPlugin {
  return {
    id: 'transport-email' as FrontXoPlugin['id'],
    name: 'transport-email',
    version: '1.0.0',
    description: 'Send emails',
    keywords: ['email'],
    loaded: true,
    autoload: true,
    unloadable: true,
    configuration: undefined,
    configurationSchema: undefined,
    configurationPresets: undefined,
    configured: true,
    testable: false,
    testSchema: undefined,
    ...overrides,
  } as FrontXoPlugin
}
