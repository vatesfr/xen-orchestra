import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'

// the JSON schema form is generic: tests describe any plugin, not only the ones typed in `@vates/types`
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
