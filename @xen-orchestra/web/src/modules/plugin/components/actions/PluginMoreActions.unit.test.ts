import PluginMoreActions from '@/modules/plugin/components/actions/PluginMoreActions.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createPluginActions } from '@/test/create-plugin-actions.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { mount } from '@vue/test-utils'

const { useActions } = vi.hoisted(() => ({
  useActions: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()

  useActions.mockReturnValue(createPluginActions())
})

function mountMoreActions() {
  return mount(PluginMoreActions, {
    props: { plugin: createPlugin() },
    global: createGlobalTestConfig(),
  })
}

it('offers the secondary actions of the plugin', () => {
  const labels = mountMoreActions()
    .findAllComponents(MenuItem)
    .map(menuItem => menuItem.text())

  expect(labels).toEqual(['Enable load at startup', 'Test plugin', 'Delete configuration'])
})
