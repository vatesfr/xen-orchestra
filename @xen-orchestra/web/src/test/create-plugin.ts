import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'

export function createPlugin(overrides: Partial<FrontXoPlugin> = {}): FrontXoPlugin {
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
  }
}
