import type { ToFrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { XoTransportEmailPlugin } from '@vates/types'

type FrontXoTransportEmailPlugin = ToFrontXoPlugin<XoTransportEmailPlugin>

export function createPlugin(overrides: Partial<FrontXoTransportEmailPlugin> = {}): FrontXoTransportEmailPlugin {
  return {
    id: 'transport-email' as FrontXoTransportEmailPlugin['id'],
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
