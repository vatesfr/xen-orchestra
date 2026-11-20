import type { useXoPluginActions as realUseXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createPluginActions } from '@/test/create-plugin-actions.ts'
import { mockModule } from '@/test/spy-on-module.ts'

type PluginActions = ReturnType<typeof createPluginActions>

// The plugin actions run the plugin jobs, which call the REST API: a test reads the plugin they were asked for from
// `useXoPluginActions` and sets the actions they return, reset it in `beforeEach`
export const pluginActionsMock = {
  useXoPluginActions: vi.fn<(...args: unknown[]) => PluginActions>(),
  // The actions `createPluginActions` builds from `overrides` are returned from now on
  setActions(overrides?: Parameters<typeof createPluginActions>[0]) {
    const actions = createPluginActions(overrides)

    this.useXoPluginActions.mockReturnValue(actions)

    return actions
  },
  reset() {
    this.useXoPluginActions.mockReset()
    this.setActions()
  },
}

// Mocked with `mockXoPluginActions()`
export const useXoPluginActions = pluginActionsMock.useXoPluginActions as unknown as typeof realUseXoPluginActions

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoPluginActions() {
  mockModule(
    import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'),
    () => import('@/test/mock-xo-plugin-actions.ts')
  )
}
